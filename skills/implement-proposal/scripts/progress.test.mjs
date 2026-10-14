// Tests for progress.mjs: `node --test` from this directory.

import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { alignment, checkRecord, field, fingerprint, parseRecord, proposalCards, run, statusLines } from "./progress.mjs";

function card(id, text, color) {
  return { id, type: "text", text, x: 0, y: 0, width: 400, height: 200, ...(color ? { color } : {}) };
}

function edge(id, fromNode, toNode, label) {
  return { id, fromNode, fromSide: "top", toNode, toSide: "bottom", label };
}

const V1 = "## V1 · Verification · costly\n**Design (argument)**: run T1 and T2\nwith k seeds each.\n\n**Needs**\n- ✓ code";
const V2 = "## V2 · Verification · cheap\n**Design (argument)**: re-analyse V1 snapshots.\n**Yields**: widths";
const C1 = "## C1 · Conjecture (V1) · shallow\n**Claim**: T1 tails are wider than T2 tails.\n**Rebuttal (criterion)**: a difference within 2 SE refutes it.\n\n**If it holds** → x";
const C2 = "## C2 · Conjecture (V2) · bet\n**Claim**: widths agree.\n**Rebuttal (criterion)**: above 2 SE refutes it.";

/** A round-1 proposal in the shape of the sample: goal, outlook, two Verifications and their Conjectures. */
function proposal({ v1 = V1, c2 = C2 } = {}) {
  return {
    nodes: [
      card("goal", "# Goal · round 1", "5"),
      card("O1", "## O1 · Outlook (no commitment)", "6"),
      card("lib", "`Weis2025:rg-shift` · End\nshift"),
      card("V1", v1, "2"),
      card("V2", V2, "3"),
      card("C1", C1, "3"),
      card("C2", c2, "3"),
    ],
    edges: [edge("e1", "V1", "C1", "Grounds"), edge("e2", "V2", "C2", "Grounds")],
  };
}

const RECORD = `# Progress · tails · round 1

Canvas: \`round-1.canvas\` · started 2026-10-15 · written by the agent; the user may edit it, the file wins over memory.

## Verifications

### V1 · waiting
**on**: \`sims/r1-v1/status.json\`
**design**: sha256:DESIGN (at in progress, 2026-10-16)
**Decided**
- k = 10 seeds. — user, 2026-10-16
- go — user, 2026-10-16: "go"
**Results**
- (none yet)

### V2 · dropped
**Decided**
- dropped — user, 2026-10-20: "Not this round."

## Conjectures

### C1 · held
**claim + criterion**: sha256:CLAIM (at result in, 2026-10-29)
**Result**: 1.42 (criterion: a difference within 2 SE refutes it) · refuting condition: not met. \`analysis/out/c1.csv\`
**User**: 2026-10-30: "C1 holds."

### C2 · not done
**User**: 2026-10-30: "Drop the rest."

## Log

- 2026-10-15 · Record created from the canvas. · Next: V1.
- 2026-10-30 · round handed over
`;

/** RECORD with the fingerprints the canvas gives now. */
function record(canvas = proposal()) {
  const cards = proposalCards(canvas);
  const fp = (id) => fingerprint(cards.find((c) => c.id === id));
  return RECORD.replace("sha256:DESIGN", fp("V1")).replace("sha256:CLAIM", fp("C1"));
}

function runWith(argv, today = "2026-11-01") {
  let stdout = "";
  let stderr = "";
  const code = run(argv, { stdout: (s) => (stdout += s), stderr: (s) => (stderr += s), today });
  return { code, stdout, stderr };
}

function tempDir() {
  return mkdtempSync(join(tmpdir(), "progress-test-"));
}

/** proposals/<name>/ holding the given files; returns the proposal directory. */
function proposalDir(root, name, files) {
  const dir = join(root, "proposals", name);
  mkdirSync(dir, { recursive: true });
  for (const [file, content] of Object.entries(files)) writeFileSync(join(dir, file), typeof content === "string" ? content : JSON.stringify(content));
  return dir;
}

// ---------------------------------------------------------------- cards and fingerprints

test("field takes the text after the label up to a blank line or the next bold field", () => {
  assert.equal(field(V1, "Design (argument)"), "run T1 and T2 with k seeds each.");
  assert.equal(field(C1, "Claim"), "T1 tails are wider than T2 tails.");
  assert.equal(field(C1, "Qualifier"), null);
});

test("proposalCards finds Verifications and Conjectures by heading, V before C, and skips every other card", () => {
  assert.deepEqual(
    proposalCards(proposal()).map((c) => c.id),
    ["V1", "V2", "C1", "C2"],
  );
  const renamed = proposal();
  renamed.nodes.find((n) => n.id === "V1").id = "node-17";
  assert.ok(proposalCards(renamed).some((c) => c.id === "V1"));
});

test("proposalCards orders by number, so V10 comes after V2", () => {
  const canvas = { nodes: [card("a", "## V10 · Verification · cheap"), card("b", "## V2 · Verification · cheap")] };
  assert.deepEqual(proposalCards(canvas).map((c) => c.id), ["V2", "V10"]);
});

test("proposalCards rejects two cards with the same heading id", () => {
  const canvas = { nodes: [card("a", V1), card("b", V1)] };
  assert.throws(() => proposalCards(canvas), (e) => e.problems[0].includes("two cards are headed V1"));
});

test("a fingerprint ignores re-wrapping but sees a changed word", () => {
  const fp = (canvas, id) => fingerprint(proposalCards(canvas).find((c) => c.id === id));
  const base = fp(proposal(), "V1");
  assert.match(base, /^sha256:[0-9a-f]{8}$/);
  assert.equal(fp(proposal({ v1: V1.replace("T2\nwith", "T2   with") }), "V1"), base);
  assert.notEqual(fp(proposal({ v1: V1.replace("k seeds", "10 seeds") }), "V1"), base);
});

test("a Conjecture's fingerprint covers its Claim and its criterion", () => {
  const fp = (c2) => fingerprint(proposalCards(proposal({ c2 })).find((c) => c.id === "C2"));
  const base = fp(C2);
  assert.notEqual(fp(C2.replace("widths agree", "widths differ")), base);
  assert.notEqual(fp(C2.replace("above 2 SE", "above 3 SE")), base);
  assert.equal(fp(C2.replace("**Rebuttal", "**Qualifier**: one mass.\n**Rebuttal")), base);
});

test("a card without the field it is fingerprinted on is an error", () => {
  const canvas = proposal({ c2: "## C2 · Conjecture (V2)\n**Claim**: widths agree." });
  assert.throws(() => fingerprint(proposalCards(canvas).find((c) => c.id === "C2")), (e) => e.problems[0].includes("Rebuttal (criterion)"));
});

// ---------------------------------------------------------------- init

test("init writes a record with every Verification not started and every Conjecture open", () => {
  const dir = proposalDir(tempDir(), "tails", { "round-1.canvas": proposal() });
  const { code, stdout } = runWith(["init", join(dir, "round-1.canvas")]);
  assert.equal(code, 0, stdout);
  const text = readFileSync(join(dir, "round-1.progress.md"), "utf-8");
  assert.ok(text.startsWith("# Progress · tails · round 1\n"));
  assert.match(text, /started 2026-11-01/);
  for (const h of ["### V1 · not started", "### V2 · not started", "### C1 · open", "### C2 · open"]) assert.ok(text.includes(h), h);
  assert.match(text, /- 2026-11-01 · Record created from the canvas: 2 Verifications not started, 2 Conjectures open\./);
  assert.deepEqual(checkRecord(parseRecord(text)), []);
});

test("init refuses to overwrite a record", () => {
  const dir = proposalDir(tempDir(), "tails", { "round-1.canvas": proposal(), "round-1.progress.md": "keep me" });
  const { code, stderr } = runWith(["init", join(dir, "round-1.canvas")]);
  assert.equal(code, 1);
  assert.match(stderr, /already exists/);
  assert.equal(readFileSync(join(dir, "round-1.progress.md"), "utf-8"), "keep me");
});

test("init points a carried-over Conjecture at the round-k card with the same Claim, and its status there", () => {
  const round2 = proposal();
  round2.nodes.find((n) => n.id === "C1").text = "## C1 · Conjecture (V1) · shallow · from round 1\n**Claim**: widths   agree.\n**Rebuttal (criterion)**: x";
  const dir = proposalDir(tempDir(), "tails", { "round-1.canvas": proposal(), "round-1.progress.md": record(), "round-2.canvas": round2 });
  const { code, stdout } = runWith(["init", join(dir, "round-2.canvas")]);
  assert.equal(code, 0, stdout);
  assert.match(readFileSync(join(dir, "round-2.progress.md"), "utf-8"), /### C1 · open\n\*\*from round 1\*\*: C2 · not done\n/);
  assert.match(stdout, /from round 1: C1 is C2 \(not done\)/);
});

test("init writes no match, and says so, when no round-k Conjecture has the same Claim", () => {
  const round2 = proposal();
  round2.nodes.find((n) => n.id === "C1").text = "## C1 · Conjecture (V1) · from round 1\n**Claim**: something new.\n**Rebuttal (criterion)**: x";
  const dir = proposalDir(tempDir(), "tails", { "round-1.canvas": proposal(), "round-2.canvas": round2 });
  const { stdout } = runWith(["init", join(dir, "round-2.canvas")]);
  assert.match(readFileSync(join(dir, "round-2.progress.md"), "utf-8"), /\*\*from round 1\*\*: → no match/);
  assert.match(stdout, /no match: C1 \(from round 1\): no Conjecture of round-1.canvas has the same Claim; ask the user/);
});

test("init writes 'no record' when round k has a matching card but no record", () => {
  const round2 = proposal();
  round2.nodes.find((n) => n.id === "C1").text = "## C1 · Conjecture (V1) · from round 1\n**Claim**: widths agree.\n**Rebuttal (criterion)**: x";
  const dir = proposalDir(tempDir(), "tails", { "round-1.canvas": proposal(), "round-2.canvas": round2 });
  runWith(["init", join(dir, "round-2.canvas")]);
  assert.match(readFileSync(join(dir, "round-2.progress.md"), "utf-8"), /\*\*from round 1\*\*: C2 · no record/);
});

test("init needs a canvas named round-N.canvas", () => {
  const dir = proposalDir(tempDir(), "tails", { "draft.canvas": proposal() });
  assert.equal(runWith(["init", join(dir, "draft.canvas")]).code, 2);
  assert.equal(existsSync(join(dir, "round-1.progress.md")), false);
});

// ---------------------------------------------------------------- align

test("align reports nothing when the record matches the canvas", () => {
  assert.deepEqual(alignment(proposalCards(proposal()), parseRecord(record())), { added: [], gone: [], changed: [] });
});

test("align lists new cards, gone cards with or without progress, and changed fingerprints", () => {
  const canvas = proposal({ v1: V1.replace("k seeds", "10 seeds") });
  canvas.nodes = canvas.nodes.filter((n) => n.id !== "C2");
  canvas.nodes.push(card("V3", "## V3 · Verification · cheap\n**Design (argument)**: new"));
  const text = record().replace("## Conjectures", "### V9 · not started\n\n## Conjectures");
  const { added, gone, changed } = alignment(proposalCards(canvas), parseRecord(text));
  assert.deepEqual(added, ["V3"]);
  assert.deepEqual(gone, ["V9 (no progress)", "C2 (not done)"]);
  assert.equal(changed.length, 1);
  assert.match(changed[0], /^V1 \(design sha256:[0-9a-f]{8} in the record, now sha256:[0-9a-f]{8}\)$/);
});

test("align leaves alone a changed card that has no fingerprint yet", () => {
  const canvas = proposal({ c2: C2.replace("widths agree", "widths differ") });
  assert.deepEqual(alignment(proposalCards(canvas), parseRecord(record())).changed, []);
});

test("align prints 'aligned', or the three groups", () => {
  const dir = proposalDir(tempDir(), "tails", { "round-1.canvas": proposal(), "round-1.progress.md": record() });
  assert.equal(runWith(["align", join(dir, "round-1.canvas"), join(dir, "round-1.progress.md")]).stdout, "aligned\n");
  writeFileSync(join(dir, "round-1.canvas"), JSON.stringify(proposal({ v1: V1.replace("T1", "T3") })));
  const { code, stdout } = runWith(["align", join(dir, "round-1.canvas"), join(dir, "round-1.progress.md")]);
  assert.equal(code, 0);
  assert.match(stdout, /^changed: V1 \(design /);
});

// ---------------------------------------------------------------- check

test("check passes a well-formed record", () => {
  assert.deepEqual(checkRecord(parseRecord(record())), []);
});

const problemsOf = (text) => checkRecord(parseRecord(text));

test("check wants the title and the three sections", () => {
  const p = problemsOf(record().replace("# Progress · tails · round 1", "# Notes").replace("## Log", "## Diary"));
  assert.ok(p.some((x) => x.includes("first line")));
  assert.ok(p.some((x) => x.includes('no "## Log" section')));
  assert.ok(p.some((x) => x.includes('unknown section "## Diary"')));
});

test("check rejects an unknown status and a card in the wrong section", () => {
  const p = problemsOf(record().replace("### V2 · dropped", "### V2 · paused").replace("### C2 · not done", "### V7 · not started"));
  assert.ok(p.some((x) => x.includes('V2 has status "paused"')));
  assert.ok(p.some((x) => x.includes('V7 is outside "## Verifications"')));
});

test("check wants **on** for a waiting Verification and a fingerprint once one is in progress", () => {
  const p = problemsOf(record().replace(/\*\*on\*\*:.*\n/, "").replace("### V1 · waiting", "### V1 · in progress").replace(/\*\*design\*\*:.*\n/, ""));
  assert.ok(p.some((x) => x.includes("V1 is in progress but has no **on**")));
  assert.ok(p.some((x) => x.includes("V1 is in progress but has no **design**")));
});

test("check lets a waiting Verification go without a fingerprint", () => {
  assert.deepEqual(problemsOf(record().replace(/\*\*design\*\*:.*\n/, "")), []);
});

test("check wants a file under **Results** for a done Verification", () => {
  const done = record().replace("### V1 · waiting", "### V1 · done");
  assert.ok(problemsOf(done).some((x) => x.includes("V1 is done but has no file under **Results**")));
  assert.deepEqual(problemsOf(done.replace("- (none yet)", "- `analysis/out/v1.csv`")), []);
});

test("check wants the user's words on a dropped Verification", () => {
  const p = problemsOf(record().replace('- dropped — user, 2026-10-20: "Not this round."', "- dropped"));
  assert.ok(p.some((x) => x.includes("V2 is dropped")));
});

test("check wants a result in Conjecture to carry its fingerprint and a refuting condition", () => {
  const text = record().replace("### C1 · held", "### C1 · result in").replace("· refuting condition: not met", "");
  assert.ok(problemsOf(text).some((x) => x.includes('C1 is result in but has no **Result**: line with "refuting condition:"')));
});

test("check wants the user's words on every judged Conjecture", () => {
  const p = problemsOf(record().replace('**User**: 2026-10-30: "Drop the rest."', "**User**: dropped"));
  assert.ok(p.some((x) => x.includes("C2 is not done but has no **User**")));
});

test("check wants a held Conjecture to have its fingerprint and Result", () => {
  const p = problemsOf(record().replace(/\*\*claim \+ criterion\*\*:.*\n/, "").replace(/\*\*Result\*\*:.*\n/, ""));
  assert.ok(p.some((x) => x.includes("C1 is held but has no **claim + criterion**")));
  assert.ok(p.some((x) => x.includes("C1 is held but has no **Result**")));
});

test("check wants every Log line to start with its date", () => {
  const p = problemsOf(record().replace("- 2026-10-30 · round handed over", "- round handed over"));
  assert.ok(p.some((x) => x.includes("Log line does not start")));
});

test("check prints ok, or every problem with a non-zero exit", () => {
  const dir = tempDir();
  writeFileSync(join(dir, "good.md"), record());
  writeFileSync(join(dir, "bad.md"), record().replace("### V2 · dropped", "### V2 · paused").replace("- 2026-10-30 · round handed over", "round handed over"));
  assert.equal(runWith(["check", join(dir, "good.md")]).stdout, `ok ${join(dir, "good.md")}\n`);
  const { code, stderr } = runWith(["check", join(dir, "bad.md")]);
  assert.equal(code, 1);
  assert.equal(stderr.trim().split("\n").length, 2);
});

// ---------------------------------------------------------------- status

test("status reports the highest round by number, and how far it is judged", () => {
  const root = tempDir();
  proposalDir(root, "tails", { "round-2.canvas": proposal(), "round-10.canvas": proposal() });
  proposalDir(root, "mass", { "round-1.canvas": proposal(), "round-1.progress.md": record() });
  proposalDir(root, "drift", { "round-1.canvas": proposal(), "round-1.progress.md": record().replace("### C1 · held", "### C1 · result in") });
  proposalDir(root, "empty", { "notes.md": "" });
  assert.deepEqual(statusLines(join(root, "proposals")), [
    "drift · round 1 · 1 of 2 judged",
    "mass · round 1 · handed over",
    "tails · round 10 · no record",
  ]);
});

test("status on a missing directory is an error", () => {
  assert.equal(runWith(["status", join(tempDir(), "nowhere")]).code, 1);
});

// ---------------------------------------------------------------- usage

test("a wrong invocation exits 2 with the usage", () => {
  assert.equal(runWith([]).code, 2);
  assert.equal(runWith(["frobnicate"]).code, 2);
  assert.equal(runWith(["check"]).code, 2);
  assert.equal(runWith(["--help"]).code, 0);
});
