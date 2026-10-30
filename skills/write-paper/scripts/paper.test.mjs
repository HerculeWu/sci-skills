// Tests for paper.mjs: `node --test` from this directory.

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { bibEntries, cardList, checkText, cites, kinds, lintOutline, paperFields, parseOutline, prose, run, sourceNumbers, units, wordCount } from "./paper.mjs";

function card(id, text, color) {
  return { id, type: "text", text, x: 0, y: 0, width: 400, height: 200, ...(color ? { color } : {}) };
}
const edge = (id, fromNode, toNode, label) => ({ id, fromNode, fromSide: "top", toNode, toSide: "bottom", label });

/** A small paper DAG: a Method, a Result and the main End. */
function canvas() {
  return {
    nodes: [
      card("paper", "# A paper"),
      card("m-ensemble", "# Paired ensembles\n**Argument (Method)**\n\n## Claim\nForty seed pairs per treatment.\n\n## Grounds\n- 40 seeds (`sims/specs.md`).\n\n## Warrant\nSeed pairing removes the noise the treatments share."),
      card("r-width", "# Tails closer to the orbit\n**Argument (Result)**\n\n## Claim\nThe width falls from 29.0 to 21.5 pc.\n\n## Grounds\n- `tails/round-1:C2` held: 29.0 vs 21.5 pc, a fall of 0.26 (`data/width.csv`).\n\n## Warrant\nThe yardstick of m-ensemble.\n\nCites: Kupper A., 2010, MNRAS, 401, 105 (doi:10.1111/j.1365-2966.2009.15690.x)"),
      card(
        "e-dynamics",
        "# The treatment moves the tail\n**End Argument**\n\n## Claim\nThe tail lies 26 % closer to the orbit.\n\n## Grounds\n- r-width.\n\n## Warrant\nThe yardstick.\n\n## Qualifier\nTwo masses on one eccentric orbit.\n\n## Rank\nmain\n\n## Sentence\nThe treatment changes where a tail lies.\n\n## Reader\nDynamicists.",
      ),
    ],
    edges: [edge("1", "m-ensemble", "r-width", "Warrant"), edge("2", "r-width", "e-dynamics", "Grounds")],
  };
}

const OUTLINE = `# Outline

## Abstract · Abstract
#### abstract.results
cards: e-dynamics (Claim, Qualifier, Sentence)
kind: RESULTS
role: headline
tone: flat
voice: free
budget: 15–40
follows: —
reader-question: What does the paper find?
reader-takeaway: The treatment moves the tail.
- Give the main sentence first.

## 2 Models · Methods
#### methods.ensemble
cards: m-ensemble (Claim, Grounds)
kind: MODEL
role: headline
tone: flat
voice: passive
budget: 5–30
follows: —
reader-question: How are the models set up?
reader-takeaway: Each treatment runs on the same seeds.
- State the number of seeds.

## 3 Width · Results
#### results.width
cards: r-width (Claim, Grounds)
kind: CASE
role: headline
tone: flat
voice: we
budget: 10–40
follows: —
reader-question: Does the treatment change the width?
reader-takeaway: The width falls.
figure: figures/width.png — caption states the fall
context: The two masses bracket the clusters observed (data/why.md).
- State the width of each treatment.

## 5 Conclusions · Conclusions
#### conclusions.main
cards: e-dynamics (Sentence, Qualifier)
kind: SUMMARY
role: headline
tone: flat
voice: we
budget: 10–40
follows: —
reader-question: What does the paper leave the reader with?
reader-takeaway: The main sentence.
- Repeat the main sentence.
`;

const GUIDE = "# Section guide\n\n## Kinds\n- `RESULTS` (Abstract): the findings.\n- `MODEL` (Methods): the models.\n- `CASE` (Results): a case.\n- `SUMMARY` (Conclusions): what was done.\n";

const TEXT = {
  "00-abstract.tex": "% outline: abstract.results\n% source: written\nThe treatment changes where a tail lies: the tail lies 26\\,\\% closer to the orbit, for two masses on one eccentric orbit.\n",
  "02-methods.tex": "\\section{Models}\n% outline: methods.ensemble\n% source: copy Kupper2010 §2 ¶3\nEach treatment was integrated with 40 seeds \\citep{Kupper2010}.\n",
  "03-results.tex":
    "\\section{Width}\n% outline: results.width\n% source: imitate Kupper2010 §4 ¶1\nThe width falls from 29.0 to 21.5~pc, by 26\\,\\% (Fig.~\\ref{fig:width}).\n\\begin{figure}\\caption{Width 99.9 pc}\\end{figure}\n",
  "05-conclusions.tex": "\\section{Conclusions}\n% outline: conclusions.main\n% source: written\nThe treatment changes where a tail lies, in two masses on one eccentric orbit.\n",
};

const BIB = "@ARTICLE{Kupper2010,\n  doi = {10.1111/j.1365-2966.2009.15690.x},\n}\n";

/** The inputs of checkText for the fixture text, with `edit` applied to the section files first. */
function textInputs(edit = (t) => t) {
  const files = Object.entries(edit({ ...TEXT })).map(([name, text]) => ({ name, text }));
  return {
    units: units(files),
    outline: parseOutline(OUTLINE),
    canvas: canvas(),
    fields: { "abstract limit": "300" },
    sources: [{ text: canvas().nodes.map((n) => n.text).join("\n") }, { text: "fall,width\n0.2604,29.04\n", csv: true }],
    bib: bibEntries(BIB),
    cited: ["Kupper2010"],
  };
}

function runWith(argv) {
  let stdout = "";
  let stderr = "";
  const code = run(argv, { stdout: (s) => (stdout += s), stderr: (s) => (stderr += s) });
  return { code, stdout, stderr };
}

// ---------------------------------------------------------------- reading

test("paperFields, kinds and cardList read the plugin's formats", () => {
  assert.deepEqual(paperFields("**Group**: simulation\n**Abstract limit**: 300 words\n"), { group: "simulation", "abstract limit": "300 words" });
  const k = kinds(GUIDE);
  assert.deepEqual([...k.get("results")], ["CASE"]);
  assert.deepEqual(cardList("r-width (Claim, Grounds), e-dynamics"), [
    { id: "r-width", parts: ["Claim", "Grounds"] },
    { id: "e-dynamics", parts: [] },
  ]);
  assert.deepEqual(cardList("none"), []);
});

test("parseOutline reads sections with their group, entries with fields and instructions", () => {
  const o = parseOutline(OUTLINE);
  assert.deepEqual(o.sections.map((s) => [s.title, s.group]), [["Abstract", "Abstract"], ["2 Models", "Methods"], ["3 Width", "Results"], ["5 Conclusions", "Conclusions"]]);
  const e = o.entries[2];
  assert.equal(e.id, "results.width");
  assert.equal(e.fields.budget, "10–40");
  assert.deepEqual(e.instructions, ["State the width of each treatment."]);
});

test("prose drops comments, floats, citations and commands", () => {
  const p = prose("% outline: x\nThe width is $w = 21.5$~pc \\citep{A2020} (Fig.~\\ref{f}).\n\\begin{figure}\\caption{9 pc}\\end{figure}\n");
  assert.equal(p, "The width is w = 21.5 pc (Fig. ).");
  assert.equal(wordCount(p), 7);
});

test("sourceNumbers rounds CSV cells as a text would write them", () => {
  const set = sourceNumbers([{ text: "a,b\n29.0412,0.2604\n", csv: true }]);
  for (const n of ["29.04", "29.0", "29", "0.260", "0.26"]) assert.ok(set.has(n), n);
});

// ---------------------------------------------------------------- lint-outline

const lint = (text, opts = {}) => lintOutline(parseOutline(text), { canvas: canvas(), fields: { "abstract limit": "300" }, kindsByGroup: kinds(GUIDE), ...opts });

test("a well-formed outline passes", () => {
  assert.deepEqual(lint(OUTLINE), []);
});

test("fields, values and ids are checked", () => {
  const bad = OUTLINE.replace("#### methods.ensemble", "#### Methods_Ensemble")
    .replace("tone: flat\nvoice: passive", "voice: passive\ntone: loud")
    .replace("budget: 5–30", "budget: 30–5")
    .replace("How are the models set up?", "How are the models set up")
    .replace("- State the number of seeds.\n", "");
  const problems = lint(bad);
  for (const want of ["an id is", "fields out of order", 'tone "loud"', "budget", 'does not end in "?"', "no instruction line"]) {
    assert.ok(problems.some((p) => p.includes(want)), want);
  }
});

test("kinds must belong to the section's group; groups to the Kinds block", () => {
  const problems = lint(OUTLINE.replace("kind: CASE", "kind: MODEL").replace("## 2 Models · Methods", "## 2 Models · Setup"));
  assert.ok(problems.some((p) => p.includes('kind "MODEL" is not a kind of Results')));
  assert.ok(problems.some((p) => p.includes('group "Setup" is not in the Kinds block')));
});

test("cards and parts exist; figures and context sources exist", () => {
  const problems = lint(OUTLINE.replace("r-width (Claim, Grounds)", "r-width (Claim, Backing), r-gone"), { exists: (p) => p !== "data/why.md" && p !== "figures/width.png" });
  for (const want of ['has no ## Backing', 'card "r-gone" is not on the canvas', 'figure "figures/width.png"', 'context source "data/why.md"']) {
    assert.ok(problems.some((p) => p.includes(want)), want);
  }
});

test("coverage: every non-Native card listed, every End in the abstract and conclusions, the main Sentence in both", () => {
  const problems = lint(OUTLINE.replace("cards: e-dynamics (Sentence, Qualifier)", "cards: e-dynamics (Qualifier)").replace("cards: m-ensemble (Claim, Grounds)", "cards: none"));
  assert.ok(problems.some((p) => p.includes('card "m-ensemble" is listed by no entry')));
  assert.ok(problems.some((p) => p.includes("Sentence is listed by no Conclusions entry")));
});

test("one headline per section, and the abstract's budgets within the journal's limit", () => {
  const problems = lint(OUTLINE.replace("role: headline\ntone: flat\nvoice: passive", "role: support\ntone: flat\nvoice: passive"), { fields: { "abstract limit": "30" } });
  assert.ok(problems.some((p) => p.includes('section "2 Models": 0 headline')));
  assert.ok(problems.some((p) => p.includes("sum to 40 words; the journal's limit is 30")));
});

// ---------------------------------------------------------------- check

test("a text that follows its sources passes", () => {
  assert.deepEqual(checkText(textInputs()), []);
});

test("every entry is executed once, and every paragraph names its source", () => {
  const problems = checkText(
    textInputs((t) => ({ ...t, "02-methods.tex": t["02-methods.tex"].replace("% source: copy Kupper2010 §2 ¶3\n", ""), "04-extra.tex": "% outline: results.width\n% source: written\nAgain 29.0 pc.\n" })),
  );
  assert.ok(problems.some((p) => p.includes('"methods.ensemble": no `% source:')));
  assert.ok(problems.some((p) => p.includes('entry "results.width": executed by 2 paragraphs')));
});

test("a number with no source is reported; in the conclusions it must stand on an End or its Grounds", () => {
  const problems = checkText(
    textInputs((t) => ({
      ...t,
      "03-results.tex": t["03-results.tex"].replace("21.5~pc", "21.7~pc"),
      "05-conclusions.tex": t["05-conclusions.tex"].replace("eccentric orbit.", "eccentric orbit with 40 seeds."),
    })),
  );
  assert.ok(problems.some((p) => p.includes('"results.width" states 21.7')));
  assert.ok(problems.some((p) => p.includes('"conclusions.main" (Conclusions) states 40, on no End card')));
});

test("a percentage may restate a fraction its source gives", () => {
  const problems = checkText(textInputs((t) => ({ ...t, "03-results.tex": t["03-results.tex"].replace("26\\,\\%", "27\\,\\%") })));
  assert.deepEqual(problems, ["03-results.tex: paragraph \"results.width\" states 27, found on no card and in no file the canvas or the outline names"]);
});

test("budgets, the abstract limit, the Qualifier's trace and the main Sentence", () => {
  const problems = checkText({
    ...textInputs((t) => ({ ...t, "05-conclusions.tex": "% outline: conclusions.main\n% source: written\nThe treatment moves where a tail lies, as shown above here today.\n" })),
    fields: { "abstract limit": "10" },
  });
  for (const want of ["the abstract has", "without a trace of its Qualifier", "Sentence is not in the conclusions"]) assert.ok(problems.some((p) => p.includes(want)), want);
  const long = checkText(textInputs((t) => ({ ...t, "02-methods.tex": t["02-methods.tex"].replace("40 seeds", `40 seeds ${"and more ".repeat(20)}`) })));
  assert.ok(long.some((p) => p.includes('"methods.ensemble" has') && p.includes("budget is 5–30")));
});

test("card text copied into the prose is reported", () => {
  const problems = checkText(textInputs((t) => ({ ...t, "02-methods.tex": t["02-methods.tex"].replace("Each treatment", "Seed pairing removes the noise the treatments share; each treatment") })));
  assert.ok(problems.some((p) => p.includes('copies card "m-ensemble"')));
});

test("citations are in refs.bib and stand on a card", () => {
  const inputs = textInputs();
  const problems = checkText({ ...inputs, cited: ["Kupper2010", "Gone2020", "Other2019"], bib: bibEntries(`${BIB}\n@ARTICLE{Other2019,\n  doi = {10.1/xyz},\n}\n`) });
  assert.ok(problems.some((p) => p.includes('"Gone2020" is not in refs.bib')));
  assert.ok(problems.some((p) => p.includes('"Other2019" stands on no card')));
  assert.ok(!problems.some((p) => p.includes('"Kupper2010"'))); // its DOI is on r-width's Cites line
});

test("a source line names a labelled library paper; a context-? entry is left not written", () => {
  const outline = OUTLINE.replace("context: The two masses bracket the clusters observed (data/why.md).", "context: ?");
  const problems = checkText({ ...textInputs(), outline: parseOutline(outline), labelled: (k) => k !== "Kupper2010" });
  assert.ok(problems.some((p) => p.includes('source "Kupper2010" has no labels')));
  assert.ok(problems.some((p) => p.includes("its entry's context is ?")));
});

// ---------------------------------------------------------------- cites and the CLI

test("cites pairs library papers, found by key or DOI, with their bibcodes and lists Cites lines outside the library", () => {
  const c = canvas();
  c.nodes[1].text += "\n\nCites: Someone B., 2001, ApJ, 1, 1";
  const meta = new Map([["Kupper2010", { bibcode: "2010MNRAS.401..105K", doi: "10.1111/j.1365-2966.2009.15690.x" }]]);
  const { pairs, outside } = cites(c, meta);
  assert.deepEqual(pairs, ["Kupper2010=2010MNRAS.401..105K"]);
  assert.deepEqual(outside, ["Someone B., 2001, ApJ, 1, 1"]);
});

/** A project on disk: canvas, paper.md, calibration, outline, text, refs.bib, data. */
function project() {
  const root = mkdtempSync(join(tmpdir(), "write-paper-"));
  const paper = join(root, "papers", "tails");
  const v1 = join(paper, "v1");
  mkdirSync(join(v1, "sections"), { recursive: true });
  mkdirSync(join(root, "lib", "writing", "labels"), { recursive: true });
  mkdirSync(join(root, "lib", "Kupper2010"), { recursive: true });
  mkdirSync(join(root, "figures"));
  mkdirSync(join(root, "data"));
  mkdirSync(join(root, "sims"));
  writeFileSync(join(paper, "argument.canvas"), JSON.stringify(canvas()));
  writeFileSync(join(paper, "paper.md"), "# Paper\n\n**Group**: simulation\n**Library**: lib\n**Abstract limit**: 300\n");
  writeFileSync(join(root, "lib", "writing", "section-guide.md"), GUIDE);
  writeFileSync(join(root, "lib", "writing", "labels", "Kupper2010.json"), "{}");
  writeFileSync(join(root, "lib", "Kupper2010", "meta.json"), JSON.stringify({ bibcode: "2010MNRAS.401..105K", doi: "10.1111/j.1365-2966.2009.15690.x" }));
  writeFileSync(join(root, "figures", "width.png"), "");
  writeFileSync(join(root, "data", "why.md"), "Two masses.");
  writeFileSync(join(root, "data", "width.csv"), "fall,width\n0.2604,29.04\n");
  writeFileSync(join(root, "sims", "specs.md"), "40 seeds");
  writeFileSync(join(v1, "outline.md"), OUTLINE);
  for (const [name, text] of Object.entries(TEXT)) writeFileSync(join(v1, "sections", name), text);
  writeFileSync(join(v1, "refs.bib"), BIB);
  return { root, paper, v1 };
}

test("the commands run on a project", () => {
  const { root, paper, v1 } = project();
  const lintRun = runWith(["lint-outline", join(v1, "outline.md"), "--root", root]);
  assert.equal(lintRun.stderr, "");
  assert.match(lintRun.stdout, /^ok .*: 4 entries\n$/);
  const checkRun = runWith(["check", v1, "--root", root]);
  assert.equal(checkRun.stderr, "");
  assert.equal(checkRun.code, 0);
  const citesRun = runWith(["cites", paper, "--root", root]);
  assert.match(citesRun.stdout, /^Kupper2010=2010MNRAS\.401\.\.105K\n/);
  writeFileSync(join(v1, "sections", "03-results.tex"), TEXT["03-results.tex"].replace("29.0", "31.0"));
  const bad = runWith(["check", v1, "--root", root]);
  assert.equal(bad.code, 1);
  assert.match(bad.stderr, /states 31\.0/);
});

test("usage errors exit 2", () => {
  assert.equal(runWith([]).code, 2);
  assert.equal(runWith(["frobnicate"]).code, 2);
  assert.equal(runWith(["check"]).code, 2);
});
