// Tests for paper-argument.mjs: `node --test` from this directory.

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { cardFaults, checkArgument, conjectureRefs, fileRefs, libraryRefs, libraryShapes, quantities, rounds, run, section, shape } from "./paper-argument.mjs";

function card(id, text, color) {
  return { id, type: "text", text, x: 0, y: 0, width: 400, height: 200, ...(color ? { color } : {}) };
}

function edge(id, fromNode, toNode, label, color) {
  return { id, fromNode, fromSide: "top", toNode, toSide: "bottom", label, ...(color ? { color } : {}) };
}

const REF = "tails/round-1";

/** A paper's Argument DAG in the format canvas-output.md fixes: Native → Method → Result → End. */
function argument() {
  return {
    nodes: [
      card("paper", "# A paper\n**Authors:** us"),
      card("n-epicycle", "# Epicycles\n**Native Argument**\n\n## Claim\nOverdensities at 3π r_J.\n\n## Grounds\n- `Kupper2010:end-yc`\n\n## Warrant\nEpicyclic approximation.", "5"),
      card("m-ensemble", "# Paired ensembles\n**Argument (Method)**\n\n## Claim\nForty seed pairs.\n\n## Grounds\n- 40 seeds per treatment (`sims/specs.md`).\n\n## Warrant\nSeed pairing removes shared noise.", "2"),
      card(
        "r-width",
        `# Tails 26 % closer to the orbit\n**Argument (Result)**\n\n## Claim\nThe width falls by 20–30 %.\n\n## Grounds\n- \`${REF}:C2\` held: 29.0 vs 21.5 pc, a fall of 0.26.\n\n## Warrant\nThe yardstick of m-ensemble.\n\n## Qualifier\n- \`${REF}:C5\` failed: the mass gradient differs.\n\nSource: \`${REF}:C2\`, \`figures/width.png\``,
      ),
      card("e-dynamics", `# The treatment moves the tail\n**End Argument**\n\n## Claim\nThe tail lies closer to the orbit.\n\n## Grounds\n- r-width.\n\n## Warrant\nThe yardstick of m-ensemble.\n\n## Rank\nmain\n\n## Sentence\nThe treatment changes where a tail lies.\n\n## Reader\nCluster dynamicists.`, "4"),
    ],
    edges: [
      edge("e1", "n-epicycle", "r-width", "Warrant"),
      edge("e2", "m-ensemble", "r-width", "Warrant"),
      edge("e3", "r-width", "e-dynamics", "Grounds"),
    ],
  };
}

const JUDGEMENTS = new Map([
  [`${REF}:C2`, "held"],
  [`${REF}:C5`, "failed"],
  [`${REF}:C7`, "not done"],
]);
const LIBRARY = { nodes: [card("Kupper2010:end-yc", "## Claim\nyc")], edges: [] };
const node = (canvas, id) => canvas.nodes.find((n) => n.id === id);
const check = (canvas, opts = {}) => checkArgument(canvas, { judgements: JUDGEMENTS, library: LIBRARY, ...opts });

function runWith(argv) {
  let stdout = "";
  let stderr = "";
  const code = run(argv, { stdout: (s) => (stdout += s), stderr: (s) => (stderr += s) });
  return { code, stdout, stderr };
}

// ---------------------------------------------------------------- reading cards

test("section reads up to the next heading or the Source line", () => {
  const text = "# T\n\n## Claim\nIt holds.\n\n## Grounds\n- a\n- b\n\nSource: x\nCites: y";
  assert.equal(section(text, "Claim"), "It holds.");
  assert.equal(section(text, "Grounds"), "- a\n- b");
  assert.equal(section(text, "Warrant"), null);
});

test("the three kinds of reference are told apart", () => {
  const text = "`tails/round-2:C9` held; `Weis2025:rg-shift`; `figures/r1/a.csv`; `notes.md`; `https://x.org`";
  assert.deepEqual(conjectureRefs(text).map((r) => r.ref), ["tails/round-2:C9"]);
  assert.deepEqual(libraryRefs(text).map((r) => r.id), ["Weis2025:rg-shift"]);
  assert.deepEqual(fileRefs(text), ["figures/r1/a.csv", "notes.md"]);
});

test("quantities pairs numbers and ranges with their units", () => {
  assert.deepEqual(quantities("26–38 % closer, 7.44 pc, 700 Myr"), [["26–38", "%"], ["7.44", "pc"], ["700", "Myr"]]);
});

// ---------------------------------------------------------------- check

test("a well-formed paper DAG passes", () => {
  const { problems, faults } = check(argument());
  assert.deepEqual(problems, []);
  assert.deepEqual(faults, []);
});

test("an id outside the six kinds, a missing kind line and a missing Warrant are reported", () => {
  const canvas = argument();
  canvas.nodes.push(card("x-observed", "# x\n## Claim\nc"));
  node(canvas, "m-ensemble").text = node(canvas, "m-ensemble").text.replace("**Argument (Method)**", "").replace(/## Warrant[\s\S]*/, "");
  const { problems } = check(canvas);
  assert.ok(problems.some((p) => p.includes('"x-observed"') && p.includes("starts with none")));
  assert.ok(problems.some((p) => p.includes('"m-ensemble"') && p.includes("**Argument (Method)**")));
  assert.ok(problems.some((p) => p.includes('"m-ensemble"') && p.includes("## Warrant")));
});

test("every End needs a Rank and a Sentence, and exactly one End is main", () => {
  const canvas = argument();
  canvas.nodes.push(card("e-orbit", "# Orbit\n**End Argument**\n\n## Claim\nc\n\n## Grounds\n- r-width.\n\n## Warrant\nw\n\n## Rank\nmain"));
  canvas.edges.push(edge("e4", "r-width", "e-orbit", "Grounds"));
  const { problems } = check(canvas);
  assert.ok(problems.some((p) => p.includes('"e-orbit"') && p.includes("## Sentence")));
  assert.ok(problems.some((p) => p.includes('"e-orbit"') && p.includes("## Reader")));
  assert.ok(problems.some((p) => p.startsWith("2 End Arguments ranked main")));
  node(canvas, "e-orbit").text = node(canvas, "e-orbit").text.replace("main", "primary");
  assert.ok(check(canvas).problems.some((p) => p.includes('"e-orbit"') && p.includes("## Rank must start")));
});

test("an End used by another card is reported", () => {
  const canvas = argument();
  canvas.nodes.push(card("d-mechanism", "# M\n**Argument (Discussion)**\n\n## Claim\nc\n\n## Grounds\n- e-dynamics.\n\n## Warrant\nw"));
  canvas.edges.push(edge("e4", "e-dynamics", "d-mechanism", "Grounds"), edge("e5", "d-mechanism", "e-dynamics", "Backing"));
  const { problems } = check(canvas);
  assert.ok(problems.some((p) => p.includes('End Argument "e-dynamics" is used by "d-mechanism"')));
  assert.ok(problems.some((p) => p.startsWith("circular dependency through: d-mechanism, e-dynamics")));
});

test("a card with no path to an End is reported", () => {
  const canvas = argument();
  canvas.edges = canvas.edges.filter((e) => e.id !== "e1");
  assert.deepEqual(check(canvas).problems, ['card "n-epicycle": no path to an End Argument']);
});

test("only held and failed Conjectures enter, and a failed one only as Qualifier or Rebuttal", () => {
  const canvas = argument();
  const r = node(canvas, "r-width");
  r.text = r.text.replace("## Warrant\n", `## Warrant\n\`${REF}:C5\` says so; \`${REF}:C7\` and \`${REF}:C99\` too.\n`);
  const { problems } = check(canvas);
  assert.ok(problems.some((p) => p.includes(`failed ${REF}:C5 under Warrant`)));
  assert.ok(problems.some((p) => p.includes(`${REF}:C7, which is not done`)));
  assert.ok(problems.some((p) => p.includes(`${REF}:C99, which no progress record holds`)));
});

test("a number in the Grounds names where it comes from", () => {
  const canvas = argument();
  const r = node(canvas, "r-width");
  r.text = r.text.replace("## Grounds\n", "## Grounds\n- A minimum at 135 pc.\n- The epicycle sits at 3π r_J (n-epicycle).\n");
  const { problems } = check(canvas);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /a Grounds item states a number but names no Conjecture.*minimum at 135 pc/);
});

test("library cards and project files are looked up", () => {
  const canvas = argument();
  node(canvas, "n-epicycle").text = node(canvas, "n-epicycle").text.replace("end-yc", "end-gone");
  const { problems } = check(canvas, { exists: (p) => p !== "figures/width.png" });
  assert.ok(problems.some((p) => p.includes("Kupper2010:end-gone, which is not a card of the library")));
  assert.ok(problems.some((p) => p.includes("figures/width.png, which is not in the project")));
});

test("edge labels are the four, and a Rebuttal edge is red", () => {
  const canvas = argument();
  canvas.edges.push(edge("e4", "n-epicycle", "e-dynamics", "Rebuttal"), edge("e5", "m-ensemble", "e-dynamics", "supports"));
  const { problems } = check(canvas);
  assert.ok(problems.some((p) => p.includes('edge "e4": a Rebuttal edge is red')));
  assert.ok(problems.some((p) => p.includes('edge "e5": label "supports"')));
});

test("card faults: a title number the body lacks, a Claim range its Grounds contradict", () => {
  const ok = node(argument(), "r-width");
  assert.deepEqual(cardFaults(ok), []); // 26 % in the title is the Grounds' 0.26
  const bad = { id: "r-x", text: "# Tails 40 % closer within 12 pc\n\n## Claim\nThe width falls by 40–60 %.\n\n## Grounds\n- falls by 38–44 % (`f.csv`)\n\n## Warrant\nw" };
  const faults = cardFaults(bad);
  assert.ok(faults.some((f) => f.includes("title states 12 pc")));
  assert.ok(!faults.some((f) => f.includes("title states 40 %"))); // 40 is stated, as the range's end
  const contradicted = { id: "r-y", text: "# T\n\n## Claim\nThe width falls by 45–60 %.\n\n## Grounds\n- falls by 38–44 % (`f.csv`)\n\n## Warrant\nw" };
  assert.ok(cardFaults(contradicted).some((f) => f.includes("45–60 %")));
});

// ---------------------------------------------------------------- shape

test("shape counts cards, depth and width per level", () => {
  const s = shape(["a", "b", "c", "d"], [edge("1", "a", "c", "Grounds"), edge("2", "b", "c", "Grounds"), edge("3", "c", "d", "Grounds")]);
  assert.deepEqual(s, { cards: 4, depth: 3, widths: [2, 1, 1] });
});

test("libraryShapes measures each paper on its own edges, without identity cards and groups", () => {
  const library = {
    nodes: [
      { id: "@group-A", type: "group", x: 0, y: 0, width: 1, height: 1 },
      card("A:paper", "t"),
      card("A:x", "x"),
      card("A:y", "y"),
      card("B:z", "z"),
    ],
    edges: [edge("1", "A:x", "A:y", "Grounds"), edge("@link-0", "A:y", "B:z", "Backing")],
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
  const conj = (id, claim) => card(id, `## ${id} · Conjecture (V1) · shallow\n**Claim**: ${claim}\n**Rebuttal (criterion)**: r`, "3");
  writeFileSync(join(dir, "round-1.canvas"), JSON.stringify({ nodes: [conj("C2", "T1 wider than T2."), conj("C5", "Slopes agree.")], edges: [] }));
  writeFileSync(
    join(dir, "round-1.progress.md"),
    "# Progress · tails · round 1\n\n## Verifications\n\n### V1 · done\n\n## Conjectures\n\n### C2 · held\n**Result**: 29.0 vs 21.5 pc · refuting condition: not met.\n**User**: 2026-10-01: \"holds\"\n\n### C5 · failed\n**Result**: slopes differ · refuting condition: met.\n**User**: 2026-10-01: \"fails\"\n\n## Log\n\n- 2026-10-01 · round handed over\n",
  );
  writeFileSync(join(dir, "round-2.progress.md"), "# Progress · tails · round 2\n\n## Verifications\n\n## Conjectures\n\n### C1 · open\n\n## Log\n");
  mkdirSync(join(root, "figures"));
  writeFileSync(join(root, "figures", "width.png"), "");
  writeFileSync(join(root, "sims.md"), "");
  return root;
}

test("rounds reads every round, and whether it is handed over", () => {
  const root = project();
  const found = rounds(join(root, "proposals"));
  assert.deepEqual(found.map((r) => [r.round, r.handedOver]), [[1, true], [2, false]]);
  assert.equal(found[0].conjectures[0].claim, "T1 wider than T2.");
});

test("judgements lists the held and failed Conjectures, and with --canvas which are new", () => {
  const root = project();
  const canvasPath = join(root, "argument.canvas");
  writeFileSync(canvasPath, JSON.stringify({ nodes: [card("r-a", "`tails/round-1:C2` held")], edges: [] }));
  const { code, stdout } = runWith(["judgements", join(root, "proposals"), "--canvas", canvasPath]);
  assert.equal(code, 0);
  assert.match(stdout, /tails\/round-1:C2 · held · on canvas\n  Claim: T1 wider than T2\.\n  Result: 29\.0 vs 21\.5 pc/);
  assert.match(stdout, /tails\/round-1:C5 · failed · new/);
  assert.match(stdout, /tails\/round-2 · not handed over · skipped/);
  assert.equal(runWith(["judgements", join(root, "proposals"), "nope"]).code, 1);
});

test("check reads the project's progress records and files", () => {
  const root = project();
  const canvas = argument();
  node(canvas, "m-ensemble").text = node(canvas, "m-ensemble").text.replace("sims/specs.md", "sims.md");
  const canvasPath = join(root, "argument.canvas");
  writeFileSync(canvasPath, JSON.stringify(canvas));
  const libraryPath = join(root, "library.canvas");
  writeFileSync(libraryPath, JSON.stringify(LIBRARY));
  const ok = runWith(["check", canvasPath, "--library", libraryPath, "--root", root]);
  assert.equal(ok.stderr, "");
  assert.equal(ok.code, 0);
  assert.equal(ok.stdout, `ok ${canvasPath}\n`);

  node(canvas, "r-width").text += "\n\n## Backing\n`tails/round-2:C1`";
  writeFileSync(canvasPath, JSON.stringify(canvas));
  const bad = runWith(["check", canvasPath, "--root", root]);
  assert.equal(bad.code, 1);
  assert.match(bad.stderr, /tails\/round-2:C1, which is open/);
});

test("usage errors exit 2", () => {
  assert.equal(runWith([]).code, 2);
  assert.equal(runWith(["frobnicate"]).code, 2);
  assert.equal(runWith(["check"]).code, 2);
});
