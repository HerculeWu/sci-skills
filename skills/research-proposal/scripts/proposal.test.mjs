// Tests for proposal.mjs: `node --test` from this directory.

import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { cardRefs, checkProposal, run, tags } from "./proposal.mjs";

function card(id, text, color) {
  return { id, type: "text", text, x: 0, y: 0, width: 400, height: 200, ...(color ? { color } : {}) };
}

function edge(id, fromNode, toNode, label, color) {
  return { id, fromNode, fromSide: "top", toNode, toSide: "bottom", label, ...(color ? { color } : {}) };
}

/** A library of two papers, as library.mjs merge writes it: groups, prefixed cards, a cross-paper edge. */
function library() {
  return {
    nodes: [
      { id: "@group-Gieles2021", type: "group", x: 0, y: 0, width: 900, height: 900, label: "Gieles2021" },
      { id: "@group-Weis2025", type: "group", x: 1000, y: 0, width: 900, height: 900, label: "Weis2025" },
      card("Gieles2021:paper", "Title"),
      card("Gieles2021:A_setup", "## Claim\nsetup"),
      card("Weis2025:paper", "Title"),
      card("Weis2025:seed-scatter", "## Claim\nscatter"),
    ],
    edges: [edge("@link-0", "Gieles2021:A_setup", "Weis2025:seed-scatter", "Backing", "6")],
  };
}

const SHALLOW_TWO_SIDED = "## C1 · Conjecture (V1) · shallow · benchmark\n**Claim**: …\n**If it holds** → Backing\n**If it fails** → check the setup first";

/** A proposal in the shape of round-1-B: library card, costly Verification, its shallow Conjecture, the goal. */
function proposal() {
  return {
    nodes: [
      card("L_gieles", "`Gieles2021:A_setup` · intermediate\ntwo star-by-star models"),
      card("V1", "## V1 · Verification · costly\n**Yardstick**: σ_seed (`Weis2025:seed-scatter`)", "2"),
      card("C1", SHALLOW_TWO_SIDED, "3"),
      card("G", "# Goal · round 1", "5"),
    ],
    edges: [
      edge("e1", "L_gieles", "V1", "Backing"),
      edge("e2", "V1", "C1", "Grounds"),
      edge("e3", "C1", "V1", "holds → Backing", "3"),
      edge("e4", "L_gieles", "G", "Rebuttal", "1"),
      edge("e5", "C1", "G", "fails → Grounds", "3"),
    ],
  };
}

const node = (canvas, id) => canvas.nodes.find((n) => n.id === id);

function runWith(argv) {
  let stdout = "";
  let stderr = "";
  const code = run(argv, { stdout: (s) => (stdout += s), stderr: (s) => (stderr += s) });
  return { code, stdout, stderr };
}

test("checkProposal accepts a sound proposal", () => {
  assert.deepEqual(checkProposal(proposal(), library()), []);
});

test("checkProposal stops at a canvas Obsidian cannot open", () => {
  const broken = proposal();
  broken.edges.push(edge("e9", "C1", "gone", "Grounds"));
  broken.nodes.push({ id: "C9", type: "text", text: "`Nobody:x`" });
  const problems = checkProposal(broken, library());
  assert.equal(problems.length, 5, problems.join("\n"));
  assert.match(problems.join(), /node "C9" has no numeric x/);
  assert.match(problems.join(), /edge "e9": toNode "gone" is not a card/);
  assert.doesNotMatch(problems.join(), /identity card/, "a proposal has no identity card");
});

test("cardRefs finds backticked paper:card references and leaves URLs and plain code alone", () => {
  const text = "from `Gieles2021:A_setup` and `Weis2025:seed-scatter`; see `https://example.org`, `sims/project.yaml`, `K`";
  assert.deepEqual(cardRefs(text), [
    { paper: "Gieles2021", id: "Gieles2021:A_setup" },
    { paper: "Weis2025", id: "Weis2025:seed-scatter" },
  ]);
  assert.deepEqual(cardRefs(undefined), []);
});

test("checkProposal names every card reference missing from the library", () => {
  const p = proposal();
  node(p, "C1").text += "\n**Warrant**: `Gieles2021:A_setp`";
  node(p, "G").text += "\n`Kroupa2022:e-main`";
  assert.deepEqual(checkProposal(p, library()), [
    'card "C1": names "Gieles2021:A_setp", which is not a card of the library',
    'card "G": names "Kroupa2022:e-main", but no paper "Kroupa2022" is in the library',
  ]);
});

test("checkProposal accepts only the four labels and the two result labels", () => {
  const p = proposal();
  p.edges.push(edge("e6", "C1", "G", "Supports"), edge("e7", "C1", "G", "holds → Support"), edge("e8", "C1", "G"));
  const problems = checkProposal(p, library());
  assert.deepEqual(
    problems.map((s) => s.split(":")[0]),
    ['edge "e6"', 'edge "e7"', 'edge "e8"'],
  );
  assert.match(problems[0], /label "Supports" is none of Grounds, Warrant, Backing, Rebuttal, holds → <label>, fails → <label>/);
});

test("tags reads the ·-separated parts of the heading", () => {
  assert.deepEqual(tags(card("C1", SHALLOW_TWO_SIDED)), ["Conjecture (V1)", "shallow", "benchmark"]);
  assert.deepEqual(tags(card("C4", "\n## C4 · Conjecture (V1) · ⚠ not shallow\n…")), ["Conjecture (V1)", "⚠ not shallow"]);
  assert.deepEqual(tags(card("x", "")), []);
});

test("a costly Verification needs a shallow Conjecture with both outcomes", () => {
  const expected = ['costly Verification "V1": grounds no Conjecture tagged shallow with both "If it holds" and "If it fails", and none tagged ⚠'];

  const notShallow = proposal();
  node(notShallow, "C1").text = SHALLOW_TWO_SIDED.replace("· shallow ", "");
  assert.deepEqual(checkProposal(notShallow, library()), expected);

  const oneSided = proposal();
  node(oneSided, "C1").text = SHALLOW_TWO_SIDED.replace(/\n\*\*If it fails\*\*.*/, "");
  assert.deepEqual(checkProposal(oneSided, library()), expected);

  const unhung = proposal();
  unhung.edges.find((e) => e.id === "e2").label = "Backing";
  assert.deepEqual(checkProposal(unhung, library()), expected, "a Conjecture hangs on a Verification through Grounds");

  const notAShallowTag = proposal();
  node(notAShallowTag, "C1").text = SHALLOW_TWO_SIDED.replace("· shallow ", "· not shallow ");
  assert.deepEqual(checkProposal(notAShallowTag, library()), expected);
});

test("a costly Verification passes with a Conjecture marked ⚠ as the exception", () => {
  const p = proposal();
  node(p, "C1").text = "## C1 · Conjecture (V1) · ⚠ not shallow\n**Exception**: needs the outcome of C0\n**If it holds** → …";
  node(p, "C1").color = "1";
  assert.deepEqual(checkProposal(p, library()), []);
});

test("cheap Verifications and outlook cards carry no shallow requirement", () => {
  const p = proposal();
  p.nodes.push(card("V0", "## V0 · Verification · cheap", "3"), card("O3", "## O3 · Outlook · costly Verification V2 (no commitment)", "6"));
  assert.deepEqual(checkProposal(p, library()), []);
});

function writeFiles(proposalCanvas, libraryText = JSON.stringify(library())) {
  const dir = mkdtempSync(join(tmpdir(), "proposal-test-"));
  const paths = { proposal: join(dir, "round-1.canvas"), library: join(dir, "library.canvas") };
  writeFileSync(paths.proposal, typeof proposalCanvas === "string" ? proposalCanvas : JSON.stringify(proposalCanvas));
  writeFileSync(paths.library, libraryText);
  return paths;
}

test("run check prints ok for a sound proposal", () => {
  const paths = writeFiles(proposal());
  assert.deepEqual(runWith(["check", paths.proposal, paths.library]), { code: 0, stdout: `ok ${paths.proposal}\n`, stderr: "" });
});

test("run check prefixes every problem with the proposal's path", () => {
  const p = proposal();
  node(p, "G").text += " `Gieles2021:gone`";
  p.edges.push(edge("e6", "C1", "G", "Supports"));
  const paths = writeFiles(p);
  const result = runWith(["check", paths.proposal, paths.library]);
  assert.equal(result.code, 1);
  assert.equal(result.stdout, "");
  const lines = result.stderr.trim().split("\n");
  assert.equal(lines.length, 2);
  assert.ok(lines.every((l) => l.startsWith(`error: ${paths.proposal}: `)), result.stderr);
});

test("run check reports an unreadable proposal and library together", () => {
  const paths = writeFiles("{ not json", JSON.stringify({ nodes: [card("a:n1")], edges: [edge("x", "a:n1", "a:gone", "Grounds")] }));
  const result = runWith(["check", paths.proposal, paths.library]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /round-1\.canvas: not valid JSON/);
  assert.match(result.stderr, /library\.canvas: edge "x": toNode "a:gone" is not a card/);
});

test("run rejects wrong invocations with the usage", () => {
  for (const argv of [[], ["draw"], ["check"], ["check", "round-1.canvas"], ["check", "a", "b", "c"]]) {
    assert.equal(runWith(argv).code, 2, JSON.stringify(argv));
  }
  assert.match(runWith(["check", "only-one"]).stderr, /usage:/);
  assert.equal(runWith(["--help"]).code, 0);
});
