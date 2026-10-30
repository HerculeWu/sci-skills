#!/usr/bin/env node
/**
 * Standalone NASA ADS query script for the find-papers skill. Zero
 * dependencies, read-only: it sends one search request per invocation and
 * prints one JSON object per paper on stdout. It writes no files and keeps no
 * cache.
 *
 *   node ads.mjs search '<ADS query>' [--rows N]
 *   node ads.mjs similar <bibcode>... [--rows N]
 *   node ads.mjs useful <bibcode>... [--rows N]
 *   node ads.mjs bibtex [<key>=]<bibcode>...
 *
 * The token is read from ~/.ads/dev_key only and is never printed.
 */

import { readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://api.adsabs.harvard.edu/v1/search/query";
const EXPORT = "https://api.adsabs.harvard.edu/v1/export/bibtex";
const FL = "bibcode,title,author,year,pub,citation_count,doi,abstract,score";
const TIMEOUT_MS = 30_000;
const MAX_ROWS = 50;
const MAX_AUTHORS = 10;
// similar/useful defaults match the ArgelanderSpace workbench Discovery sizes.
const DEFAULT_ROWS = { search: 20, similar: 18, useful: 6 };

export const USAGE = `usage:
  ads.mjs search '<ADS query>' [--rows N]     free ADS query, e.g. 'author:"Kroupa, P" abs:"tidal tails"'
  ads.mjs similar <bibcode>... [--rows N]     papers ADS ranks as similar to the given paper(s)
  ads.mjs useful <bibcode>... [--rows N]      references most cited by the given paper(s)
  ads.mjs bibtex [<key>=]<bibcode>...         BibTeX entries as ADS exports them, keyed <key> where given

rows: 1-${MAX_ROWS} (defaults: search ${DEFAULT_ROWS.search}, similar ${DEFAULT_ROWS.similar}, useful ${DEFAULT_ROWS.useful}); results are in ADS relevance order.
output: JSONL on stdout, one paper per line (bibtex: BibTeX); errors on stderr with a non-zero exit.
token: ~/.ads/dev_key`;

/** A wrong invocation (exit 2), as opposed to a failed request (exit 1). */
export class UsageError extends Error {}

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (command === "bibtex") return { command, operands: parseKeyed(rest), rows: null };
  if (!(command in DEFAULT_ROWS)) {
    throw new UsageError(command ? `unknown command: ${command}` : "missing command");
  }
  let rows = DEFAULT_ROWS[command];
  const operands = [];
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    const inline = /^--rows=(.*)$/.exec(arg);
    if (arg === "--rows" || inline) {
      const raw = inline ? inline[1] : rest[++i];
      if (!/^\d+$/.test(raw ?? "") || Number(raw) < 1 || Number(raw) > MAX_ROWS) {
        throw new UsageError(`--rows must be an integer from 1 to ${MAX_ROWS}`);
      }
      rows = Number(raw);
    } else if (arg.startsWith("--")) {
      throw new UsageError(`unknown option: ${arg}`);
    } else {
      operands.push(arg);
    }
  }
  if (command === "search") {
    if (operands.length !== 1 || operands[0].trim() === "") {
      throw new UsageError("search takes exactly one query string (quote it for the shell)");
    }
  } else if (operands.length === 0) {
    throw new UsageError(`${command} needs at least one bibcode`);
  }
  return { command, operands, rows };
}

/** `[<key>=]<bibcode>` operands as `{ key, bibcode }`; the key defaults to the bibcode. */
export function parseKeyed(operands) {
  if (operands.length === 0) throw new UsageError("bibtex needs at least one bibcode");
  return operands.map((op) => {
    if (op.startsWith("--")) throw new UsageError(`unknown option: ${op}`);
    const at = op.indexOf("=");
    const key = at === -1 ? null : op.slice(0, at);
    const bibcode = at === -1 ? op : op.slice(at + 1);
    if (key !== null && !/^[A-Za-z0-9._:-]+$/.test(key)) throw new UsageError(`not a BibTeX key: ${JSON.stringify(key)}`);
    quoteBibcode(bibcode);
    return { key: key ?? bibcode, bibcode };
  });
}

/** Give each exported entry its key: ADS keys every entry by its bibcode. */
export function rekey(bibtex, keyed) {
  const byBibcode = new Map(keyed.map((k) => [k.bibcode, k.key]));
  return bibtex.replace(/^(@\w+\{)([^,\n]+),/gm, (whole, head, bibcode) => (byBibcode.has(bibcode.trim()) ? `${head}${byBibcode.get(bibcode.trim())},` : whole));
}

/** Quote one bibcode for a Solr query; bibcodes are identifiers, never query text. */
export function quoteBibcode(bibcode) {
  if (bibcode.trim() === "" || bibcode.length > 64 || /[\u0000-\u001f\u007f]/.test(bibcode)) {
    throw new UsageError(`not a bibcode: ${JSON.stringify(bibcode)}`);
  }
  return `"${bibcode.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function buildQuery(command, operands) {
  if (command === "search") return operands[0];
  return `${command}(${operands.map((b) => `bibcode:${quoteBibcode(b)}`).join(" OR ")})`;
}

export function readToken(home = homedir()) {
  let token = "";
  try {
    token = readFileSync(join(home, ".ads", "dev_key"), "utf-8").trim();
  } catch {
    // missing or unreadable is reported the same way as empty
  }
  if (!token) throw new Error("no ADS token: put your API key in ~/.ads/dev_key");
  return token;
}

export function toRow(doc, rank) {
  const authors = Array.isArray(doc.author) ? doc.author.filter((a) => typeof a === "string") : [];
  const year = Number.parseInt(String(doc.year ?? ""), 10);
  return {
    rank,
    bibcode: doc.bibcode,
    title: Array.isArray(doc.title) ? (doc.title[0] ?? "") : String(doc.title ?? ""),
    authors: authors.slice(0, MAX_AUTHORS),
    author_count: authors.length,
    year: Number.isNaN(year) ? null : year,
    pub: typeof doc.pub === "string" ? doc.pub : null,
    citation_count: typeof doc.citation_count === "number" ? doc.citation_count : null,
    doi: Array.isArray(doc.doi) && typeof doc.doi[0] === "string" ? doc.doi[0] : null,
    score: typeof doc.score === "number" ? doc.score : null,
    abstract: typeof doc.abstract === "string" ? doc.abstract : null,
  };
}

/** fetch() hides the reason in `cause`, which for multi-address hosts is an AggregateError. */
function networkReason(e) {
  const cause = e instanceof Error ? e.cause : undefined;
  const codes = [cause, ...(cause?.errors ?? [])].map((c) => c?.code).filter(Boolean);
  const detail = [...new Set(codes)].join(", ") || cause?.message;
  const message = e instanceof Error ? e.message : String(e);
  return detail ? `${message}: ${detail}` : message;
}

/** Solr puts the reason in `error.msg`, after a long echo of the request parameters. */
function providerMessage(text) {
  try {
    const msg = JSON.parse(text)?.error?.msg;
    if (typeof msg === "string" && msg !== "") return msg.replace(/\s+/g, " ").slice(0, 300);
  } catch {
    // not JSON: fall through to the raw body
  }
  return text.replace(/\s+/g, " ").slice(0, 300);
}

async function request(url, token, fetchImpl, init = {}) {
  let res;
  try {
    res = await fetchImpl(url, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") {
      throw new Error(`ADS request timed out after ${TIMEOUT_MS / 1000}s`);
    }
    throw new Error(`cannot reach ADS (${networkReason(e)})`);
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error(`ADS rejected the token in ~/.ads/dev_key (HTTP ${res.status})`);
  }
  if (res.status === 429) {
    const retry = res.headers.get("retry-after");
    throw new Error(`ADS rate limit exceeded${retry ? ` (retry after ${retry}s)` : ""}`);
  }
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    // a 400 here is almost always a malformed query; ADS says why in the body
    throw new Error(`ADS HTTP ${res.status}: ${providerMessage(text)}`);
  }
  return text;
}

async function query(q, rows, token, fetchImpl) {
  const url = `${BASE}?${new URLSearchParams({ q, fl: FL, rows: String(rows), sort: "score desc" })}`;
  const text = await request(url, token, fetchImpl);
  let docs;
  try {
    docs = JSON.parse(text)?.response?.docs;
  } catch {
    docs = undefined;
  }
  if (!Array.isArray(docs)) throw new Error("ADS returned an unexpected response");
  return docs;
}

async function exportBibtex(keyed, token, fetchImpl) {
  const text = await request(EXPORT, token, fetchImpl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bibcode: keyed.map((k) => k.bibcode) }),
  });
  let bibtex;
  try {
    bibtex = JSON.parse(text)?.export;
  } catch {
    bibtex = undefined;
  }
  if (typeof bibtex !== "string") throw new Error("ADS returned an unexpected response");
  const missing = keyed.filter((k) => !bibtex.includes(`{${k.bibcode},`));
  return { bibtex: rekey(bibtex, keyed), missing };
}

/** Run one command; returns the process exit code. Seams exist for offline tests. */
export async function run(argv, io = {}) {
  const out = io.stdout ?? ((s) => process.stdout.write(s));
  const err = io.stderr ?? ((s) => process.stderr.write(s));
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    out(`${USAGE}\n`);
    return argv.length === 0 ? 2 : 0;
  }
  try {
    const { command, operands, rows } = parseArgs(argv);
    if (command === "bibtex") {
      const { bibtex, missing } = await exportBibtex(operands, readToken(io.home), io.fetchImpl ?? fetch);
      for (const k of missing) err(`note: ADS exported no entry for ${k.bibcode}\n`);
      out(bibtex.endsWith("\n") ? bibtex : `${bibtex}\n`);
      return 0;
    }
    const q = buildQuery(command, operands);
    const token = readToken(io.home);
    const docs = await query(q, rows, token, io.fetchImpl ?? fetch);
    // materialize every line before printing so a bad record cannot leave half an output
    const lines = docs
      .filter((d) => typeof d?.bibcode === "string" && d.bibcode !== "")
      .map((d, i) => JSON.stringify(toRow(d, i + 1)));
    if (lines.length === 0) err("note: ADS returned no papers for this query\n");
    else out(`${lines.join("\n")}\n`);
    return 0;
  } catch (e) {
    err(`error: ${e instanceof Error ? e.message : String(e)}\n`);
    if (e instanceof UsageError) {
      err(`${USAGE}\n`);
      return 2;
    }
    return 1;
  }
}

// realpath: skills are usually installed as symlinks, and argv[1] keeps the link path
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await run(process.argv.slice(2));
}
