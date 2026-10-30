#!/usr/bin/env node
/**
 * The mechanical half of the build-paper-argument skill. Zero dependencies
 * beyond library.mjs and progress.mjs.
 *
 *   node paper-argument.mjs judgements <proposals dir> [<name>...] [--canvas <argument.canvas>]
 *   node paper-argument.mjs shape <library.canvas> [<argument.canvas>]
 *   node paper-argument.mjs check <argument.canvas> [--library <library.canvas>] [--root <dir>]
 *
 * `judgements` lists what the paper may claim: the held and failed Conjectures
 * of every handed-over round. `shape` measures the library's canvases, as
 * testimony of how the field's papers are built. `check` reads the paper's
 * Argument DAG for what canvas-output.md fixes, and for card faults the author
 * should see. Which judgement becomes which argument, and how strong a Claim
 * reads, is the agent's and the author's; nothing here decides it.
 */

import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkCanvas, InvalidInput, LABELS, loadLibrary, readJson, UsageError } from "../../build-argument-library/scripts/library.mjs";
import { field, parseRecord, proposalCards } from "../../implement-proposal/scripts/progress.mjs";

// the id prefix of a card names its kind; the bold line under its title says the same in words
export const KINDS = {
  n: "**Native Argument**",
  i: "**Argument (Introduction)**",
  m: "**Argument (Method)**",
  r: "**Argument (Result)**",
  d: "**Argument (Discussion)**",
  e: "**End Argument**",
};
const UNTYPED = new Set(["paper", "legend"]);
export const RANKS = ["main", "secondary", "side"];
const REQUIRED = ["Claim", "Grounds", "Warrant"];
const CLAIMABLE = ["held", "failed"];
const JUDGED = ["held", "failed", "not done"];
// the agent enters a failed Conjecture only as a limit or an objection; elsewhere it is the author's choice
const FAILED_SECTIONS = ["Qualifier", "Rebuttal"];
// Obsidian canvas colour preset 1 (red) marks every Rebuttal edge
const REBUTTAL_COLOR = "1";

// `<name>/round-<k>:C<n>`: a judged Conjecture of a proposal
const CONJECTURE_REF = /`([A-Za-z0-9._-]+)\/round-(\d+):(C\d+)`/g;
// `<paper key>:<card id>`: a card of the Argument Library
const LIBRARY_REF = /`([A-Za-z0-9._-]+):([^`\s/][^`\s]*)`/g;
// a backticked path: a file of the project
const FILE_REF = /`([^`\s:]+\/[^`\s]*|[^`\s:/]+\.[A-Za-z0-9]+)`/g;
const ROUND_FILE = /^round-(\d+)\.progress\.md$/;

export const USAGE = `usage:
  paper-argument.mjs judgements <proposals dir> [<name>...] [--canvas <argument.canvas>]
                                       the held and failed Conjectures of every handed-over round;
                                       with --canvas, which of them the canvas does not cite yet
  paper-argument.mjs shape <library.canvas> [<argument.canvas>]
                                       cards, depth and width per level of each library paper (and of the canvas)
  paper-argument.mjs check <argument.canvas> [--library <library.canvas>] [--root <dir>]
                                       check the paper's Argument DAG; --root is the project (default: .)

errors go to stderr with a non-zero exit, all of them at once; card faults go to stdout.`;

const q = (v) => JSON.stringify(v);

// ---------------------------------------------------------------- cards

/** The text under `## <head>` of a card, up to the next heading or the trailing `Source:` / `Cites:` lines. */
export function section(text, head) {
  const lines = (text ?? "").split("\n");
  const start = lines.findIndex((l) => l.trim() === `## ${head}`);
  if (start === -1) return null;
  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,6}\s/.test(line) || /^(Source|Cites):/.test(line.trim())) break;
    body.push(line);
  }
  return body.join("\n").trim();
}

/** The card's title: its first non-empty line, without the heading marks. */
export const title = (text) => ((text ?? "").split("\n").find((l) => l.trim() !== "") ?? "").replace(/^#+\s*/, "").trim();

export const conjectureRefs = (text) => [...(text ?? "").matchAll(CONJECTURE_REF)].map((m) => ({ name: m[1], round: Number(m[2]), id: m[3], ref: `${m[1]}/round-${m[2]}:${m[3]}` }));
export const libraryRefs = (text) => [...(text ?? "").matchAll(LIBRARY_REF)].filter((m) => !m[2].startsWith("//")).map((m) => ({ paper: m[1], id: `${m[1]}:${m[2]}` }));
export const fileRefs = (text) => [...(text ?? "").matchAll(FILE_REF)].map((m) => m[1]).filter((p) => !/^[A-Za-z0-9._-]+\/round-\d+:/.test(p));

const kindOf = (id) => (/^([a-z])-/.exec(id) ?? [])[1];

/** The items of a section: one per `- ` bullet, or the whole text when it has none. */
function items(text) {
  const bullets = [];
  for (const line of (text ?? "").split("\n")) {
    if (/^\s*[-*]\s/.test(line)) bullets.push(line);
    else if (bullets.length > 0 && line.trim() !== "") bullets[bullets.length - 1] += ` ${line.trim()}`;
  }
  return bullets.length > 0 ? bullets : [text ?? ""].filter((t) => t.trim() !== "");
}

// ---------------------------------------------------------------- progress records

/** The Conjectures of one round, with their status and Result line, from its progress record and canvas. */
function roundConjectures(dir, n) {
  const record = parseRecord(readFileSync(join(dir, `round-${n}.progress.md`), "utf-8"));
  const cs = record.cards.filter((c) => /^C\d+$/.test(c.id ?? ""));
  let claims = new Map();
  const canvasPath = join(dir, `round-${n}.canvas`);
  if (existsSync(canvasPath)) {
    claims = new Map(proposalCards(readJson(canvasPath)).map((c) => [c.id, field(c.node.text, "Claim")]));
  }
  return cs.map((c) => ({ id: c.id, status: c.status, result: field(c.body.join("\n"), "Result"), claim: claims.get(c.id) ?? null }));
}

/** Every round of every `<name>` (or of `names`), each with whether it is handed over and its Conjectures. */
export function rounds(proposalsDir, names = []) {
  let dirs;
  try {
    dirs = readdirSync(proposalsDir).filter((d) => statSync(join(proposalsDir, d)).isDirectory()).sort();
  } catch (e) {
    throw new InvalidInput([`${proposalsDir}: cannot read (${e.code ?? e.message})`]);
  }
  const unknown = names.filter((n) => !dirs.includes(n));
  if (unknown.length > 0) throw new InvalidInput(unknown.map((n) => `${proposalsDir}: no proposal ${q(n)}`));
  const found = [];
  for (const name of names.length > 0 ? names : dirs) {
    const ns = readdirSync(join(proposalsDir, name))
      .map((f) => f.match(ROUND_FILE))
      .filter(Boolean)
      .map((m) => Number(m[1]))
      .sort((a, b) => a - b);
    for (const n of ns) {
      const conjectures = roundConjectures(join(proposalsDir, name), n);
      const handedOver = conjectures.length > 0 && conjectures.every((c) => JUDGED.includes(c.status));
      found.push({ name, round: n, handedOver, conjectures });
    }
  }
  return found;
}

function runJudgements(args, out) {
  const canvasAt = args.indexOf("--canvas");
  let cited = null;
  if (canvasAt !== -1) {
    if (!args[canvasAt + 1]) throw new UsageError("--canvas needs a path");
    const canvas = readJson(args[canvasAt + 1]);
    cited = new Set(canvas.nodes.flatMap((n) => conjectureRefs(n.text).map((r) => r.ref)));
    args = [...args.slice(0, canvasAt), ...args.slice(canvasAt + 2)];
  }
  if (args.length === 0) throw new UsageError("judgements takes the proposals directory");
  const [dir, ...names] = args;
  for (const r of rounds(dir, names)) {
    if (!r.handedOver) {
      out(`${r.name}/round-${r.round} · not handed over · skipped\n`);
      continue;
    }
    for (const c of r.conjectures.filter((c) => CLAIMABLE.includes(c.status))) {
      const ref = `${r.name}/round-${r.round}:${c.id}`;
      const mark = cited === null ? "" : cited.has(ref) ? " · on canvas" : " · new";
      out(`${ref} · ${c.status}${mark}\n  Claim: ${c.claim ?? "(not found on the round's canvas)"}\n  Result: ${c.result ?? "(none)"}\n`);
    }
  }
}

// ---------------------------------------------------------------- shape

/** Cards, depth (longest chain, in cards) and the number of cards on each level of a DAG. */
export function shape(ids, edges) {
  const into = new Map(ids.map((id) => [id, []]));
  for (const e of edges) if (into.has(e.toNode) && into.has(e.fromNode)) into.get(e.toNode).push(e.fromNode);
  const level = new Map();
  const visiting = new Set();
  const levelOf = (id) => {
    if (level.has(id)) return level.get(id);
    if (visiting.has(id)) return 0; // a cycle: check reports it; here it only must not recurse forever
    visiting.add(id);
    const l = Math.max(0, ...into.get(id).map((f) => levelOf(f) + 1));
    visiting.delete(id);
    level.set(id, l);
    return l;
  };
  ids.forEach(levelOf);
  const widths = [];
  for (const l of level.values()) widths[l] = (widths[l] ?? 0) + 1;
  return { cards: ids.length, depth: widths.length, widths: [...widths].map((w) => w ?? 0) };
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length === 0 ? 0 : s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/** The shape of every paper of a library canvas, keyed by paper; identity cards and groups are left out. */
export function libraryShapes(library) {
  const papers = new Map();
  for (const n of library.nodes) {
    if (n.type === "group" || !n.id.includes(":")) continue;
    const [paper, card] = n.id.split(":");
    if (card === "paper") continue;
    if (!papers.has(paper)) papers.set(paper, []);
    papers.get(paper).push(n.id);
  }
  const edges = library.edges ?? [];
  return new Map([...papers].sort().map(([paper, ids]) => [paper, shape(ids, edges.filter((e) => e.fromNode.startsWith(`${paper}:`) && e.toNode.startsWith(`${paper}:`)))]));
}

const shapeLine = (label, s) => `${label} · ${s.cards} cards · depth ${s.depth} · per level ${s.widths.join(" ")}\n`;

function runShape(args, out) {
  if (args.length < 1 || args.length > 2) throw new UsageError("shape takes a library canvas and, optionally, the paper's canvas");
  const shapes = libraryShapes(loadLibrary(args[0]));
  for (const [paper, s] of shapes) out(shapeLine(paper, s));
  const all = [...shapes.values()];
  out(`median · ${median(all.map((s) => s.cards))} cards · depth ${median(all.map((s) => s.depth))} · widest level ${median(all.map((s) => Math.max(...s.widths)))}\n`);
  if (args[1]) {
    const canvas = readJson(args[1]);
    const ids = canvas.nodes.filter((n) => n.type === "text" && !UNTYPED.has(n.id)).map((n) => n.id);
    out(shapeLine("this canvas", shape(ids, canvas.edges ?? [])));
  }
}

// ---------------------------------------------------------------- check

const NUM = String.raw`(\d+(?:\.\d+)?(?:\s*[–-]\s*\d+(?:\.\d+)?)?)`;
const UNIT = String.raw`(%|[A-Za-zσμ☉/_]+)`;
const norm = (t) => (t ?? "").replace(/−/g, "-").replace(/\s+/g, " ");

/** `[number, unit]` pairs: a number or range followed by a unit word or `%`. */
export function quantities(text) {
  return [...norm(text).matchAll(new RegExp(String.raw`(?<![\d.\w])${NUM}\s*${UNIT}`, "g"))].map((m) => [m[1].replace(/\s+/g, ""), m[2]]);
}

const range = (num) => {
  const parts = num.split(/[–-]/).map(Number);
  return parts.length === 2 ? parts : null;
};

/** Faults of one card the author should see: a title's number its body does not state, a Claim range its Grounds contradict. */
export function cardFaults(card) {
  const faults = [];
  const body = [section(card.text, "Claim"), section(card.text, "Grounds"), section(card.text, "Warrant")].join("\n");
  // a range states its ends too: a title may round "40–60 %" to "40 %"
  const stated = new Set(quantities(body).flatMap(([n, u]) => [n, ...(range(n) ?? []).map(String)].map((x) => `${x} ${u}`)));
  const decimals = (norm(body).match(/\b0\.\d+\b/g) ?? []).map(Number);
  for (const [n, u] of quantities(title(card.text))) {
    if (stated.has(`${n} ${u}`)) continue;
    if (u === "%" && range(n) === null && decimals.some((d) => Math.abs(d * 100 - Number(n)) <= 0.5)) continue;
    faults.push(`card ${q(card.id)}: the title states ${n} ${u}; its Claim, Grounds and Warrant do not`);
  }
  const ranges = (t) => quantities(t).map(([n, u]) => [range(n), u]).filter(([r]) => r !== null);
  const grounds = ranges(section(card.text, "Grounds"));
  for (const [[lo, hi], u] of ranges(section(card.text, "Claim"))) {
    const same = grounds.filter(([, gu]) => gu === u);
    if (same.length > 0 && !same.some(([[glo, ghi]]) => glo <= hi && ghi >= lo)) {
      faults.push(`card ${q(card.id)}: the Claim's ${lo}–${hi} ${u} overlaps none of its Grounds' ranges in ${u}`);
    }
  }
  return faults;
}

/** Cards that lie on a cycle, by depth-first search. */
function cycles(ids, edges) {
  const out = new Map(ids.map((id) => [id, []]));
  for (const e of edges) out.get(e.fromNode)?.push(e.toNode);
  const state = new Map();
  const onCycle = new Set();
  const stack = [];
  const visit = (id) => {
    state.set(id, "open");
    stack.push(id);
    for (const next of out.get(id) ?? []) {
      if (state.get(next) === "open") stack.slice(stack.indexOf(next)).forEach((c) => onCycle.add(c));
      else if (!state.has(next)) visit(next);
    }
    stack.pop();
    state.set(id, "done");
  };
  ids.forEach((id) => state.has(id) || visit(id));
  return onCycle;
}

/**
 * Problems and faults of the paper's Argument DAG. `judgements` maps
 * `<name>/round-<k>:C<n>` to its status; `library` is the library canvas or
 * null; `exists` says whether a project path exists.
 */
export function checkArgument(canvas, { judgements = new Map(), library = null, exists = () => true } = {}) {
  const problems = checkCanvas(canvas);
  if (problems.length > 0) return { problems, faults: [] };
  const faults = [];
  const cards = canvas.nodes.filter((n) => n.type === "text" && !UNTYPED.has(n.id));
  const ids = new Set(cards.map((c) => c.id));
  const edges = canvas.edges ?? [];
  const libraryIds = library ? new Set(library.nodes.map((n) => n.id)) : null;

  for (const card of cards) {
    const where = `card ${q(card.id)}`;
    const kind = kindOf(card.id);
    if (!KINDS[kind]) {
      problems.push(`${where}: the id starts with none of ${Object.keys(KINDS).map((k) => `${k}-`).join(" ")}`);
      continue;
    }
    if (!card.text.split("\n").some((l) => l.trim() === KINDS[kind])) problems.push(`${where}: no line ${KINDS[kind]}`);
    for (const head of REQUIRED) if (!section(card.text, head)) problems.push(`${where}: no ## ${head}`);

    if (kind === "e") {
      const rank = (section(card.text, "Rank") ?? "").split(/\s/)[0];
      if (!RANKS.includes(rank)) problems.push(`${where}: ## Rank must start with one of ${RANKS.join(", ")}`);
      for (const head of ["Sentence", "Reader"]) if (!section(card.text, head)) problems.push(`${where}: no ## ${head}`);
    }

    // a judgement named twice on one card is one fact about that card
    for (const ref of new Map(conjectureRefs(card.text).map((r) => [r.ref, r])).values()) {
      const status = judgements.get(ref.ref);
      if (status === undefined) problems.push(`${where}: cites ${ref.ref}, which no progress record holds`);
      else if (!CLAIMABLE.includes(status)) problems.push(`${where}: cites ${ref.ref}, which is ${status}; only held and failed Conjectures enter the paper`);
      else if (status === "failed") {
        const outside = ["Claim", "Grounds", "Warrant", "Backing"].filter((h) => (section(card.text, h) ?? "").includes(ref.ref));
        if (outside.length > 0) faults.push(`${where}: cites failed ${ref.ref} under ${outside.join(", ")}; the agent enters a failed Conjecture only as ${FAILED_SECTIONS.join(" or ")}, so this stands only as the author's choice`);
      }
    }
    if (libraryIds) {
      for (const ref of libraryRefs(card.text)) if (!libraryIds.has(ref.id)) problems.push(`${where}: names ${ref.id}, which is not a card of the library`);
    }
    for (const path of fileRefs(card.text)) if (!exists(path)) problems.push(`${where}: names ${path}, which is not in the project`);

    for (const item of items(section(card.text, "Grounds"))) {
      if (!/\d/.test(item.replace(/`[^`]*`/g, ""))) continue;
      const sourced = conjectureRefs(item).length + libraryRefs(item).length + fileRefs(item).length > 0 || [...ids].some((id) => new RegExp(`(^|[^\\w-])${id}([^\\w-]|$)`).test(item));
      if (!sourced) problems.push(`${where}: a Grounds item states a number but names no Conjecture, file, library card or card: ${q(item.trim().slice(0, 80))}`);
    }
    faults.push(...cardFaults(card));
  }

  for (const [i, edge] of edges.entries()) {
    const where = `edge ${q(edge.id ?? i)}`;
    if (!LABELS.includes(edge.label)) problems.push(`${where}: label ${q(edge.label ?? "")} is none of ${LABELS.join(", ")}`);
    if (edge.label === "Rebuttal" && edge.color !== REBUTTAL_COLOR) problems.push(`${where}: a Rebuttal edge is red (colour ${REBUTTAL_COLOR})`);
    if (ids.has(edge.fromNode) && kindOf(edge.fromNode) === "e") problems.push(`${where}: End Argument ${q(edge.fromNode)} is used by ${q(edge.toNode)}; nothing in the paper uses an End`);
  }

  const ends = cards.filter((c) => kindOf(c.id) === "e");
  const mains = ends.filter((c) => (section(c.text, "Rank") ?? "").startsWith("main"));
  if (ends.length > 0 && mains.length !== 1) problems.push(`${mains.length} End Arguments ranked main; exactly one is`);
  if (ends.length === 0) problems.push("no End Argument");

  const typed = edges.filter((e) => ids.has(e.fromNode) && ids.has(e.toNode));
  const onCycle = cycles([...ids], typed);
  if (onCycle.size > 0) problems.push(`circular dependency through: ${[...onCycle].sort().join(", ")}`);
  const reaches = new Set(ends.map((c) => c.id));
  for (let grew = true; grew; ) {
    grew = false;
    for (const e of typed) if (reaches.has(e.toNode) && !reaches.has(e.fromNode)) grew = reaches.add(e.fromNode);
  }
  for (const id of [...ids].filter((id) => !reaches.has(id)).sort()) problems.push(`card ${q(id)}: no path to an End Argument`);
  return { problems, faults };
}

function runCheck(args, out) {
  const opts = { library: null, root: "." };
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--library" || args[i] === "--root") {
      if (!args[i + 1]) throw new UsageError(`${args[i]} needs a path`);
      opts[args[i].slice(2)] = args[++i];
    } else rest.push(args[i]);
  }
  if (rest.length !== 1) throw new UsageError("check takes the paper's canvas");
  const path = rest[0];
  const canvas = readJson(path);
  const library = opts.library ? loadLibrary(opts.library) : null;
  const judgements = new Map();
  const proposals = join(opts.root, "proposals");
  if (existsSync(proposals)) {
    for (const r of rounds(proposals)) for (const c of r.conjectures) judgements.set(`${r.name}/round-${r.round}:${c.id}`, c.status);
  }
  const exists = (p) => existsSync(resolve(opts.root, p));
  const { problems, faults } = checkArgument(canvas, { judgements, library, exists });
  for (const f of faults) out(`fault: ${f}\n`);
  if (problems.length > 0) throw new InvalidInput(problems.map((p) => `${path}: ${p}`));
  out(`ok ${path}${faults.length > 0 ? ` (${faults.length} card faults)` : ""}\n`);
}

// ---------------------------------------------------------------- main

/** Run one command; returns the process exit code. */
export function run(argv, io = {}) {
  const out = io.stdout ?? ((s) => process.stdout.write(s));
  const err = io.stderr ?? ((s) => process.stderr.write(s));
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    out(`${USAGE}\n`);
    return argv.length === 0 ? 2 : 0;
  }
  const [command, ...rest] = argv;
  try {
    if (command === "judgements") runJudgements(rest, out);
    else if (command === "shape") runShape(rest, out);
    else if (command === "check") runCheck(rest, out);
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
