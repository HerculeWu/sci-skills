#!/usr/bin/env node
/**
 * The mechanical half of the build-argument-library skill. Zero dependencies.
 *
 *   node library.mjs check <paper.canvas>...
 *   node library.mjs merge <link-list.json> <library.canvas>
 *
 * `check` validates per-paper canvases written by read-a-paper. `merge` joins
 * them into one library canvas: a group per paper, the cross-paper edges of
 * the link list, and its Audit Notes appended to the cards they name. Which
 * citation links to which argument is the agent's judgement and arrives in the
 * link list; nothing here decides it.
 */

import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LABELS = ["Grounds", "Warrant", "Backing", "Rebuttal"];
const IDENTITY_ID = "paper";
// a key becomes an id prefix, so it must not contain the ":" separator
const KEY = /^[A-Za-z0-9._-]+$/;
const PAD = 60;
const GAP_X = 240;
const GAP_Y = 320;
// Obsidian canvas colour presets: 1 red, 6 purple
const NOTE_COLOR = "1";
const LINK_COLOR = "6";

export const USAGE = `usage:
  library.mjs check <paper.canvas>...                  validate per-paper canvases
  library.mjs merge <link-list.json> <library.canvas>  write the library canvas (overwrites it)

canvas paths in the link list are relative to the link list's directory.
errors go to stderr with a non-zero exit; merge writes nothing unless every input is valid.`;

/** A wrong invocation (exit 2), as opposed to invalid input (exit 1). */
export class UsageError extends Error {}

/** Invalid canvases or link list; `problems` holds every reason found, not just the first. */
export class InvalidInput extends Error {
  constructor(problems) {
    super(problems.join("\n"));
    this.problems = problems;
  }
}

const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const q = (v) => JSON.stringify(v);

/** Problems that would break merging or leave the paper unidentifiable; empty when the canvas is usable. */
export function checkCanvas(canvas) {
  if (!isObject(canvas) || !Array.isArray(canvas.nodes)) return ["no `nodes` array"];
  const problems = [];
  const ids = new Set();
  for (const [i, node] of canvas.nodes.entries()) {
    if (!isObject(node) || typeof node.id !== "string" || node.id === "") {
      problems.push(`node ${i} has no id`);
      continue;
    }
    if (ids.has(node.id)) problems.push(`duplicate node id ${q(node.id)}`);
    ids.add(node.id);
    for (const field of ["x", "y", "width", "height"]) {
      if (!Number.isFinite(node[field])) problems.push(`node ${q(node.id)} has no numeric ${field}`);
    }
  }
  if (!ids.has(IDENTITY_ID)) problems.push(`no identity card (a card with id ${q(IDENTITY_ID)})`);
  const edges = canvas.edges ?? [];
  if (!Array.isArray(edges)) return [...problems, "`edges` is not an array"];
  for (const [i, edge] of edges.entries()) {
    for (const end of ["fromNode", "toNode"]) {
      if (!ids.has(edge?.[end])) problems.push(`edge ${q(edge?.id ?? i)}: ${end} ${q(edge?.[end])} is not a card`);
    }
  }
  return problems;
}

function checkRef(ref, keys, where, problems) {
  if (!isObject(ref) || typeof ref.paper !== "string" || typeof ref.card !== "string") {
    problems.push(`${where} needs "paper" and "card"`);
    return false;
  }
  if (!keys.has(ref.paper)) {
    problems.push(`${where}: unknown paper ${q(ref.paper)}`);
    return false;
  }
  return true;
}

/** Structural problems of a link list; whether its cards exist is checked by merge, against the canvases. */
export function checkLinkList(list) {
  if (!isObject(list) || !Array.isArray(list.papers) || list.papers.length === 0) {
    return ["no `papers` array, or it is empty"];
  }
  const problems = [];
  const keys = new Set();
  for (const [i, paper] of list.papers.entries()) {
    const where = `papers[${i}]`;
    if (!isObject(paper) || typeof paper.key !== "string" || !KEY.test(paper.key)) {
      problems.push(`${where}: "key" must match ${KEY}`);
      continue;
    }
    if (keys.has(paper.key)) problems.push(`${where}: duplicate key ${q(paper.key)}`);
    keys.add(paper.key);
    if (typeof paper.canvas !== "string" || paper.canvas === "") problems.push(`${where}: no "canvas" path`);
    if (paper.label !== undefined && typeof paper.label !== "string") problems.push(`${where}: "label" must be a string`);
    if (paper.year !== undefined && !Number.isInteger(paper.year)) problems.push(`${where}: "year" must be an integer`);
  }
  for (const field of ["links", "notes"]) {
    if (list[field] !== undefined && !Array.isArray(list[field])) problems.push(`\`${field}\` is not an array`);
  }
  for (const [i, link] of (Array.isArray(list.links) ? list.links : []).entries()) {
    const where = `links[${i}]`;
    const from = checkRef(link?.from, keys, `${where}.from`, problems);
    const to = checkRef(link?.to, keys, `${where}.to`, problems);
    if (from && to && link.from.paper === link.to.paper) {
      problems.push(`${where}: both ends are in ${q(link.from.paper)}; a link joins two papers`);
    }
    if (!LABELS.includes(link?.label)) problems.push(`${where}: "label" must be one of ${LABELS.join(", ")}`);
  }
  for (const [i, note] of (Array.isArray(list.notes) ? list.notes : []).entries()) {
    const where = `notes[${i}]`;
    checkRef(note, keys, where, problems);
    if (typeof note?.note !== "string" || note.note.trim() === "") problems.push(`${where}: empty "note"`);
  }
  return problems;
}

/** Strongly connected components (Tarjan), emitted so that a component comes after every one it reaches. */
export function components(nodes, edges) {
  const next = new Map(nodes.map((n) => [n, []]));
  for (const [from, to] of edges) next.get(from).push(to);
  const index = new Map();
  const low = new Map();
  const stack = [];
  const onStack = new Set();
  const found = [];
  const visit = (v) => {
    index.set(v, index.size);
    low.set(v, index.get(v));
    stack.push(v);
    onStack.add(v);
    for (const w of next.get(v)) {
      if (!index.has(w)) {
        visit(w);
        low.set(v, Math.min(low.get(v), low.get(w)));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v), index.get(w)));
      }
    }
    if (low.get(v) !== index.get(v)) return;
    const component = [];
    let w;
    do {
      w = stack.pop();
      onStack.delete(w);
      component.push(w);
    } while (w !== v);
    found.push(component);
  };
  for (const n of nodes) if (!index.has(n)) visit(n);
  return found;
}

/**
 * Row of each paper, 0 at the bottom: a paper sits above every paper it cites.
 * `edges` run cited -> citing. Papers citing each other share a row.
 */
export function rankPapers(keys, edges) {
  const ordered = components(keys, edges).reverse();
  const of = new Map();
  ordered.forEach((component, i) => component.forEach((key) => of.set(key, i)));
  const rank = ordered.map(() => 0);
  for (let i = 0; i < ordered.length; i++) {
    for (const [from, to] of edges) {
      if (of.get(from) === i && of.get(to) !== i) rank[of.get(to)] = Math.max(rank[of.get(to)], rank[i] + 1);
    }
  }
  return new Map(keys.map((key) => [key, rank[of.get(key)]]));
}

function bounds(nodes) {
  const left = Math.min(...nodes.map((n) => n.x));
  const top = Math.min(...nodes.map((n) => n.y));
  return {
    left,
    top,
    width: Math.max(...nodes.map((n) => n.x + n.width)) - left + 2 * PAD,
    height: Math.max(...nodes.map((n) => n.y + n.height)) - top + 2 * PAD,
  };
}

/** Top-left corner of every paper's group: cited papers below, a row ordered by year. */
function placeGroups(papers, boxes, rank) {
  const rows = [];
  for (const paper of papers) (rows[rank.get(paper.key)] ??= []).push(paper);
  const origin = new Map();
  let bottom = 0;
  for (const row of rows) {
    row.sort((a, b) => (a.year ?? Infinity) - (b.year ?? Infinity) || a.key.localeCompare(b.key));
    const height = Math.max(...row.map((p) => boxes.get(p.key).height));
    const width = row.reduce((sum, p) => sum + boxes.get(p.key).width, 0) + GAP_X * (row.length - 1);
    let x = -width / 2;
    for (const paper of row) {
      origin.set(paper.key, { x, y: bottom - height });
      x += boxes.get(paper.key).width + GAP_X;
    }
    bottom -= height + GAP_Y;
  }
  return origin;
}

/** Sides that make an edge leave `from` towards `to` instead of crossing its own card. */
function facingSides(from, to) {
  const dx = to.x + to.width / 2 - (from.x + from.width / 2);
  const dy = to.y + to.height / 2 - (from.y + from.height / 2);
  if (Math.abs(dy) >= Math.abs(dx)) return dy < 0 ? ["top", "bottom"] : ["bottom", "top"];
  return dx > 0 ? ["right", "left"] : ["left", "right"];
}

/**
 * Join per-paper canvases (`canvases`: key -> parsed canvas, each passing
 * checkCanvas) into one library canvas. Inputs are not modified. Returns the
 * canvas and the cross-paper cycles found, each a list of "paper:card" ids.
 */
export function merge(list, canvases) {
  const links = list.links ?? [];
  const notes = list.notes ?? [];
  const id = (ref) => `${ref.paper}:${ref.card}`;

  const cards = new Map();
  const boxes = new Map();
  for (const { key } of list.papers) boxes.set(key, bounds(canvases.get(key).nodes));
  const rank = rankPapers(
    list.papers.map((p) => p.key),
    links.map((l) => [l.from.paper, l.to.paper]),
  );
  const origin = placeGroups([...list.papers], boxes, rank);

  const groups = [];
  const edges = [];
  for (const { key, label } of list.papers) {
    const box = boxes.get(key);
    const at = origin.get(key);
    groups.push({ id: `@group-${key}`, type: "group", x: at.x, y: at.y, width: box.width, height: box.height, label: label ?? key });
    const canvas = canvases.get(key);
    for (const node of canvas.nodes) {
      const card = { ...node, id: `${key}:${node.id}`, x: node.x - box.left + PAD + at.x, y: node.y - box.top + PAD + at.y };
      cards.set(card.id, card);
    }
    for (const [i, edge] of (canvas.edges ?? []).entries()) {
      edges.push({ ...edge, id: `${key}:${edge.id ?? i}`, fromNode: `${key}:${edge.fromNode}`, toNode: `${key}:${edge.toNode}` });
    }
  }

  const problems = [];
  links.forEach((link, i) => {
    for (const end of ["from", "to"]) {
      if (!cards.has(id(link[end]))) problems.push(`links[${i}].${end}: no card ${q(link[end].card)} in ${q(link[end].paper)}`);
    }
  });
  notes.forEach((note, i) => {
    const card = cards.get(id(note));
    if (!card) problems.push(`notes[${i}]: no card ${q(note.card)} in ${q(note.paper)}`);
    else if (card.type !== "text") problems.push(`notes[${i}]: ${q(id(note))} is not a text card`);
  });
  if (problems.length > 0) throw new InvalidInput(problems);

  const crossing = new Set();
  links.forEach((link, i) => {
    const [fromSide, toSide] = facingSides(cards.get(id(link.from)), cards.get(id(link.to)));
    const edge = { id: `@link-${i}`, fromNode: id(link.from), fromSide, toNode: id(link.to), toSide, color: LINK_COLOR, label: link.label };
    edges.push(edge);
    crossing.add(edge);
  });

  const annotate = (card, text) => {
    card.text = `${card.text ?? ""}\n\n## Audit Note\n${text}`;
    card.color = NOTE_COLOR;
  };
  for (const note of notes) annotate(cards.get(id(note)), note.note.trim());

  // read-a-paper already reports cycles inside one paper; only those a link closes are new here
  const cycles = [];
  const loops = components([...cards.keys()], edges.map((e) => [e.fromNode, e.toNode])).filter((c) => c.length > 1);
  for (const loop of loops) {
    const members = new Set(loop);
    if (![...crossing].some((e) => members.has(e.fromNode) && members.has(e.toNode))) continue;
    const sorted = [...loop].sort();
    cycles.push(sorted);
    for (const member of sorted) {
      const card = cards.get(member);
      if (card.type === "text") annotate(card, `Circular dependency across papers, through: ${sorted.join(", ")}.`);
    }
  }

  return { canvas: { nodes: [...groups, ...cards.values()], edges }, cycles };
}

function readJson(path) {
  let text;
  try {
    text = readFileSync(path, "utf-8");
  } catch (e) {
    throw new InvalidInput([`${path}: cannot read (${e.code ?? e.message})`]);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new InvalidInput([`${path}: not valid JSON`]);
  }
}

/** Parse and check one per-paper canvas; returns the canvas or throws with every problem prefixed by its path. */
function loadCanvas(path) {
  const canvas = readJson(path);
  const problems = checkCanvas(canvas);
  if (problems.length > 0) throw new InvalidInput(problems.map((p) => `${path}: ${p}`));
  return canvas;
}

function runCheck(paths, out) {
  if (paths.length === 0) throw new UsageError("check needs at least one canvas");
  const problems = [];
  for (const path of paths) {
    try {
      loadCanvas(path);
      out(`ok ${path}\n`);
    } catch (e) {
      if (!(e instanceof InvalidInput)) throw e;
      problems.push(...e.problems);
    }
  }
  if (problems.length > 0) throw new InvalidInput(problems);
}

function runMerge(args, out) {
  if (args.length !== 2) throw new UsageError("merge takes a link list and an output path");
  const [listPath, outPath] = args;
  const list = readJson(listPath);
  const listProblems = checkLinkList(list);
  if (listProblems.length > 0) throw new InvalidInput(listProblems.map((p) => `${listPath}: ${p}`));

  const canvases = new Map();
  const problems = [];
  for (const paper of list.papers) {
    try {
      canvases.set(paper.key, loadCanvas(resolve(dirname(listPath), paper.canvas)));
    } catch (e) {
      if (!(e instanceof InvalidInput)) throw e;
      problems.push(...e.problems);
    }
  }
  if (problems.length > 0) throw new InvalidInput(problems);

  const { canvas, cycles } = merge(list, canvases);
  writeFileSync(outPath, `${JSON.stringify(canvas, null, "\t")}\n`);
  const cardCount = canvas.nodes.length - list.papers.length;
  out(`wrote ${outPath}: ${list.papers.length} papers, ${cardCount} cards, ${(list.links ?? []).length} cross-paper links\n`);
  for (const cycle of cycles) out(`cycle across papers: ${cycle.join(", ")}\n`);
}

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
    if (command === "check") runCheck(rest, out);
    else if (command === "merge") runMerge(rest, out);
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
