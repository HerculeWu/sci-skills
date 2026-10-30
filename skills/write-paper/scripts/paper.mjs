#!/usr/bin/env node
/**
 * The mechanical half of the write-paper skill. Zero dependencies beyond
 * library.mjs and paper-argument.mjs.
 *
 *   node paper.mjs lint-outline <vN/outline.md> [--root <dir>]
 *   node paper.mjs check <vN or final dir> [--root <dir>]
 *   node paper.mjs cites <papers/<paper>> [--root <dir>]
 *
 * These read only the plugin's own formats: the paper's Argument DAG, paper.md,
 * the outline, the calibration's Kinds block and labels, and the text's
 * `% outline:` / `% source:` lines. How the field writes is measured by the
 * calibration's own tools, never here. Nothing here decides what is written;
 * it says where a source is not yet satisfied.
 */

import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkCanvas, InvalidInput, readJson, UsageError } from "../../build-argument-library/scripts/library.mjs";
import { fileRefs, libraryRefs, section, title } from "../../build-paper-argument/scripts/paper-argument.mjs";

export const REQUIRED = ["cards", "kind", "role", "tone", "voice", "budget", "follows", "reader-question", "reader-takeaway"];
export const OPTIONAL = ["figure", "table", "context"];
const VALUES = { role: ["headline", "support", "aside"], tone: ["flat", "hedged"], voice: ["we", "passive", "free"] };
const ABSTRACT = /^abstract$/i;
const CONCLUSIONS = /conclusion/i;
const ENTRY_ID = /^[a-z0-9-]+\.[a-z0-9.-]+$/;
const BUDGET = /^(\d+)\s*[–-]\s*(\d+)$/;
const NONE = new Set(["—", "-", "none", ""]);
const UNTYPED = new Set(["paper", "legend"]);
// numbers a text writes without a source: small counts, section and figure numbers, years
const FREE_NUMBER = (n) => /^\d+$/.test(n) && (Number(n) <= 10 || (Number(n) >= 1900 && Number(n) <= 2100));
const COPY_SHORT = 7; // words of a Warrant, Backing, Qualifier, Rebuttal or title that make a copy
const COPY_LONG = 10; // of a Claim or Grounds, which share more words with any sentence on the same result
const STOP = new Set("about above after again against because before being below between both could does doing during each further having other their there these those through under until where which while would should within without".split(" "));

export const USAGE = `usage:
  paper.mjs lint-outline <vN/outline.md> [--root <dir>]    the outline against the canvas, paper.md and the Kinds block
  paper.mjs check <vN or final dir> [--root <dir>]          the text against the outline, the canvas and the journal
  paper.mjs cites <papers/<paper>> [--root <dir>]           key=bibcode for every library paper the canvas cites, and the Cites lines outside it

--root is the project (default: .); paths in cards and paper.md are read from it.
errors go to stderr with a non-zero exit, all of them at once.`;

const q = (v) => JSON.stringify(v);

// ---------------------------------------------------------------- reading files

function readText(path) {
  try {
    return readFileSync(path, "utf-8");
  } catch (e) {
    throw new InvalidInput([`${path}: cannot read (${e.code ?? e.message})`]);
  }
}

/** The bold fields of paper.md: `**Group**: simulation` → { group: "simulation" }. */
export function paperFields(text) {
  const fields = {};
  for (const m of text.matchAll(/^\*\*([^*]+)\*\*:\s*(.+)$/gm)) fields[m[1].trim().toLowerCase()] = m[2].trim();
  return fields;
}

/** The kinds of section-guide.md's `## Kinds` block, by group (lower case). */
export function kinds(text) {
  const out = new Map();
  for (const m of text.matchAll(/^-\s*`([^`]+)`\s*\(([^)]+)\)/gm)) {
    const group = m[2].trim().toLowerCase();
    if (!out.has(group)) out.set(group, new Set());
    out.get(group).add(m[1].trim());
  }
  return out;
}

/** An outline: `## Title · Group` sections, `#### id` entries with their fields and instruction lines. */
export function parseOutline(text) {
  const sections = [];
  const entries = [];
  let sec = null;
  let entry = null;
  for (const [i, raw] of text.split("\n").entries()) {
    const line = raw.trimEnd();
    if (/^##\s/.test(line) && !/^###/.test(line)) {
      const head = line.replace(/^##\s+/, "");
      const at = head.lastIndexOf(" · ");
      sec = { title: at === -1 ? head : head.slice(0, at), group: at === -1 ? null : head.slice(at + 3).trim(), line: i + 1, entries: [] };
      sections.push(sec);
      entry = null;
    } else if (/^####\s/.test(line)) {
      entry = { id: line.replace(/^####\s+/, "").trim(), section: sec, line: i + 1, order: [], fields: {}, instructions: [] };
      entries.push(entry);
      sec?.entries.push(entry);
    } else if (/^###\s/.test(line)) {
      entry = null;
    } else if (entry && /^-\s/.test(line)) {
      entry.instructions.push(line.slice(2).trim());
    } else if (entry && entry.instructions.length === 0 && /^[a-z-]+:/.test(line)) {
      const at = line.indexOf(":");
      const name = line.slice(0, at);
      entry.order.push(name);
      entry.fields[name] = line.slice(at + 1).trim();
    }
  }
  return { sections, entries };
}

/** `r-width (Claim, Grounds), e-dynamics` → [{ id, parts }]; `none` → []. */
export function cardList(value) {
  if (NONE.has((value ?? "").trim())) return [];
  const out = [];
  for (const m of value.matchAll(/([a-z]-[a-z0-9-]+)\s*(?:\(([^)]*)\))?/g)) {
    out.push({ id: m[1], parts: m[2] ? m[2].split(",").map((p) => p.trim()).filter(Boolean) : [] });
  }
  return out;
}

/** Paths named in parentheses in a `context` or `figure` field. */
const contextFiles = (value) => [...(value ?? "").matchAll(/\(([^()\s]+\.[A-Za-z0-9]+)\)/g)].map((m) => m[1]);
const figureFile = (value) => (value ?? "").split(/\s+[—-]\s+/)[0].trim();

function loadPaper(paperDir) {
  const canvas = readJson(join(paperDir, "argument.canvas"));
  const problems = checkCanvas(canvas);
  if (problems.length > 0) throw new InvalidInput(problems.map((p) => `${join(paperDir, "argument.canvas")}: ${p}`));
  const fields = paperFields(readText(join(paperDir, "paper.md")));
  return { canvas, fields };
}

function writingDir(fields, root, paperDir) {
  if (!fields.library) throw new InvalidInput([`${join(paperDir, "paper.md")}: no **Library**: field`]);
  return join(resolve(root, fields.library), "writing");
}

const textCards = (canvas) => canvas.nodes.filter((n) => n.type === "text" && !UNTYPED.has(n.id));
const mainEnd = (canvas) => textCards(canvas).find((c) => c.id.startsWith("e-") && (section(c.text, "Rank") ?? "").startsWith("main"));

// ---------------------------------------------------------------- lint-outline

/** Problems of an outline against its paper's canvas, paper.md fields, Kinds block, and the project's files. */
export function lintOutline(outline, { canvas, fields = {}, kindsByGroup = new Map(), exists = () => true }) {
  const problems = [];
  const { sections, entries } = outline;
  const cards = new Map(textCards(canvas).map((c) => [c.id, c]));
  const seen = new Set();
  const figures = new Map();

  for (const sec of sections) {
    if (!sec.group) problems.push(`line ${sec.line}: section ${q(sec.title)} names no group (\`## <title> · <group>\`)`);
    else if (kindsByGroup.size > 0 && !kindsByGroup.has(sec.group.toLowerCase())) problems.push(`line ${sec.line}: group ${q(sec.group)} is not in the Kinds block`);
    const headlines = sec.entries.filter((e) => e.fields.role === "headline").length;
    if (sec.entries.length > 0 && headlines !== 1) problems.push(`section ${q(sec.title)}: ${headlines} headline entries; exactly one is`);
  }

  for (const e of entries) {
    const where = `entry ${q(e.id)} (line ${e.line})`;
    if (!ENTRY_ID.test(e.id)) problems.push(`${where}: an id is \`<section>.<name>\` in lower case`);
    if (seen.has(e.id)) problems.push(`${where}: duplicate id`);
    seen.add(e.id);
    if (!e.section) problems.push(`${where}: not under a \`##\` section`);

    const required = e.order.filter((f) => REQUIRED.includes(f));
    if (required.join(" ") !== REQUIRED.filter((f) => f in e.fields).join(" ")) problems.push(`${where}: fields out of order; the order is ${REQUIRED.join(", ")}`);
    for (const f of REQUIRED) if (!(f in e.fields)) problems.push(`${where}: no ${f}`);
    for (const f of e.order) if (!REQUIRED.includes(f) && !OPTIONAL.includes(f)) problems.push(`${where}: unknown field ${q(f)}`);
    if (e.instructions.length === 0) problems.push(`${where}: no instruction line`);

    for (const [f, allowed] of Object.entries(VALUES)) {
      if (f in e.fields && !allowed.includes(e.fields[f])) problems.push(`${where}: ${f} ${q(e.fields[f])} is none of ${allowed.join(", ")}`);
    }
    const group = e.section?.group?.toLowerCase();
    if ("kind" in e.fields && kindsByGroup.size > 0 && group && kindsByGroup.has(group) && !kindsByGroup.get(group).has(e.fields.kind)) {
      problems.push(`${where}: kind ${q(e.fields.kind)} is not a kind of ${e.section.group} in the Kinds block`);
    }
    if ("budget" in e.fields) {
      const m = BUDGET.exec(e.fields.budget);
      if (!m || Number(m[1]) < 1 || Number(m[1]) >= Number(m[2])) problems.push(`${where}: budget ${q(e.fields.budget)} is not \`lo–hi\` with 0 < lo < hi`);
    }
    if ("reader-question" in e.fields && !e.fields["reader-question"].trim().endsWith("?")) problems.push(`${where}: reader-question does not end in "?"`);
    if ("follows" in e.fields && NONE.has(e.fields.follows) && e.section && e.section.entries[0] !== e) problems.push(`${where}: follows is empty, and only a section's first entry has nothing to follow`);

    for (const ref of cardList(e.fields.cards)) {
      const card = cards.get(ref.id);
      if (!card) {
        problems.push(`${where}: card ${q(ref.id)} is not on the canvas`);
        continue;
      }
      for (const part of ref.parts) {
        if (part.toLowerCase() === "title") continue;
        if (section(card.text, part) === null) problems.push(`${where}: card ${q(ref.id)} has no ## ${part}`);
      }
    }
    for (const f of ["figure", "table"]) {
      const v = e.fields[f];
      if (!v || NONE.has(v)) continue;
      const file = figureFile(v);
      if (f === "figure" || !file.startsWith("tab:")) {
        if (!exists(file)) problems.push(`${where}: ${f} ${q(file)} is not in the project`);
      }
      if (figures.has(file)) problems.push(`${where}: ${f} ${q(file)} is already introduced by ${q(figures.get(file))}`);
      figures.set(file, e.id);
    }
    const context = e.fields.context;
    if (context && !NONE.has(context) && context !== "?") {
      const files = contextFiles(context);
      if (files.length === 0) problems.push(`${where}: context names no source file in parentheses`);
      for (const file of files) if (!exists(file)) problems.push(`${where}: context source ${q(file)} is not in the project`);
    }
  }

  // coverage: every card but the Natives is written somewhere; every End reaches the abstract and the conclusions
  const listed = new Map();
  for (const e of entries) for (const ref of cardList(e.fields.cards)) {
    if (!listed.has(ref.id)) listed.set(ref.id, []);
    listed.get(ref.id).push({ entry: e, parts: ref.parts });
  }
  for (const id of cards.keys()) {
    if (!id.startsWith("n-") && !listed.has(id)) problems.push(`card ${q(id)} is listed by no entry`);
  }
  const inGroup = (id, re, part) =>
    (listed.get(id) ?? []).some((l) => re.test(l.entry.section?.group ?? "") && (!part || l.parts.length === 0 || l.parts.includes(part)));
  for (const id of [...cards.keys()].filter((id) => id.startsWith("e-"))) {
    if (!inGroup(id, ABSTRACT)) problems.push(`End ${q(id)} is listed by no Abstract entry`);
    if (!inGroup(id, CONCLUSIONS)) problems.push(`End ${q(id)} is listed by no Conclusions entry`);
  }
  const main = mainEnd(canvas);
  if (main) {
    if (!inGroup(main.id, ABSTRACT, "Sentence")) problems.push(`the main End ${q(main.id)}'s Sentence is listed by no Abstract entry`);
    if (!inGroup(main.id, CONCLUSIONS, "Sentence")) problems.push(`the main End ${q(main.id)}'s Sentence is listed by no Conclusions entry`);
  }

  const limit = Number.parseInt(fields["abstract limit"] ?? "", 10);
  if (Number.isFinite(limit)) {
    const sum = entries.filter((e) => ABSTRACT.test(e.section?.group ?? "")).reduce((s, e) => s + Number(BUDGET.exec(e.fields.budget ?? "")?.[2] ?? 0), 0);
    if (sum > limit) problems.push(`the Abstract entries' upper budgets sum to ${sum} words; the journal's limit is ${limit}`);
  }
  return problems;
}

function runLint(args, out) {
  const { rest, root } = options(args);
  if (rest.length !== 1) throw new UsageError("lint-outline takes the outline");
  const path = rest[0];
  const paperDir = dirname(dirname(resolve(path)));
  const { canvas, fields } = loadPaper(paperDir);
  const guide = join(writingDir(fields, root, paperDir), "section-guide.md");
  const kindsByGroup = kinds(readText(guide));
  if (kindsByGroup.size === 0) throw new InvalidInput([`${guide}: no Kinds block (\`- \`KIND\` (Group): …\`)`]);
  const outline = parseOutline(readText(path));
  const problems = lintOutline(outline, { canvas, fields, kindsByGroup, exists: (p) => existsSync(resolve(root, p)) });
  if (problems.length > 0) throw new InvalidInput(problems.map((p) => `${path}: ${p}`));
  const unwritten = outline.entries.filter((e) => e.fields.context === "?").map((e) => e.id);
  out(`ok ${path}: ${outline.entries.length} entries${unwritten.length > 0 ? `; context ? on ${unwritten.join(", ")}` : ""}\n`);
}

// ---------------------------------------------------------------- the text

/** LaTeX reduced to the words a reader reads: comments, floats, display maths and commands removed. */
export function prose(tex) {
  return tex
    .split("\n")
    .filter((l) => !/^\s*%/.test(l))
    .join("\n")
    .replace(/\\begin\{(figure|table|equation|align|eqnarray|gather|multline)\*?\}[\s\S]*?\\end\{\1\*?\}/g, " ")
    .replace(/\\(?:sub)*section\*?\{[^}]*\}/g, " ")
    .replace(/\\(?:cite[a-z]*|ref|eqref|label|url|input|include)\*?(?:\[[^\]]*\])*\{[^}]*\}/g, " ")
    .replace(/(?<!\\)%.*$/gm, " ")
    .replace(/~|\\,|\\ |\\;|\\!/g, " ")
    .replace(/\\[A-Za-z]+\*?/g, " ")
    .replace(/[{}$\\^_]/g, " ")
    .replace(/[“”"]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export const wordCount = (text) => (text.match(/[A-Za-z0-9][A-Za-z0-9'’.,/–-]*/g) ?? []).length;
const words = (text) => (text.toLowerCase().match(/[a-z0-9]+(?:['’][a-z]+)?/g) ?? []);
const numbersOf = (text) => [...text.replace(/−/g, "-").matchAll(/(?<![\w.])(\d+(?:\.\d+)?)(\s*%)?/g)].map((m) => ({ n: m[1], percent: Boolean(m[2]) }));

/** The paragraphs of a text: from each `% outline: <id>` line to the next, across the section files in name order. */
export function units(files) {
  const out = [];
  let unit = null;
  for (const { name, text } of files) {
    unit = null; // a paragraph never runs across files
    for (const line of text.split("\n")) {
      const tag = /^\s*%\s*outline:\s*(\S+)/.exec(line);
      if (tag) {
        unit = { id: tag[1], file: name, source: null, notWritten: false, lines: [] };
        out.push(unit);
        continue;
      }
      if (!unit) continue;
      const source = /^\s*%\s*source:\s*(.+)$/.exec(line);
      if (source) unit.source = source[1].trim();
      if (/^\s*%\s*not written/.test(line)) unit.notWritten = true;
      unit.lines.push(line);
    }
  }
  for (const u of out) u.prose = prose(u.lines.join("\n"));
  return out;
}

/** Number strings a source states, with the decimals of CSV cells also rounded to 0–3 places as a text would write them. */
export function sourceNumbers(texts) {
  const set = new Set();
  for (const { text, csv } of texts) {
    for (const { n } of numbersOf(text)) set.add(n);
    if (!csv) continue;
    for (const cell of text.split(/[,;\t\n]/)) {
      const x = Number(cell.trim());
      if (cell.trim() === "" || !Number.isFinite(x)) continue;
      for (const d of [0, 1, 2, 3]) set.add(Math.abs(x).toFixed(d));
    }
  }
  return set;
}

/** A number is stated by a source as written, or as a percentage of a fraction the source gives (0.26 → 26 %). */
function stated(num, set) {
  if (FREE_NUMBER(num.n) || set.has(num.n)) return true;
  if (!num.percent) return false;
  if (!set.fractions) set.fractions = [...set].filter((s) => s.includes(".") && Number(s) < 1).map(Number);
  return set.fractions.some((f) => Math.abs(f * 100 - Number(num.n)) <= 0.5);
}

/** BibTeX entries: key → the entry's text. */
export function bibEntries(text) {
  const out = new Map();
  for (const m of text.matchAll(/@\w+\s*\{\s*([^,\s]+)\s*,([\s\S]*?)(?=\n@|\s*$)/g)) out.set(m[1], m[2]);
  return out;
}

/**
 * Problems of a text against its outline, canvas and paper.md. `units` are the
 * text's paragraphs, `sources` the texts numbers may come from, `bib` the
 * refs.bib entries, `labelled` whether a library key has calibration labels.
 */
export function checkText({ units: us, outline, canvas, fields = {}, sources = [], bib = new Map(), cited = [], labelled = () => true }) {
  const problems = [];
  const entries = new Map(outline.entries.map((e) => [e.id, e]));
  const cards = new Map(textCards(canvas).map((c) => [c.id, c]));

  // every entry executed once, every paragraph traced
  const count = new Map();
  for (const u of us) {
    const where = `${u.file}: paragraph ${q(u.id)}`;
    count.set(u.id, (count.get(u.id) ?? 0) + 1);
    if (!entries.has(u.id)) problems.push(`${where}: no outline entry has this id`);
    const src = u.source ?? "";
    const m = /^(copy|imitate)\s+([A-Za-z0-9._-]+)\b|^written\b/.exec(src);
    if (!m) problems.push(`${where}: no \`% source: copy|imitate <Key> §… ¶…\` or \`% source: written\` line`);
    else if (m[2] && !labelled(m[2])) problems.push(`${where}: source ${q(m[2])} has no labels in the calibration`);
    if (entries.get(u.id)?.fields.context === "?" && !u.notWritten) problems.push(`${where}: its entry's context is ?, so it is left \`% not written\``);
  }
  for (const e of outline.entries) {
    const n = count.get(e.id) ?? 0;
    if (n !== 1) problems.push(`entry ${q(e.id)}: executed by ${n} paragraphs; exactly one does`);
  }

  // budgets and the journal's limit
  const group = (u) => entries.get(u.id)?.section?.group ?? "";
  let abstractWords = 0;
  for (const u of us) {
    const e = entries.get(u.id);
    const w = wordCount(u.prose);
    if (ABSTRACT.test(group(u))) abstractWords += w;
    const m = BUDGET.exec(e?.fields.budget ?? "");
    if (m && !u.notWritten && (w < Number(m[1]) || w > Number(m[2]))) problems.push(`${u.file}: paragraph ${q(u.id)} has ${w} words; its budget is ${m[1]}–${m[2]}`);
  }
  const limit = Number.parseInt(fields["abstract limit"] ?? "", 10);
  if (Number.isFinite(limit) && abstractWords > limit) problems.push(`the abstract has ${abstractWords} words; the journal's limit is ${limit}`);

  // numbers: every one from the canvas or a file it names; in the abstract and conclusions, from an End or its Grounds
  const all = sourceNumbers(sources);
  const ends = [...cards.values()].filter((c) => c.id.startsWith("e-"));
  const endIds = new Set(ends.map((c) => c.id));
  const endSide = new Set(endIds);
  for (const edge of canvas.edges ?? []) if (endIds.has(edge.toNode) && edge.label === "Grounds") endSide.add(edge.fromNode);
  const endNumbers = sourceNumbers([...endSide].filter((id) => cards.has(id)).map((id) => ({ text: cards.get(id).text })));
  for (const u of us) {
    const closing = ABSTRACT.test(group(u)) || CONCLUSIONS.test(group(u));
    const missing = [...new Set(numbersOf(u.prose).filter((n) => !stated(n, all)).map((n) => n.n))];
    if (missing.length > 0) problems.push(`${u.file}: paragraph ${q(u.id)} states ${missing.join(", ")}, found on no card and in no file the canvas or the outline names`);
    if (closing) {
      const off = [...new Set(numbersOf(u.prose).filter((n) => stated(n, all) && !stated(n, endNumbers)).map((n) => n.n))];
      if (off.length > 0) problems.push(`${u.file}: paragraph ${q(u.id)} (${group(u)}) states ${off.join(", ")}, on no End card and no card its Grounds name`);
    }
  }

  // End Qualifiers travel with their Claims into the abstract and the conclusions
  for (const u of us) {
    if (!ABSTRACT.test(group(u)) && !CONCLUSIONS.test(group(u))) continue;
    for (const ref of cardList(entries.get(u.id)?.fields.cards)) {
      const card = cards.get(ref.id);
      if (!card || !endIds.has(card.id) || (ref.parts.length > 0 && !ref.parts.includes("Qualifier"))) continue;
      const qualifier = section(card.text, "Qualifier");
      if (!qualifier) continue;
      const claim = new Set(words(section(card.text, "Claim") ?? ""));
      const marks = new Set([...numbersOf(qualifier).map((n) => n.n), ...words(qualifier).filter((w) => w.length >= 5 && !STOP.has(w) && !claim.has(w))]);
      const text = u.prose.toLowerCase();
      if (![...marks].some((m) => (/^\d/.test(m) ? numbersOf(u.prose).some((n) => n.n === m) : text.includes(m)))) {
        problems.push(`${u.file}: paragraph ${q(u.id)} restates End ${q(card.id)} without a trace of its Qualifier`);
      }
    }
  }

  // card text copied into the text
  const grams = new Map();
  // numbers removed: a sentence that states a card's numbers is not a copy of its wording
  const plain = (text) => words(text).filter((w) => !/^\d+$/.test(w));
  const addGrams = (text, n, id) => {
    const ws = plain(prose(text));
    for (let i = 0; i + n <= ws.length; i++) grams.set(ws.slice(i, i + n).join(" "), id);
  };
  for (const card of cards.values()) {
    const isEnd = endIds.has(card.id);
    addGrams(title(card.text), COPY_SHORT, card.id);
    for (const part of ["Warrant", "Backing", "Qualifier", "Rebuttal"]) addGrams(section(card.text, part) ?? "", COPY_SHORT, card.id);
    if (!isEnd) for (const part of ["Claim", "Grounds"]) addGrams(section(card.text, part) ?? "", COPY_LONG, card.id);
  }
  for (const u of us) {
    const ws = plain(u.prose);
    for (const n of [COPY_SHORT, COPY_LONG]) {
      const hit = ws.map((_, i) => ws.slice(i, i + n).join(" ")).find((g) => g.split(" ").length === n && grams.has(g));
      if (hit) {
        problems.push(`${u.file}: paragraph ${q(u.id)} copies card ${q(grams.get(hit))}: "${hit}"`);
        break;
      }
    }
  }

  // the main End's Sentence, word for word, in the abstract and the conclusions
  const main = mainEnd(canvas);
  const sentence = main ? words(prose(section(main.text, "Sentence") ?? "")).join(" ") : "";
  if (sentence) {
    for (const [name, re] of [["abstract", ABSTRACT], ["conclusions", CONCLUSIONS]]) {
      const text = words(us.filter((u) => re.test(group(u))).map((u) => u.prose).join(" ")).join(" ");
      if (!text.includes(sentence)) problems.push(`the main End ${q(main.id)}'s Sentence is not in the ${name} word for word`);
    }
  }

  // citations: in refs.bib, and standing on a card
  const libraryKeys = new Set(textCards(canvas).flatMap((c) => libraryRefs(c.text).map((r) => r.paper)));
  const canvasText = textCards(canvas).map((c) => c.text).join("\n").toLowerCase();
  for (const key of new Set(cited)) {
    if (!bib.has(key)) {
      problems.push(`\\cite key ${q(key)} is not in refs.bib`);
      continue;
    }
    if (libraryKeys.has(key)) continue;
    const entry = bib.get(key).toLowerCase();
    const ids = [/doi\s*=\s*\{([^}]+)\}/.exec(entry)?.[1], /abs\/([^/}\s]+)/.exec(entry)?.[1]].filter(Boolean).map((s) => s.replace(/%26/g, "&"));
    if (!ids.some((id) => canvasText.includes(id))) problems.push(`\\cite key ${q(key)} stands on no card: no card names it, its DOI or its bibcode`);
  }
  return problems;
}

function runCheck(args, out) {
  const { rest, root } = options(args);
  if (rest.length !== 1) throw new UsageError("check takes a version directory (vN or final)");
  const dir = resolve(rest[0]);
  const paperDir = dirname(dir);
  const { canvas, fields } = loadPaper(paperDir);
  const outline = parseOutline(readText(join(dir, "outline.md")));
  const sectionsDir = join(dir, "sections");
  let names;
  try {
    names = readdirSync(sectionsDir).filter((f) => f.endsWith(".tex")).sort();
  } catch (e) {
    throw new InvalidInput([`${sectionsDir}: cannot read (${e.code ?? e.message})`]);
  }
  const files = names.map((name) => ({ name, text: readText(join(sectionsDir, name)) }));
  const tex = files.map((f) => f.text).join("\n") + (existsSync(join(dir, "main.tex")) ? `\n${readText(join(dir, "main.tex"))}` : "");
  const cited = [...tex.matchAll(/\\cite[a-z]*\*?(?:\[[^\]]*\])*\{([^}]+)\}/g)].flatMap((m) => m[1].split(",").map((k) => k.trim()));

  const named = new Set(textCards(canvas).flatMap((c) => fileRefs(c.text)));
  for (const e of outline.entries) for (const f of contextFiles(e.fields.context)) named.add(f);
  const sources = [{ text: textCards(canvas).map((c) => c.text).join("\n") }];
  for (const p of named) {
    const full = resolve(root, p);
    if (!existsSync(full) || !statSync(full).isFile() || statSync(full).size > 5e6 || /\.(png|pdf|jpe?g|svg|eps|gif)$/i.test(p)) continue;
    sources.push({ text: readFileSync(full, "utf-8"), csv: /\.(csv|tsv|dat|txt)$/i.test(p) });
  }
  const bibPath = join(dir, "refs.bib");
  const bib = existsSync(bibPath) ? bibEntries(readText(bibPath)) : new Map();
  const labels = join(writingDir(fields, root, paperDir), "labels");
  const problems = checkText({
    units: units(files),
    outline,
    canvas,
    fields,
    sources,
    bib,
    cited,
    labelled: (key) => existsSync(join(labels, `${key}.json`)),
  });
  if (problems.length > 0) throw new InvalidInput(problems.map((p) => `${basename(dir)}: ${p}`));
  out(`ok ${rest[0]}\n`);
}

// ---------------------------------------------------------------- cites

/** `key=bibcode` for each library paper the canvas names, and the Cites lines that name none. */
export function cites(canvas, meta) {
  const keys = new Set();
  const outside = [];
  for (const card of textCards(canvas)) {
    for (const r of libraryRefs(card.text)) keys.add(r.paper);
    for (const line of (card.text ?? "").split("\n").filter((l) => l.trim().startsWith("Cites:"))) {
      const match = [...meta].find(([k, m]) => [k, m.doi, m.bibcode].some((id) => id && line.toLowerCase().includes(String(id).toLowerCase())));
      if (match) keys.add(match[0]);
      else outside.push(line.trim().replace(/^Cites:\s*/, ""));
    }
  }
  const pairs = [];
  const missing = [];
  for (const key of [...keys].sort()) {
    const bibcode = meta.get(key)?.bibcode;
    if (bibcode) pairs.push(`${key}=${bibcode}`);
    else missing.push(key);
  }
  return { pairs, missing, outside: [...new Set(outside)] };
}

function runCites(args, out) {
  const { rest, root } = options(args);
  if (rest.length !== 1) throw new UsageError("cites takes the paper's directory");
  const { canvas, fields } = loadPaper(resolve(rest[0]));
  const library = resolve(root, fields.library ?? ".");
  const meta = new Map();
  for (const d of existsSync(library) ? readdirSync(library) : []) {
    const p = join(library, d, "meta.json");
    if (existsSync(p)) meta.set(d, JSON.parse(readFileSync(p, "utf-8")));
  }
  const { pairs, missing, outside } = cites(canvas, meta);
  for (const p of pairs) out(`${p}\n`);
  for (const k of missing) out(`no bibcode: ${k} (no meta.json with a bibcode)\n`);
  for (const line of outside) out(`outside the library: ${line}\n`);
}

// ---------------------------------------------------------------- main

function options(args) {
  const rest = [];
  let root = ".";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--root") {
      if (!args[i + 1]) throw new UsageError("--root needs a path");
      root = args[++i];
    } else rest.push(args[i]);
  }
  return { rest, root };
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
    if (command === "lint-outline") runLint(rest, out);
    else if (command === "check") runCheck(rest, out);
    else if (command === "cites") runCites(rest, out);
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
