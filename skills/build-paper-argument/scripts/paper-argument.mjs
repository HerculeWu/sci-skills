#!/usr/bin/env node
/**
 * The mechanical half of the build-paper-argument skill. Zero dependencies
 * beyond library.mjs, progress.mjs and json-schema.mjs.
 *
 *   node paper-argument.mjs judgements <proposals dir> [<name>...] [--argument <argument.json>]
 *   node paper-argument.mjs shape <library.canvas> [<argument.json>]
 *   node paper-argument.mjs check <argument.json> [--library <library.canvas>] [--root <dir>]
 *
 * `judgements` lists what the paper may claim: the held and failed Conjectures
 * of every handed-over round. `shape` measures the library's canvases, as
 * testimony of how the field's papers are built. `check` validates the paper's
 * Argument DAG against ../schema/argument.schema.json, then for what the schema
 * cannot state (argument-output.md), and reports card faults the author should
 * see. Which judgement becomes which argument, and how strong a Claim reads, is
 * the agent's and the author's; nothing here decides it.
 */

import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { InvalidInput, loadLibrary, readJson, UsageError } from "../../build-argument-library/scripts/library.mjs";
import { field, parseRecord, proposalCards } from "../../implement-proposal/scripts/progress.mjs";
import { validate } from "./json-schema.mjs";

export const SCHEMA_PATH = fileURLToPath(new URL("../schema/argument.schema.json", import.meta.url));
let schemaCache = null;
export const schema = () => (schemaCache ??= JSON.parse(readFileSync(SCHEMA_PATH, "utf-8")));

// the id prefix of an argument names its kind
export const KINDS = { n: "native", i: "intro", m: "method", r: "result", d: "discussion", e: "end" };
export const RANKS = ["main", "secondary", "side"];
const CLAIMABLE = ["held", "failed"];
const JUDGED = ["held", "failed", "not done"];
// the agent enters a failed Conjecture only as a limit or an objection; elsewhere it is the author's choice
const FAILED_PARTS = ["Qualifier", "Rebuttal"];

/** The parts of an argument an outline may name, by the names the outline uses. */
export const PARTS = {
  Title: "title",
  Claim: "claim",
  Grounds: "grounds",
  Warrant: "warrant",
  Backing: "backing",
  Qualifier: "qualifier",
  Rebuttal: "rebuttal",
  Rank: "rank",
  Sentence: "sentence",
  Reader: "reader",
};

// `<name>/round-<k>:C<n>`: a judged Conjecture of a proposal
const JUDGEMENT = /^([A-Za-z0-9._-]+)\/round-(\d+):(C\d+)$/;
const CONJECTURE_REF = /`([A-Za-z0-9._-]+)\/round-(\d+):(C\d+)`/g;
// `<paper key>:<card id>`: a card of the Argument Library
const LIBRARY = /^([A-Za-z0-9._-]+):([^\s/]\S*)$/;
const LIBRARY_REF = /`([A-Za-z0-9._-]+):([^`\s/][^`\s]*)`/g;
// a backticked path: a file of the project
const FILE_REF = /`([^`\s:]+\/[^`\s]*|[^`\s:/]+\.[A-Za-z0-9]+)`/g;
const ROUND_FILE = /^round-(\d+)\.progress\.md$/;

export const USAGE = `usage:
  paper-argument.mjs judgements <proposals dir> [<name>...] [--argument <argument.json>]
                                       the held and failed Conjectures of every handed-over round;
                                       with --argument, which of them the graph does not cite yet
  paper-argument.mjs shape <library.canvas> [<argument.json>]
                                       cards, depth and width per level of each library paper (and of the graph)
  paper-argument.mjs check <argument.json> [--library <library.canvas>] [--root <dir>]
                                       check the paper's Argument DAG; --root is the project (default: .)

errors go to stderr with a non-zero exit, all of them at once; card faults go to stdout.`;

const q = (v) => JSON.stringify(v);

// ---------------------------------------------------------------- arguments

export const kindOf = (id) => (/^([a-z])-/.exec(id ?? "") ?? [])[1];

/** The text of one part of an argument, by its outline name (`Claim`, `Grounds`...); null when absent or empty. */
export function part(arg, name) {
  const key = PARTS[Object.keys(PARTS).find((p) => p.toLowerCase() === String(name).toLowerCase())];
  if (!key) return null;
  if (key === "grounds") {
    const items = (arg.grounds ?? []).map((g) => `- ${g.text}`);
    return items.length > 0 ? items.join("\n") : null;
  }
  const v = arg[key];
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

/** Every text an argument holds: its parts, its Grounds' sources, its sources and cites. */
export function argumentText(arg) {
  return [
    arg.title,
    arg.claim,
    ...(arg.grounds ?? []).flatMap((g) => [g.text, g.source]),
    arg.warrant,
    arg.backing,
    arg.qualifier,
    arg.rebuttal,
    arg.sentence,
    arg.reader,
    ...(arg.sources ?? []),
    ...(arg.cites ?? []),
  ]
    .filter((t) => typeof t === "string" && t !== "")
    .join("\n");
}

export const conjectureRefs = (text) => [...(text ?? "").matchAll(CONJECTURE_REF)].map((m) => ({ name: m[1], round: Number(m[2]), id: m[3], ref: `${m[1]}/round-${m[2]}:${m[3]}` }));
export const libraryRefs = (text) => [...(text ?? "").matchAll(LIBRARY_REF)].filter((m) => !m[2].startsWith("//")).map((m) => ({ paper: m[1], id: `${m[1]}:${m[2]}` }));
export const fileRefs = (text) => [...(text ?? "").matchAll(FILE_REF)].map((m) => m[1]).filter((p) => !/^[A-Za-z0-9._-]+\/round-\d+:/.test(p));

/** What a bare source string names: a judgement, a node of this graph, a library card, or else a project file. */
export function classify(source, ids = new Set()) {
  const s = source.trim();
  const j = JUDGEMENT.exec(s);
  if (j) return { type: "judgement", ref: s, name: j[1], round: Number(j[2]), id: j[3] };
  if (ids.has(s)) return { type: "node", ref: s };
  const l = LIBRARY.exec(s);
  if (l) return { type: "library", ref: s, paper: l[1] };
  return { type: "file", ref: s };
}

/**
 * Every reference an argument makes, with the part it is made in: the bare
 * Grounds sources and `sources`, and the backticked judgements, library cards
 * and files inside its texts.
 */
export function references(arg, ids = new Set()) {
  const out = [];
  const inText = (text, where) => {
    for (const r of conjectureRefs(text)) out.push({ type: "judgement", ref: r.ref, where });
    for (const r of libraryRefs(text)) out.push({ type: "library", ref: r.id, paper: r.paper, where });
    for (const p of fileRefs(text)) out.push({ type: "file", ref: p, where });
  };
  for (const [name, key] of Object.entries(PARTS)) if (key !== "grounds" && typeof arg[key] === "string") inText(arg[key], name);
  for (const g of arg.grounds ?? []) {
    inText(g.text, "Grounds");
    if (typeof g.source === "string" && g.source.trim() !== "") out.push({ ...classify(g.source, ids), where: "Grounds" });
  }
  for (const s of arg.sources ?? []) if (typeof s === "string" && s.trim() !== "") out.push({ ...classify(s, ids), where: "sources" });
  return out;
}

/** The project files an argument names. */
export const filesOf = (arg, ids) => [...new Set(references(arg, ids).filter((r) => r.type === "file").map((r) => r.ref))];

/** Parse an argument.json; throws when it cannot be read or is not JSON. */
export const readArgument = (path) => readJson(path);

/** Where in the graph a schema path points, named by ids where it can be. */
function locate(graph, path) {
  const [top, index, ...rest] = path;
  const tail = rest.map((k) => (typeof k === "number" ? `[${k}]` : `.${k}`)).join("").replace(/^\./, "");
  const item = Array.isArray(graph?.[top]) && typeof index === "number" ? graph[top][index] : undefined;
  let head;
  if (item === undefined) head = path.map((k) => (typeof k === "number" ? `[${k}]` : `.${k}`)).join("").replace(/^\./, "") || "the file";
  else if (top === "edges") head = `edge ${index} (${item?.from} → ${item?.to})`;
  else if (typeof item?.id === "string") head = `${top === "figures" ? "figure" : "argument"} ${q(item.id)}`;
  else head = `${top}[${index}]`;
  return item !== undefined && tail ? `${head}: ${tail}` : head;
}

/** The graph's problems against argument.schema.json, one line each. */
export function schemaProblems(graph) {
  return validate(schema(), graph).map((e) => `${locate(graph, e.path)} ${e.message}${e.rule ? ` (${e.rule})` : ""}`);
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
  const at = args.indexOf("--argument");
  let cited = null;
  if (at !== -1) {
    if (!args[at + 1]) throw new UsageError("--argument needs a path");
    const graph = readArgument(args[at + 1]);
    cited = new Set((graph.arguments ?? []).flatMap((a) => references(a).filter((r) => r.type === "judgement").map((r) => r.ref)));
    args = [...args.slice(0, at), ...args.slice(at + 2)];
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
      const mark = cited === null ? "" : cited.has(ref) ? " · in the graph" : " · new";
      out(`${ref} · ${c.status}${mark}\n  Claim: ${c.claim ?? "(not found on the round's canvas)"}\n  Result: ${c.result ?? "(none)"}\n`);
    }
  }
}

// ---------------------------------------------------------------- shape

/** Cards, depth (longest chain, in cards) and the number of cards on each level of a DAG; edges are `{from, to}`. */
export function shape(ids, edges) {
  const into = new Map(ids.map((id) => [id, []]));
  for (const e of edges) if (into.has(e.to) && into.has(e.from)) into.get(e.to).push(e.from);
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
  const edges = (library.edges ?? []).map((e) => ({ from: e.fromNode, to: e.toNode }));
  return new Map([...papers].sort().map(([paper, ids]) => [paper, shape(ids, edges.filter((e) => e.from.startsWith(`${paper}:`) && e.to.startsWith(`${paper}:`)))]));
}

const shapeLine = (label, s) => `${label} · ${s.cards} cards · depth ${s.depth} · per level ${s.widths.join(" ")}\n`;

function runShape(args, out) {
  if (args.length < 1 || args.length > 2) throw new UsageError("shape takes a library canvas and, optionally, the paper's argument.json");
  const shapes = libraryShapes(loadLibrary(args[0]));
  for (const [paper, s] of shapes) out(shapeLine(paper, s));
  const all = [...shapes.values()];
  out(`median · ${median(all.map((s) => s.cards))} cards · depth ${median(all.map((s) => s.depth))} · widest level ${median(all.map((s) => Math.max(...s.widths)))}\n`);
  if (args[1]) {
    const graph = readArgument(args[1]);
    out(shapeLine("this graph", shape((graph.arguments ?? []).map((a) => a.id), graph.edges ?? [])));
  }
}

// ---------------------------------------------------------------- check

const NUM = String.raw`(\d+(?:\.\d+)?(?:\s*[–-]\s*\d+(?:\.\d+)?)?)`;
const UNIT = String.raw`(%|[A-Za-zσμ☉/_]+)`;
const norm = (t) => (t ?? "").replace(/−/g, "-").replace(/\s+/g, " ");

/** `[number, unit]` pairs: a number or range followed by a unit word or `%`; a digit right after a comma (`r_J,0`) is a subscript. */
export function quantities(text) {
  return [...norm(text).matchAll(new RegExp(String.raw`(?<![\d.,\w])${NUM}\s*${UNIT}`, "g"))].map((m) => [m[1].replace(/\s+/g, ""), m[2]]);
}

const range = (num) => {
  const parts = num.split(/[–-]/).map(Number);
  return parts.length === 2 ? parts : null;
};

/** Faults of one argument the author should see: a title's number its body does not state, a Claim range its Grounds contradict. */
export function cardFaults(arg) {
  const faults = [];
  const body = [part(arg, "Claim"), part(arg, "Grounds"), part(arg, "Warrant")].join("\n");
  // a range states its ends too: a title may round "40–60 %" to "40 %"
  const stated = new Set(quantities(body).flatMap(([n, u]) => [n, ...(range(n) ?? []).map(String)].map((x) => `${x} ${u}`)));
  const decimals = (norm(body).match(/\b0\.\d+\b/g) ?? []).map(Number);
  for (const [n, u] of quantities(arg.title)) {
    if (stated.has(`${n} ${u}`)) continue;
    if (u === "%" && range(n) === null && decimals.some((d) => Math.abs(d * 100 - Number(n)) <= 0.5)) continue;
    faults.push(`argument ${q(arg.id)}: the title states ${n} ${u}; its Claim, Grounds and Warrant do not`);
  }
  const ranges = (t) => quantities(t).map(([n, u]) => [range(n), u]).filter(([r]) => r !== null);
  const grounds = ranges(part(arg, "Grounds"));
  for (const [[lo, hi], u] of ranges(part(arg, "Claim"))) {
    const same = grounds.filter(([, gu]) => gu === u);
    if (same.length > 0 && !same.some(([[glo, ghi]]) => glo <= hi && ghi >= lo)) {
      faults.push(`argument ${q(arg.id)}: the Claim's ${lo}–${hi} ${u} overlaps none of its Grounds' ranges in ${u}`);
    }
  }
  return faults;
}

/** Nodes that lie on a cycle, by depth-first search. */
function cycles(ids, edges) {
  const out = new Map(ids.map((id) => [id, []]));
  for (const e of edges) out.get(e.from)?.push(e.to);
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
 * Problems and faults of the paper's Argument DAG. The schema comes first:
 * when the graph does not match it, its problems are all that is reported.
 * `judgements` maps `<name>/round-<k>:C<n>` to its status; `library` is the
 * library canvas or null; `exists` says whether a project path exists;
 * `paperId` is the `<paper>` name, when known.
 */
export function checkArgument(graph, { judgements = new Map(), library = null, exists = () => true, paperId = null } = {}) {
  const problems = schemaProblems(graph);
  if (problems.length > 0) return { problems, faults: [] };
  const faults = [];
  const args = graph.arguments;
  const nodes = [...args, ...graph.figures];
  const ids = new Set();
  for (const n of nodes) {
    if (ids.has(n.id)) problems.push(`id ${q(n.id)} is used twice`);
    ids.add(n.id);
  }
  const argIds = new Set(args.map((a) => a.id));
  const libraryIds = library ? new Set(library.nodes.map((n) => n.id)) : null;
  if (paperId !== null && graph.paper.id !== paperId) problems.push(`paper.id ${q(graph.paper.id)} is not the paper's name ${q(paperId)}`);

  for (const arg of args) {
    const where = `argument ${q(arg.id)}`;
    const refs = references(arg, ids);
    // a judgement named twice in one argument is one fact about that argument
    const judged = new Map();
    for (const r of refs.filter((r) => r.type === "judgement")) {
      if (!judged.has(r.ref)) judged.set(r.ref, new Set());
      judged.get(r.ref).add(r.where);
    }
    for (const [ref, parts] of judged) {
      const status = judgements.get(ref);
      if (status === undefined) problems.push(`${where}: cites ${ref}, which no progress record holds`);
      else if (!CLAIMABLE.includes(status)) problems.push(`${where}: cites ${ref}, which is ${status}; only held and failed Conjectures enter the paper`);
      else if (status === "failed") {
        const outside = ["Claim", "Grounds", "Warrant", "Backing"].filter((p) => parts.has(p));
        if (outside.length > 0) faults.push(`${where}: cites failed ${ref} under ${outside.join(", ")}; the agent enters a failed Conjecture only as ${FAILED_PARTS.join(" or ")}, so this stands only as the author's choice`);
      }
    }
    for (const [i, g] of arg.grounds.entries()) {
      if (typeof g.source !== "string") continue;
      const c = classify(g.source, ids);
      const status = c.type === "judgement" ? judgements.get(c.ref) : undefined;
      if (CLAIMABLE.includes(status) && !g.text.trim().toLowerCase().startsWith(status)) {
        problems.push(`${where}: grounds[${i}] rests on ${c.ref}, which is ${status}; its text starts with ${q(status)}`);
      }
    }
    if (libraryIds) {
      for (const r of refs.filter((r) => r.type === "library")) if (!libraryIds.has(r.ref)) problems.push(`${where}: names ${r.ref}, which is not a card of the library`);
    }
    for (const path of new Set(refs.filter((r) => r.type === "file").map((r) => r.ref))) {
      if (!exists(path)) problems.push(`${where}: names ${path}, which is not a judgement, a library card, a node of this graph or a file of the project`);
    }
    faults.push(...cardFaults(arg));
  }

  for (const f of graph.figures) {
    // a figure's file is a path; a table's may be its label instead
    const isPath = f.kind === "figure" || /[/]|\.[A-Za-z0-9]+$/.test(f.file ?? "");
    if (f.file !== null && isPath && !exists(f.file)) problems.push(`figure ${q(f.id)}: ${f.file} is not in the project`);
  }

  const seen = new Set();
  const typed = [];
  for (const [i, e] of graph.edges.entries()) {
    const where = `edge ${i} (${e.from} → ${e.to})`;
    const key = `${e.from} ${e.to} ${e.role}`;
    if (seen.has(key)) problems.push(`${where}: repeats ${e.role}`);
    seen.add(key);
    if (!ids.has(e.from)) problems.push(`${where}: ${q(e.from)} is no argument or figure`);
    if (!argIds.has(e.to)) problems.push(`${where}: ${q(e.to)} is no argument`);
    if (ids.has(e.from) && argIds.has(e.to)) typed.push(e);
  }

  const onCycle = cycles([...ids], typed);
  if (onCycle.size > 0) problems.push(`circular dependency through: ${[...onCycle].sort().join(", ")}`);
  const reaches = new Set(args.filter((a) => a.kind === "end").map((a) => a.id));
  for (let grew = true; grew; ) {
    grew = false;
    for (const e of typed) if (reaches.has(e.to) && !reaches.has(e.from)) grew = reaches.add(e.from);
  }
  for (const id of [...ids].filter((id) => !reaches.has(id)).sort()) problems.push(`${argIds.has(id) ? "argument" : "figure"} ${q(id)}: no path to an End Argument`);
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
  if (rest.length !== 1) throw new UsageError("check takes the paper's argument.json");
  const path = rest[0];
  const graph = readArgument(path);
  const library = opts.library ? loadLibrary(opts.library) : null;
  const judgements = new Map();
  const proposals = join(opts.root, "proposals");
  if (existsSync(proposals)) {
    for (const r of rounds(proposals)) for (const c of r.conjectures) judgements.set(`${r.name}/round-${r.round}:${c.id}`, c.status);
  }
  const exists = (p) => existsSync(resolve(opts.root, p));
  const paperId = basename(dirname(resolve(path)));
  const { problems, faults } = checkArgument(graph, { judgements, library, exists, paperId });
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
