// Tests for paper-argument.mjs: `node --test` from this directory.

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { cardFaults, checkArgument, classify, conjectureRefs, fileRefs, libraryRefs, libraryShapes, part, quantities, references, rounds, run, schemaProblems, shape } from "./paper-argument.mjs";

const REF = "tails/round-1";

/** An argument with every field the schema requires. */
function arg(id, kind, fields = {}) {
  return { id, kind, title: id, claim: "c", grounds: [{ text: "g" }], warrant: "w", warrant_implicit: false, backing: "", qualifier: "", rebuttal: "", sources: [], cites: [], ...fields };
}

/** A paper's Argument DAG: Native → Method → Result → End, with one figure. */
function graph() {
  return {
    version: 1,
    paper: { id: "tails", title: "A paper" },
    arguments: [
      arg("n-epicycle", "native", { title: "Epicycles", claim: "Overdensities at 3π r_J.", grounds: [{ text: "Küpper's y_C", source: "Kupper2010:end-yc" }], warrant: "Epicyclic approximation.", cites: ["2010MNRAS.401..105K"] }),
      arg("m-ensemble", "method", { title: "Paired ensembles", claim: "Forty seed pairs.", grounds: [{ text: "40 seeds per treatment", source: "sims/specs.md" }], warrant: "Seed pairing removes shared noise." }),
      arg("r-width", "result", {
        title: "Tails 26 % closer to the orbit",
        claim: "The width falls by 20–30 %.",
        grounds: [
          { text: "held: 29.0 vs 21.5 pc, a fall of 0.26.", source: `${REF}:C2` },
          { text: "Width against time", source: "f-width" },
        ],
        warrant: "The yardstick of m-ensemble.",
        qualifier: `- \`${REF}:C5\` failed: the mass gradient differs.`,
        sources: [`${REF}:C2`, "figures/width.png"],
      }),
      arg("e-dynamics", "end", { title: "The treatment moves the tail", claim: "The tail lies closer to the orbit.", grounds: [{ text: "the width", source: "r-width" }], warrant: "The yardstick of m-ensemble.", rank: "main", sentence: "The treatment changes where a tail lies.", reader: "Cluster dynamicists." }),
    ],
    figures: [{ id: "f-width", kind: "figure", file: "figures/width.png", shows: "Width against time." }],
    edges: [
      { from: "n-epicycle", to: "r-width", role: "warrant" },
      { from: "m-ensemble", to: "r-width", role: "warrant" },
      { from: "f-width", to: "r-width", role: "grounds" },
      { from: "r-width", to: "e-dynamics", role: "grounds" },
    ],
  };
}

const JUDGEMENTS = new Map([
  [`${REF}:C2`, "held"],
  [`${REF}:C5`, "failed"],
  [`${REF}:C7`, "not done"],
]);
const LIBRARY = { nodes: [{ id: "Kupper2010:end-yc", type: "text", text: "## Claim\nyc", x: 0, y: 0, width: 1, height: 1 }], edges: [] };
const find = (g, id) => g.arguments.find((a) => a.id === id);
const check = (g, opts = {}) => checkArgument(g, { judgements: JUDGEMENTS, library: LIBRARY, ...opts });

function runWith(argv) {
  let stdout = "";
  let stderr = "";
  const code = run(argv, { stdout: (s) => (stdout += s), stderr: (s) => (stderr += s) });
  return { code, stdout, stderr };
}

// ---------------------------------------------------------------- reading arguments

test("part reads an argument's parts by their outline names, null when empty", () => {
  const r = find(graph(), "r-width");
  assert.equal(part(r, "Claim"), "The width falls by 20–30 %.");
  assert.equal(part(r, "grounds"), "- held: 29.0 vs 21.5 pc, a fall of 0.26.\n- Width against time");
  assert.equal(part(r, "Backing"), null);
  assert.equal(part(r, "Rank"), null);
  assert.equal(part(find(graph(), "e-dynamics"), "Sentence"), "The treatment changes where a tail lies.");
});

test("the kinds of reference are told apart, in text and as bare sources", () => {
  const text = "`tails/round-2:C9` held; `Weis2025:rg-shift`; `figures/r1/a.csv`; `notes.md`; `https://x.org`";
  assert.deepEqual(conjectureRefs(text).map((r) => r.ref), ["tails/round-2:C9"]);
  assert.deepEqual(libraryRefs(text).map((r) => r.id), ["Weis2025:rg-shift"]);
  assert.deepEqual(fileRefs(text), ["figures/r1/a.csv", "notes.md"]);
  const ids = new Set(["r-width"]);
  assert.deepEqual(["tails/round-2:C9", "Weis2025:rg-shift", "r-width", "figures/a.csv"].map((s) => classify(s, ids).type), ["judgement", "library", "node", "file"]);
});

test("references collects the Grounds sources, the sources and the backticked references, with their part", () => {
  const g = graph();
  const refs = references(find(g, "r-width"), new Set(["f-width"]));
  assert.deepEqual(
    refs.map((r) => [r.type, r.ref, r.where]),
    [
      ["judgement", `${REF}:C5`, "Qualifier"],
      ["judgement", `${REF}:C2`, "Grounds"],
      ["node", "f-width", "Grounds"],
      ["judgement", `${REF}:C2`, "sources"],
      ["file", "figures/width.png", "sources"],
    ],
  );
});

test("quantities pairs numbers and ranges with their units", () => {
  assert.deepEqual(quantities("26–38 % closer, 7.44 pc, 700 Myr"), [["26–38", "%"], ["7.44", "pc"], ["700", "Myr"]]);
  assert.deepEqual(quantities("near r_J,0 bring 3 r_J,0"), [["3", "r_J"]]);
});

// ---------------------------------------------------------------- the schema

test("the example of the schema's page passes the schema", () => {
  const page = readFileSync(fileURLToPath(new URL("../schema/README.md", import.meta.url)), "utf-8");
  const example = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(page)[1]);
  assert.deepEqual(schemaProblems(example), []);
});

test("the schema names each problem by the argument it is in", () => {
  const g = graph();
  const r = find(g, "r-width");
  r.title = "x".repeat(81);
  r.kind = "discussion";
  delete r.warrant;
  r.grounds.push({ text: "a minimum at 135 pc" });
  r.cites = ["Kupper2010"];
  r.rank = "main";
  const problems = schemaProblems(g);
  for (const want of [
    'argument "r-width": title has 81 characters, more than 80',
    'argument "r-width": id "r-width" does not match ^d- (the id prefix matches kind)',
    'argument "r-width" has no warrant',
    'argument "r-width": grounds[2] has no source (a Grounds item whose text states a number names its source)',
    'argument "r-width": cites[0] "Kupper2010" does not match',
    'argument "r-width": rank is not allowed here (rank, sentence and reader are on end arguments only, and required there)',
    "arguments has 2 matching items; exactly 1 must match (exactly one end argument is ranked main)",
  ]) {
    assert.ok(problems.some((p) => p.startsWith(want)), `${want}\n${problems.join("\n")}`);
  }
});

test("an End needs its Rank, Sentence and Reader; an edge never leaves an End", () => {
  const g = graph();
  delete find(g, "e-dynamics").sentence;
  g.edges.push({ from: "e-dynamics", to: "r-width", role: "backing" });
  const problems = schemaProblems(g);
  assert.ok(problems.some((p) => p.startsWith('argument "e-dynamics" has no sentence')));
  assert.ok(problems.some((p) => p.startsWith("edge 4 (e-dynamics → r-width): from") && p.includes("never an end")));
});

// ---------------------------------------------------------------- check

test("a well-formed paper DAG passes", () => {
  const { problems, faults } = check(graph(), { paperId: "tails" });
  assert.deepEqual(problems, []);
  assert.deepEqual(faults, []);
});

test("a graph that fails the schema reports only the schema's problems", () => {
  const g = graph();
  g.version = 2;
  g.edges = [];
  assert.deepEqual(check(g).problems, ["version is 2, not 1"]);
});

test("ids are unique, edges name nodes, no edge repeats, and paper.id is the paper's name", () => {
  const g = graph();
  g.figures.push({ id: "f-width", kind: "figure", file: null, shows: "again" });
  g.edges.push({ from: "r-width", to: "e-dynamics", role: "grounds" }, { from: "r-gone", to: "e-dynamics", role: "grounds" }, { from: "r-width", to: "r-nowhere", role: "grounds" });
  const { problems } = check(g, { paperId: "other" });
  for (const want of ['id "f-width" is used twice', "edge 4 (r-width → e-dynamics): repeats grounds", 'edge 5 (r-gone → e-dynamics): "r-gone" is no argument or figure', 'edge 6 (r-width → r-nowhere): "r-nowhere" is no argument', 'paper.id "tails" is not the paper\'s name "other"']) {
    assert.ok(problems.includes(want), want);
  }
});

test("a cycle, and a node with no path to an End, are reported", () => {
  const g = graph();
  g.arguments.push(arg("d-mechanism", "discussion", { grounds: [{ text: "r-width", source: "r-width" }] }));
  g.edges.push({ from: "r-width", to: "d-mechanism", role: "grounds" }, { from: "d-mechanism", to: "r-width", role: "backing" });
  g.edges = g.edges.filter((e) => !(e.from === "n-epicycle"));
  const { problems } = check(g);
  assert.ok(problems.includes("circular dependency through: d-mechanism, r-width"));
  assert.ok(problems.includes('argument "n-epicycle": no path to an End Argument'));
  g.edges = g.edges.filter((e) => e.from !== "f-width");
  assert.ok(check(g).problems.includes('figure "f-width": no path to an End Argument'));
});

test("only held and failed Conjectures enter; a failed one outside Qualifier and Rebuttal is a fault for the author", () => {
  const g = graph();
  const r = find(g, "r-width");
  r.warrant = `\`${REF}:C5\` says so; \`${REF}:C7\` and \`${REF}:C99\` too.`;
  const { problems, faults } = check(g);
  assert.ok(!problems.some((p) => p.includes(`${REF}:C5`)));
  assert.ok(faults.some((f) => f.includes(`failed ${REF}:C5 under Warrant`) && f.includes("author's choice")));
  assert.ok(problems.some((p) => p.includes(`${REF}:C7, which is not done`)));
  assert.ok(problems.some((p) => p.includes(`${REF}:C99, which no progress record holds`)));
});

test("a failed judgement as a Grounds source is a fault, and the item's text starts with its status", () => {
  const g = graph();
  find(g, "r-width").grounds.push({ text: "the gradient differs", source: `${REF}:C5` });
  const { problems, faults } = check(g);
  assert.ok(faults.some((f) => f.includes(`failed ${REF}:C5 under Grounds`)));
  assert.ok(problems.includes(`argument "r-width": grounds[2] rests on ${REF}:C5, which is failed; its text starts with "failed"`));
});

test("a judgement named twice in one argument is one fact about it", () => {
  const g = graph();
  find(g, "r-width").claim = `As \`${REF}:C99\` and again \`${REF}:C99\` say.`;
  find(g, "r-width").sources.push(`${REF}:C99`);
  assert.equal(check(g).problems.filter((p) => p.includes("C99")).length, 1);
});

test("library cards, project files and figure files are looked up; a source names one of the four", () => {
  const g = graph();
  find(g, "n-epicycle").grounds[0].source = "Kupper2010:end-gone";
  find(g, "m-ensemble").grounds[0].source = "Sect. 4.2";
  const { problems } = check(g, { exists: (p) => p !== "figures/width.png" && p !== "Sect. 4.2" });
  assert.ok(problems.some((p) => p.includes("Kupper2010:end-gone, which is not a card of the library")));
  assert.ok(problems.some((p) => p.includes("names Sect. 4.2, which is not a judgement, a library card, a node of this graph or a file of the project")));
  assert.ok(problems.some((p) => p.includes("figures/width.png, which is not")));
  assert.ok(problems.includes('figure "f-width": figures/width.png is not in the project'));
  g.figures[0] = { id: "t-widths", kind: "table", file: "tab:widths", shows: "s" };
  g.edges[2].from = "t-widths";
  assert.ok(!check(g, { exists: () => false }).problems.some((p) => p.includes("tab:widths")));
});

test("card faults: a title number the body lacks, a Claim range its Grounds contradict", () => {
  assert.deepEqual(cardFaults(find(graph(), "r-width")), []); // 26 % in the title is the Grounds' 0.26
  const bad = arg("r-x", "result", { title: "Tails 40 % closer within 12 pc", claim: "The width falls by 40–60 %.", grounds: [{ text: "falls by 38–44 %", source: "f.csv" }] });
  const faults = cardFaults(bad);
  assert.ok(faults.some((f) => f.includes("title states 12 pc")));
  assert.ok(!faults.some((f) => f.includes("title states 40 %"))); // 40 is stated, as the range's end
  const contradicted = arg("r-y", "result", { claim: "The width falls by 45–60 %.", grounds: [{ text: "falls by 38–44 %", source: "f.csv" }] });
  assert.ok(cardFaults(contradicted).some((f) => f.includes("45–60 %")));
});

// ---------------------------------------------------------------- shape

test("shape counts cards, depth and width per level", () => {
  const s = shape(["a", "b", "c", "d"], [{ from: "a", to: "c" }, { from: "b", to: "c" }, { from: "c", to: "d" }]);
  assert.deepEqual(s, { cards: 4, depth: 3, widths: [2, 1, 1] });
});

test("libraryShapes measures each paper on its own edges, without identity cards and groups", () => {
  const card = (id) => ({ id, type: "text", text: id, x: 0, y: 0, width: 1, height: 1 });
  const edge = (id, fromNode, toNode) => ({ id, fromNode, toNode, label: "Grounds" });
  const library = {
    nodes: [{ id: "@group-A", type: "group", x: 0, y: 0, width: 1, height: 1 }, card("A:paper"), card("A:x"), card("A:y"), card("B:z")],
    edges: [edge("1", "A:x", "A:y"), edge("@link-0", "A:y", "B:z")],
  };
  const shapes = libraryShapes(library);
  assert.deepEqual(shapes.get("A"), { cards: 2, depth: 2, widths: [1, 1] });
  assert.deepEqual(shapes.get("B"), { cards: 1, depth: 1, widths: [1] });
});

// ---------------------------------------------------------------- judgements and the CLI

/** A project with one proposal: round 1 handed over, round 2 still open. */
function project() {
  const root = mkdtempSync(join(tmpdir(), "paper-argument-"));
  const dir = join(root, "proposals", "tails");
  mkdirSync(dir, { recursive: true });
  const conj = (id, claim) => ({ id, type: "text", text: `## ${id} · Conjecture (V1) · shallow\n**Claim**: ${claim}\n**Rebuttal (criterion)**: r`, x: 0, y: 0, width: 1, height: 1, color: "3" });
  writeFileSync(join(dir, "round-1.canvas"), JSON.stringify({ nodes: [conj("C2", "T1 wider than T2."), conj("C5", "Slopes agree.")], edges: [] }));
  writeFileSync(
    join(dir, "round-1.progress.md"),
    "# Progress · tails · round 1\n\n## Verifications\n\n### V1 · done\n\n## Conjectures\n\n### C2 · held\n**Result**: 29.0 vs 21.5 pc · refuting condition: not met.\n**User**: 2026-10-01: \"holds\"\n\n### C5 · failed\n**Result**: slopes differ · refuting condition: met.\n**User**: 2026-10-01: \"fails\"\n\n## Log\n\n- 2026-10-01 · round handed over\n",
  );
  writeFileSync(join(dir, "round-2.progress.md"), "# Progress · tails · round 2\n\n## Verifications\n\n## Conjectures\n\n### C1 · open\n\n## Log\n");
  mkdirSync(join(root, "figures"));
  writeFileSync(join(root, "figures", "width.png"), "");
  mkdirSync(join(root, "sims"));
  writeFileSync(join(root, "sims", "specs.md"), "");
  mkdirSync(join(root, "papers", "tails"), { recursive: true });
  return root;
}

test("rounds reads every round, and whether it is handed over", () => {
  const root = project();
  const found = rounds(join(root, "proposals"));
  assert.deepEqual(found.map((r) => [r.round, r.handedOver]), [[1, true], [2, false]]);
  assert.equal(found[0].conjectures[0].claim, "T1 wider than T2.");
});

test("judgements lists the held and failed Conjectures, and with --argument which are new", () => {
  const root = project();
  const path = join(root, "papers", "tails", "argument.json");
  const g = graph();
  find(g, "r-width").qualifier = "";
  writeFileSync(path, JSON.stringify(g));
  const { code, stdout } = runWith(["judgements", join(root, "proposals"), "--argument", path]);
  assert.equal(code, 0);
  assert.match(stdout, /tails\/round-1:C2 · held · in the graph\n  Claim: T1 wider than T2\.\n  Result: 29\.0 vs 21\.5 pc/);
  assert.match(stdout, /tails\/round-1:C5 · failed · new/);
  assert.match(stdout, /tails\/round-2 · not handed over · skipped/);
  assert.equal(runWith(["judgements", join(root, "proposals"), "nope"]).code, 1);
});

test("check reads the project's progress records and files, and the graph's shape is measured", () => {
  const root = project();
  const path = join(root, "papers", "tails", "argument.json");
  const g = graph();
  writeFileSync(path, JSON.stringify(g));
  const libraryPath = join(root, "library.canvas");
  writeFileSync(libraryPath, JSON.stringify(LIBRARY));
  const ok = runWith(["check", path, "--library", libraryPath, "--root", root]);
  assert.equal(ok.stderr, "");
  assert.equal(ok.code, 0);
  assert.equal(ok.stdout, `ok ${path}\n`);

  find(g, "r-width").backing = "`tails/round-2:C1`";
  writeFileSync(path, JSON.stringify(g));
  const bad = runWith(["check", path, "--root", root]);
  assert.equal(bad.code, 1);
  assert.match(bad.stderr, /tails\/round-2:C1, which is open/);

  writeFileSync(path, "{ not json");
  assert.match(runWith(["check", path]).stderr, /not valid JSON/);
});

test("usage errors exit 2", () => {
  assert.equal(runWith([]).code, 2);
  assert.equal(runWith(["frobnicate"]).code, 2);
  assert.equal(runWith(["check"]).code, 2);
});
