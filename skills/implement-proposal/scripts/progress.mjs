#!/usr/bin/env node
/**
 * The mechanical half of the implement-proposal skill. Zero dependencies
 * beyond library.mjs and proposal.mjs.
 *
 *   node progress.mjs fingerprint <round-N.canvas> <V<n>|C<n>>
 *   node progress.mjs init <round-N.canvas>
 *   node progress.mjs align <round-N.canvas> <round-N.progress.md>
 *   node progress.mjs check <round-N.progress.md>
 *   node progress.mjs status <proposals dir>
 *
 * Only what must come out the same every session lives here: fingerprints,
 * reading canvas JSON, comparing the record with the canvas, the record's
 * format. `init` is the only command that writes; the agent edits the record
 * itself. Whether a Conjecture held is the user's judgement; nothing here
 * reads results.
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkCanvas, InvalidInput, readJson, UsageError } from "../../build-argument-library/scripts/library.mjs";
import { tags } from "../../research-proposal/scripts/proposal.mjs";

export const V_STATUSES = ["not started", "in progress", "waiting", "done", "dropped"];
export const C_STATUSES = ["open", "result in", "held", "failed", "not done"];
const JUDGED = ["held", "failed", "not done"];
const UNTOUCHED = ["not started", "open"];

const CANVAS_FILE = /^round-(\d+)\.canvas$/;
const CARD_HEADING = /^#+\s*(V\d+|C\d+)\s*·\s*(Verification|Conjecture)\b/;
const RECORD_HEADING = /^### (\S+) · (.*)$/;
const FROM_ROUND = /^from round (\d+)$/;
const FINGERPRINT = /^\*\*(design|claim \+ criterion)\*\*: (sha256:[0-9a-f]{8})\b/;
const DATE = "\\d{4}-\\d{2}-\\d{2}";
const SECTIONS = ["## Verifications", "## Conjectures", "## Log"];

export const USAGE = `usage:
  progress.mjs fingerprint <round-N.canvas> <V<n>|C<n>>      print the fingerprint of one card
  progress.mjs init <round-N.canvas>                         write round-N.progress.md next to the canvas
  progress.mjs align <round-N.canvas> <round-N.progress.md>  list cards new, gone or changed since the record
  progress.mjs check <round-N.progress.md>                   check the record's format
  progress.mjs status <proposals dir>                        the latest round of every <name>, and how far it is judged

errors go to stderr with a non-zero exit, all of them at once.`;

const q = (v) => JSON.stringify(v);
const byNumber = (a, b) => b.id[0].localeCompare(a.id[0]) || Number(a.id.slice(1)) - Number(b.id.slice(1)); // "V" sorts before "C"

/** Whitespace collapsed to single spaces and trimmed, so re-wrapping a card does not count as a change. */
export const normalize = (text) => text.replace(/\s+/g, " ").trim();

/**
 * The text of a bold field on a card: what follows `**<label>**:`, up to the
 * next blank line or the next line that starts with `**`. Null when absent.
 */
export function field(text, label) {
  const lines = (text ?? "").split("\n");
  const prefix = `**${label}**:`;
  const start = lines.findIndex((l) => l.trim().startsWith(prefix));
  if (start === -1) return null;
  const parts = [lines[start].trim().slice(prefix.length)];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === "" || line.trim().startsWith("**")) break;
    parts.push(line);
  }
  return normalize(parts.join(" "));
}

/** The Verification and Conjecture cards of a proposal canvas, recognised by their headings, V before C. */
export function proposalCards(canvas) {
  const found = [];
  const problems = [];
  const seen = new Set();
  for (const node of canvas.nodes ?? []) {
    const heading = (node.text ?? "").split("\n").find((l) => l.trim() !== "") ?? "";
    const m = heading.trim().match(CARD_HEADING);
    if (!m || (m[1][0] === "V") !== (m[2] === "Verification")) continue;
    if (seen.has(m[1])) problems.push(`two cards are headed ${m[1]}`);
    seen.add(m[1]);
    found.push({ id: m[1], node });
  }
  if (problems.length > 0) throw new InvalidInput(problems);
  return found.sort(byNumber);
}

/** `sha256:<8 hex>` of a card: a Verification's Design, a Conjecture's Claim and criterion. */
export function fingerprint(card) {
  const text = card.node.text;
  let source;
  if (card.id.startsWith("V")) {
    source = field(text, "Design (argument)");
    if (source === null) throw new InvalidInput([`${card.id}: no **Design (argument)**: field`]);
  } else {
    const claim = field(text, "Claim");
    const criterion = field(text, "Rebuttal (criterion)");
    const missing = [claim === null && "**Claim**:", criterion === null && "**Rebuttal (criterion)**:"].filter(Boolean);
    if (missing.length > 0) throw new InvalidInput([`${card.id}: no ${missing.join(" or ")} field`]);
    source = `${claim}\n${criterion}`;
  }
  return `sha256:${createHash("sha256").update(source).digest("hex").slice(0, 8)}`;
}

/** The parts of a progress record, as far as they can be read; `check` says what is wrong with them. */
export function parseRecord(text) {
  const lines = text.split("\n");
  const record = { title: lines.find((l) => l.trim() !== "") ?? "", sections: [], cards: [], log: [], stray: [] };
  let section = null;
  let card = null;
  for (const [i, line] of lines.entries()) {
    if (line.startsWith("## ")) {
      section = line.trim();
      record.sections.push(section);
      card = null;
    } else if (line.startsWith("### ")) {
      const m = line.trim().match(RECORD_HEADING);
      card = { heading: line.trim(), id: m?.[1] ?? null, status: m?.[2].trim() ?? null, section, line: i + 1, body: [] };
      record.cards.push(card);
    } else if (section === "## Log") {
      if (line.trim() !== "") record.log.push({ line: i + 1, text: line });
    } else if (card) {
      card.body.push(line);
    }
  }
  return record;
}

function readText(path) {
  try {
    return readFileSync(path, "utf-8");
  } catch (e) {
    throw new InvalidInput([`${path}: cannot read (${e.code ?? e.message})`]);
  }
}

function loadProposal(path) {
  const canvas = readJson(path);
  const problems = checkCanvas(canvas, { identity: false });
  if (problems.length > 0) throw new InvalidInput(problems.map((p) => `${path}: ${p}`));
  try {
    return proposalCards(canvas);
  } catch (e) {
    if (e instanceof InvalidInput) throw new InvalidInput(e.problems.map((p) => `${path}: ${p}`));
    throw e;
  }
}

function roundOf(canvasPath) {
  const m = basename(canvasPath).match(CANVAS_FILE);
  if (!m) throw new UsageError(`${canvasPath}: not named round-N.canvas`);
  return Number(m[1]);
}

const recordPath = (dir, n) => join(dir, `round-${n}.progress.md`);

// ---------------------------------------------------------------- fingerprint

function runFingerprint(args, out) {
  if (args.length !== 2) throw new UsageError("fingerprint takes a canvas and a card id");
  const [canvasPath, id] = args;
  const card = loadProposal(canvasPath).find((c) => c.id === id);
  if (!card) throw new InvalidInput([`${canvasPath}: no card headed ${id}`]);
  out(`${fingerprint(card)}\n`);
}

// ---------------------------------------------------------------- init

/** Where a `from round k` Conjecture came from: the card of round k with the same Claim, and its status there. */
function carriedOver(card, dir) {
  const tag = tags(card.node).map((t) => t.match(FROM_ROUND)).find(Boolean);
  if (!tag) return null;
  const k = Number(tag[1]);
  const claim = field(card.node.text, "Claim");
  const oldCanvas = join(dir, `round-${k}.canvas`);
  if (!existsSync(oldCanvas)) return { k, match: null, reason: `round-${k}.canvas does not exist` };
  const match = loadProposal(oldCanvas).find((c) => c.id.startsWith("C") && claim !== null && field(c.node.text, "Claim") === claim);
  if (!match) return { k, match: null, reason: `no Conjecture of round-${k}.canvas has the same Claim` };
  const oldRecord = recordPath(dir, k);
  const status = existsSync(oldRecord) ? (parseRecord(readText(oldRecord)).cards.find((c) => c.id === match.id)?.status ?? "no record") : "no record";
  return { k, match: match.id, status };
}

/** The text of a new record, and what the agent still has to settle about carried-over Conjectures. */
export function initialRecord(name, n, cards, origins, today) {
  const vs = cards.filter((c) => c.id.startsWith("V"));
  const cs = cards.filter((c) => c.id.startsWith("C"));
  const lines = [
    `# Progress · ${name} · round ${n}`,
    "",
    `Canvas: \`round-${n}.canvas\` · started ${today} · written by the agent; the user may edit it, the file wins over memory.`,
    "",
    "## Verifications",
    "",
  ];
  for (const v of vs) lines.push(`### ${v.id} · not started`, "");
  lines.push("## Conjectures", "");
  for (const c of cs) {
    lines.push(`### ${c.id} · open`);
    const origin = origins.get(c.id);
    if (origin) lines.push(origin.match ? `**from round ${origin.k}**: ${origin.match} · ${origin.status}` : `**from round ${origin.k}**: → no match`);
    lines.push("");
  }
  lines.push("## Log", "", `- ${today} · Record created from the canvas: ${vs.length} Verifications not started, ${cs.length} Conjectures open.`, "");
  return lines.join("\n");
}

function runInit(args, out, today) {
  if (args.length !== 1) throw new UsageError("init takes one canvas");
  const [canvasPath] = args;
  const n = roundOf(canvasPath);
  const dir = dirname(resolve(canvasPath));
  const target = recordPath(dir, n);
  if (existsSync(target)) throw new InvalidInput([`${target}: already exists; init writes a new record only`]);
  const cards = loadProposal(canvasPath);
  const origins = new Map();
  for (const c of cards.filter((c) => c.id.startsWith("C"))) {
    const origin = carriedOver(c, dir);
    if (origin) origins.set(c.id, origin);
  }
  writeFileSync(target, initialRecord(basename(dir), n, cards, origins, today));
  out(`wrote ${target}\n`);
  for (const [id, o] of origins) {
    if (o.match) out(`from round ${o.k}: ${id} is ${o.match} (${o.status}); add its results and what it was waiting on from round-${o.k}.progress.md\n`);
    else out(`no match: ${id} (from round ${o.k}): ${o.reason}; ask the user\n`);
  }
}

// ---------------------------------------------------------------- align

/** Cards new on the canvas, gone from it, or changed since their fingerprint was taken. */
export function alignment(cards, record) {
  const onCanvas = new Map(cards.map((c) => [c.id, c]));
  const inRecord = record.cards.filter((c) => c.id);
  const recorded = new Set(inRecord.map((c) => c.id));
  const added = cards.filter((c) => !recorded.has(c.id)).map((c) => c.id);
  const gone = inRecord.filter((c) => !onCanvas.has(c.id)).map((c) => `${c.id} (${UNTOUCHED.includes(c.status) ? "no progress" : c.status})`);
  const changed = [];
  for (const c of inRecord.filter((c) => onCanvas.has(c.id))) {
    const fp = c.body.map((l) => l.trim().match(FINGERPRINT)).find(Boolean);
    if (!fp) continue;
    let now;
    try {
      now = fingerprint(onCanvas.get(c.id));
    } catch (e) {
      if (!(e instanceof InvalidInput)) throw e;
      now = "field missing";
    }
    if (now !== fp[2]) changed.push(`${c.id} (${fp[1]} ${fp[2]} in the record, now ${now})`);
  }
  return { added, gone, changed };
}

function runAlign(args, out) {
  if (args.length !== 2) throw new UsageError("align takes a canvas and a progress record");
  const [canvasPath, progressPath] = args;
  const { added, gone, changed } = alignment(loadProposal(canvasPath), parseRecord(readText(progressPath)));
  if (added.length + gone.length + changed.length === 0) return out("aligned\n");
  if (added.length > 0) out(`new: ${added.join(", ")}\n`);
  if (gone.length > 0) out(`gone: ${gone.join(", ")}\n`);
  if (changed.length > 0) out(`changed: ${changed.join(", ")}\n`);
}

// ---------------------------------------------------------------- check

/** The lines of a card's list field (`**Results**`, `**Decided**`): the `- ` lines up to the next bold field. */
function listField(body, label) {
  const start = body.findIndex((l) => l.trim() === `**${label}**`);
  if (start === -1) return null;
  const items = [];
  for (const line of body.slice(start + 1)) {
    if (line.trim().startsWith("**")) break;
    if (line.trim().startsWith("- ")) items.push(line.trim());
  }
  return items;
}

const hasLine = (body, re) => body.some((l) => re.test(l.trim()));

/** Problems with a record's format; empty when it passes. */
export function checkRecord(record) {
  const problems = [];
  if (!/^# Progress · .+ · round \d+$/.test(record.title.trim())) problems.push(`first line is not "# Progress · <name> · round N"`);
  for (const s of SECTIONS) if (!record.sections.includes(s)) problems.push(`no "${s}" section`);
  for (const s of record.sections) if (!SECTIONS.includes(s)) problems.push(`unknown section "${s}"`);

  const seen = new Set();
  for (const card of record.cards) {
    const where = `line ${card.line}`;
    if (!card.id) {
      problems.push(`${where}: heading ${q(card.heading)} is not "### <V<n>|C<n>> · <status>"`);
      continue;
    }
    if (seen.has(card.id)) problems.push(`${where}: ${card.id} appears twice`);
    seen.add(card.id);
    const isV = /^V\d+$/.test(card.id);
    const isC = /^C\d+$/.test(card.id);
    if (!isV && !isC) {
      problems.push(`${where}: ${q(card.id)} is neither V<n> nor C<n>`);
      continue;
    }
    if (isV && card.section !== "## Verifications") problems.push(`${where}: ${card.id} is outside "## Verifications"`);
    if (isC && card.section !== "## Conjectures") problems.push(`${where}: ${card.id} is outside "## Conjectures"`);
    const statuses = isV ? V_STATUSES : C_STATUSES;
    if (!statuses.includes(card.status)) {
      problems.push(`${where}: ${card.id} has status ${q(card.status)}, not one of ${statuses.join(", ")}`);
      continue;
    }
    const need = (ok, what) => ok || problems.push(`${where}: ${card.id} is ${card.status} but has no ${what}`);
    const b = card.body;
    if (isV) {
      if (["in progress", "waiting"].includes(card.status)) need(hasLine(b, /^\*\*on\*\*:\s*\S/), "**on**: line");
      if (["in progress", "done"].includes(card.status)) need(hasLine(b, /^\*\*design\*\*: sha256:[0-9a-f]{8}\b/), "**design**: sha256:<8 hex> fingerprint");
      if (card.status === "done") need((listField(b, "Results") ?? []).some((l) => !/^- \(none/.test(l)), "file under **Results**");
      if (card.status === "dropped") need(hasLine(b, new RegExp(`user, ${DATE}: ".+"`)), `user's words (user, <date>: "…")`);
    } else {
      const result = hasLine(b, /^\*\*Result\*\*:\s*\S/);
      const fp = hasLine(b, /^\*\*claim \+ criterion\*\*: sha256:[0-9a-f]{8}\b/);
      const user = hasLine(b, new RegExp(`^\\*\\*User\\*\\*: ${DATE}: ".+"`));
      if (card.status === "result in") {
        need(fp, "**claim + criterion**: sha256:<8 hex> fingerprint");
        need(hasLine(b, /^\*\*Result\*\*:.*refuting condition:/), "**Result**: line with \"refuting condition:\"");
      }
      if (["held", "failed"].includes(card.status)) {
        need(fp, "**claim + criterion**: sha256:<8 hex> fingerprint");
        need(result, "**Result**: line");
      }
      if (JUDGED.includes(card.status)) need(user, `**User**: <date>: "<the user's words>" line`);
    }
  }
  const logLine = new RegExp(`^- ${DATE} · `);
  for (const entry of record.log) if (!logLine.test(entry.text)) problems.push(`line ${entry.line}: Log line does not start with "- YYYY-MM-DD · "`);
  return problems;
}

function runCheck(args, out) {
  if (args.length !== 1) throw new UsageError("check takes one progress record");
  const [path] = args;
  const problems = checkRecord(parseRecord(readText(path)));
  if (problems.length > 0) throw new InvalidInput(problems.map((p) => `${path}: ${p}`));
  out(`ok ${path}\n`);
}

// ---------------------------------------------------------------- status

/** One line per `<name>`: its latest round and how far that round's Conjectures are judged. */
export function statusLines(proposalsDir) {
  let names;
  try {
    names = readdirSync(proposalsDir).filter((d) => statSync(join(proposalsDir, d)).isDirectory()).sort();
  } catch (e) {
    throw new InvalidInput([`${proposalsDir}: cannot read (${e.code ?? e.message})`]);
  }
  const lines = [];
  for (const name of names) {
    const rounds = readdirSync(join(proposalsDir, name))
      .map((f) => f.match(CANVAS_FILE))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    if (rounds.length === 0) continue;
    const n = Math.max(...rounds);
    const path = recordPath(join(proposalsDir, name), n);
    let state = "no record";
    if (existsSync(path)) {
      const cs = parseRecord(readText(path)).cards.filter((c) => /^C\d+$/.test(c.id ?? ""));
      const judged = cs.filter((c) => JUDGED.includes(c.status)).length;
      state = cs.length > 0 && judged === cs.length ? "handed over" : `${judged} of ${cs.length} judged`;
    }
    lines.push(`${name} · round ${n} · ${state}`);
  }
  return lines;
}

function runStatus(args, out) {
  if (args.length !== 1) throw new UsageError("status takes the proposals directory");
  const lines = statusLines(args[0]);
  out(lines.length > 0 ? `${lines.join("\n")}\n` : `no round-N.canvas under ${args[0]}\n`);
}

// ---------------------------------------------------------------- main

/** Run one command; returns the process exit code. */
export function run(argv, io = {}) {
  const out = io.stdout ?? ((s) => process.stdout.write(s));
  const err = io.stderr ?? ((s) => process.stderr.write(s));
  const today = io.today ?? new Date().toISOString().slice(0, 10);
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    out(`${USAGE}\n`);
    return argv.length === 0 ? 2 : 0;
  }
  const [command, ...rest] = argv;
  try {
    if (command === "fingerprint") runFingerprint(rest, out);
    else if (command === "init") runInit(rest, out, today);
    else if (command === "align") runAlign(rest, out);
    else if (command === "check") runCheck(rest, out);
    else if (command === "status") runStatus(rest, out);
    else throw new UsageError(`unknown command: ${command}`);
    return 0;
  } catch (e) {
    if (e instanceof InvalidInput) {
      for (const problem of e.problems) err(`error: ${problem}\n`);
      return 1;
    }
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
  process.exitCode = run(process.argv.slice(2));
}
