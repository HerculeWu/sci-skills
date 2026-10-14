// Tests for library.mjs: `node --test` from this directory.

import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { cardContent, checkCanvas, checkLinkList, components, dependents, InvalidInput, merge, rankPapers, run } from "./library.mjs";

function card(id, x = 0, y = 0, text = `## Claim\n${id}`) {
  return { id, type: "text", x, y, width: 400, height: 300, text };
}

function edge(id, fromNode, toNode, label = "Grounds") {
  return { id, fromNode, fromSide: "top", toNode, toSide: "bottom", label };
}

/** A paper whose Native Argument `n1` feeds its End Argument `e1`. */
function paperCanvas() {
  return {
    nodes: [card("paper", 0, 800, "Title: T"), card("n1", 0, 400), card("e1", 0, 0)],
    edges: [edge("x1", "n1", "e1")],
  };
}

function library(keys, links = [], notes = []) {
  const list = { papers: keys.map((key) => ({ key, canvas: `${key}.canvas` })), links, notes };
  return { list, canvases: new Map(keys.map((key) => [key, paperCanvas()])) };
}

const link = (from, to, label = "Grounds") => {
  const ref = (s) => ({ paper: s.split(":")[0], card: s.split(":")[1] });
  return { from: ref(from), to: ref(to), label };
};

const node = (canvas, id) => canvas.nodes.find((n) => n.id === id);

function runWith(argv) {
  let stdout = "";
  let stderr = "";
  const code = run(argv, { stdout: (s) => (stdout += s), stderr: (s) => (stderr += s) });
  return { code, stdout, stderr };
}

test("checkCanvas accepts a canvas with an identity card and sound edges", () => {
  assert.deepEqual(checkCanvas(paperCanvas()), []);
  assert.deepEqual(checkCanvas({ nodes: [card("paper")] }), []);
});

test("checkCanvas without identity accepts a canvas that is not one paper's", () => {
  assert.deepEqual(checkCanvas({ nodes: [card("a:n1")] }, { identity: false }), []);
  const dangling = checkCanvas({ nodes: [card("a")], edges: [edge("x1", "a", "gone")] }, { identity: false });
  assert.deepEqual(dangling, ['edge "x1": toNode "gone" is not a card']);
});

test("checkCanvas reports every problem", () => {
  assert.match(checkCanvas({}).join(), /no `nodes` array/);
  assert.match(checkCanvas({ nodes: [card("a")] }).join(), /no identity card/);
  assert.match(checkCanvas({ nodes: [card("paper"), card("paper")] }).join(), /duplicate node id "paper"/);
  assert.match(checkCanvas({ nodes: [{ ...card("paper"), x: "0" }] }).join(), /no numeric x/);
  const dangling = checkCanvas({ nodes: [card("paper")], edges: [edge("x1", "paper", "gone")] });
  assert.match(dangling.join(), /edge "x1": toNode "gone" is not a card/);
  const several = checkCanvas({ nodes: [card("a"), card("a")], edges: [edge("x1", "a", "gone")] });
  assert.equal(several.length, 3);
});

test("checkLinkList accepts a sound list and reports structural problems", () => {
  assert.deepEqual(checkLinkList(library(["a", "b"], [link("a:e1", "b:n1")]).list), []);
  assert.match(checkLinkList({ papers: [] }).join(), /empty/);
  assert.match(checkLinkList({ papers: [{ key: "a:b", canvas: "x" }] }).join(), /"key" must match/);
  assert.match(checkLinkList(library(["a", "a"]).list).join(), /duplicate key "a"/);
  assert.match(checkLinkList({ papers: [{ key: "a" }] }).join(), /no "canvas" path/);
  assert.match(checkLinkList(library(["a", "b"], [link("a:e1", "c:n1")]).list).join(), /unknown paper "c"/);
  assert.match(checkLinkList(library(["a", "b"], [link("a:n1", "a:e1")]).list).join(), /a link joins two papers/);
  assert.match(checkLinkList(library(["a", "b"], [link("a:e1", "b:n1", "Supports")]).list).join(), /"label" must be one of/);
  assert.match(checkLinkList(library(["a"], [], [{ paper: "a", card: "n1", note: " " }]).list).join(), /empty "note"/);
});

test("components finds cycles and leaves a chain apart", () => {
  const chain = components(["a", "b", "c"], [["a", "b"], ["b", "c"]]);
  assert.deepEqual(chain, [["c"], ["b"], ["a"]]);
  const loop = components(["a", "b", "c"], [["a", "b"], ["b", "a"], ["b", "c"]]);
  assert.deepEqual(loop.map((c) => c.sort()), [["c"], ["a", "b"]]);
});

test("rankPapers puts a paper above everything it cites", () => {
  const rank = rankPapers(["a", "b", "c", "d"], [["a", "b"], ["b", "c"], ["a", "c"]]);
  assert.deepEqual([...rank], [["a", 0], ["b", 1], ["c", 2], ["d", 0]]);
});

test("rankPapers gives papers that cite each other one row", () => {
  const rank = rankPapers(["a", "b", "c"], [["a", "b"], ["b", "a"], ["b", "c"]]);
  assert.equal(rank.get("a"), rank.get("b"));
  assert.equal(rank.get("c"), rank.get("a") + 1);
});

test("merge prefixes ids and keeps each paper's edges inside it", () => {
  const { list, canvases } = library(["a", "b"]);
  const { canvas } = merge(list, canvases);
  assert.deepEqual(
    canvas.nodes.map((n) => n.id),
    ["@group-a", "@group-b", "a:paper", "a:n1", "a:e1", "b:paper", "b:n1", "b:e1"],
  );
  assert.deepEqual(
    canvas.edges.map((e) => [e.id, e.fromNode, e.toNode]),
    [["a:x1", "a:n1", "a:e1"], ["b:x1", "b:n1", "b:e1"]],
  );
  assert.equal(new Set(canvas.nodes.map((n) => n.id)).size, canvas.nodes.length);
});

test("merge leaves its inputs untouched", () => {
  const { list, canvases } = library(["a", "b"], [link("a:e1", "b:n1")], [{ paper: "b", card: "n1", note: "x" }]);
  const before = JSON.stringify([list, [...canvases]]);
  merge(list, canvases);
  assert.equal(JSON.stringify([list, [...canvases]]), before);
});

test("merge encloses each paper's cards in its own group, with the layout inside preserved", () => {
  const { list, canvases } = library(["a", "b"]);
  list.papers[0].label = "Paper A (2020)";
  const { canvas } = merge(list, canvases);
  const groups = canvas.nodes.filter((n) => n.type === "group");
  assert.deepEqual(groups.map((g) => g.label), ["Paper A (2020)", "b"]);
  for (const group of groups) {
    const key = group.id.slice("@group-".length);
    const mine = canvas.nodes.filter((n) => n.id.startsWith(`${key}:`));
    assert.equal(mine.length, 3);
    for (const n of mine) {
      assert.ok(n.x > group.x && n.x + n.width < group.x + group.width, `${n.id} is inside horizontally`);
      assert.ok(n.y > group.y && n.y + n.height < group.y + group.height, `${n.id} is inside vertically`);
    }
    assert.equal(node(canvas, `${key}:n1`).y - node(canvas, `${key}:e1`).y, 400);
  }
  const [a, b] = groups;
  assert.ok(a.x + a.width < b.x || b.x + b.width < a.x, "groups do not overlap");
});

test("merge puts the citing paper above the cited one", () => {
  const { list, canvases } = library(["citing", "cited"], [link("cited:e1", "citing:n1")]);
  const { canvas } = merge(list, canvases);
  const citing = node(canvas, "@group-citing");
  const cited = node(canvas, "@group-cited");
  assert.ok(citing.y + citing.height < cited.y);
});

test("merge orders papers in one row by year", () => {
  const { list, canvases } = library(["a", "b", "c"]);
  list.papers[0].year = 2024;
  list.papers[1].year = 2019;
  const { canvas } = merge(list, canvases);
  const x = (key) => node(canvas, `@group-${key}`).x;
  assert.ok(x("b") < x("a") && x("a") < x("c"), "2019, 2024, then the paper with no year");
});

test("merge draws a link as a coloured, labelled edge between the prefixed cards", () => {
  const { list, canvases } = library(["a", "b"], [link("a:e1", "b:n1", "Rebuttal")]);
  const { canvas, cycles } = merge(list, canvases);
  const drawn = canvas.edges.at(-1);
  assert.deepEqual(
    { ...drawn, color: undefined },
    { id: "@link-0", fromNode: "a:e1", fromSide: "top", toNode: "b:n1", toSide: "bottom", color: undefined, label: "Rebuttal" },
  );
  assert.ok(drawn.color, "a cross-paper edge is coloured");
  assert.ok(canvas.edges.slice(0, -1).every((e) => e.color === undefined));
  assert.deepEqual(cycles, []);
});

test("merge appends Audit Notes to the library copy of a card", () => {
  const notes = [
    { paper: "b", card: "n1", note: "first" },
    { paper: "b", card: "n1", note: "second" },
  ];
  const { list, canvases } = library(["a", "b"], [], notes);
  const { canvas } = merge(list, canvases);
  const noted = node(canvas, "b:n1");
  assert.equal(noted.text, "## Claim\nn1\n\n## Audit Note\nfirst\n\n## Audit Note\nsecond");
  assert.ok(noted.color);
  assert.equal(node(canvas, "a:n1").color, undefined);
});

test("merge marks a cycle that a link closes", () => {
  const { list, canvases } = library(["a", "b"], [link("a:e1", "b:n1"), link("b:e1", "a:n1")]);
  const { canvas, cycles } = merge(list, canvases);
  assert.deepEqual(cycles, [["a:e1", "a:n1", "b:e1", "b:n1"]]);
  assert.match(node(canvas, "a:n1").text, /## Audit Note\nCircular dependency across papers, through: a:e1, a:n1, b:e1, b:n1\./);
  assert.doesNotMatch(node(canvas, "a:paper").text, /Audit Note/);
});

test("merge leaves a cycle inside one paper to read-a-paper", () => {
  const { list, canvases } = library(["a", "b"], [link("a:e1", "b:n1")]);
  canvases.get("a").edges.push(edge("x2", "e1", "n1"));
  const { canvas, cycles } = merge(list, canvases);
  assert.deepEqual(cycles, []);
  assert.doesNotMatch(node(canvas, "a:n1").text, /Audit Note/);
});

test("merge rejects links and notes that name a missing card", () => {
  const { list, canvases } = library(["a", "b"], [link("a:gone", "b:n1")], [{ paper: "a", card: "lost", note: "x" }]);
  assert.throws(
    () => merge(list, canvases),
    (e) => e instanceof InvalidInput && e.problems.length === 2 && /no card "gone" in "a"/.test(e.message) && /no card "lost" in "a"/.test(e.message),
  );
});

test("merge rejects a note on a card that holds no text", () => {
  const { list, canvases } = library(["a"], [], [{ paper: "a", card: "fig", note: "x" }]);
  canvases.get("a").nodes.push({ id: "fig", type: "file", file: "fig.png", x: 500, y: 0, width: 400, height: 300 });
  assert.throws(() => merge(list, canvases), /"a:fig" is not a text card/);
});

test("run merge reads canvases next to the link list and writes the library canvas", () => {
  const dir = mkdtempSync(join(tmpdir(), "library-test-"));
  const { list } = library(["a", "b"], [link("a:e1", "b:n1")]);
  for (const key of ["a", "b"]) writeFileSync(join(dir, `${key}.canvas`), JSON.stringify(paperCanvas()));
  writeFileSync(join(dir, "links.json"), JSON.stringify(list));
  const out = join(dir, "library.canvas");
  writeFileSync(out, "stale");

  const result = runWith(["merge", join(dir, "links.json"), out]);
  assert.deepEqual([result.code, result.stderr], [0, ""]);
  assert.equal(result.stdout, `wrote ${out}: 2 papers, 6 cards, 1 cross-paper links\n`);
  const written = JSON.parse(readFileSync(out, "utf-8"));
  assert.equal(written.nodes.length, 8);
  assert.deepEqual(checkCanvas({ ...written, nodes: [...written.nodes, card("paper")] }), [], "every edge has both ends");
});

test("run merge reports every invalid input and writes nothing", () => {
  const dir = mkdtempSync(join(tmpdir(), "library-test-"));
  const { list } = library(["a", "b", "c"]);
  writeFileSync(join(dir, "a.canvas"), JSON.stringify(paperCanvas()));
  writeFileSync(join(dir, "b.canvas"), "{ not json");
  writeFileSync(join(dir, "links.json"), JSON.stringify(list));
  const out = join(dir, "library.canvas");

  const result = runWith(["merge", join(dir, "links.json"), out]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /b\.canvas: not valid JSON/);
  assert.match(result.stderr, /c\.canvas: cannot read \(ENOENT\)/);
  assert.equal(existsSync(out), false);
});

test("run check passes sound canvases and names the broken ones", () => {
  const dir = mkdtempSync(join(tmpdir(), "library-test-"));
  const good = join(dir, "good.canvas");
  const bad = join(dir, "bad.canvas");
  writeFileSync(good, JSON.stringify(paperCanvas()));
  writeFileSync(bad, JSON.stringify({ nodes: [card("n1")] }));

  assert.deepEqual(runWith(["check", good]), { code: 0, stdout: `ok ${good}\n`, stderr: "" });
  const result = runWith(["check", good, bad]);
  assert.equal(result.code, 1);
  assert.equal(result.stdout, `ok ${good}\n`);
  assert.equal(result.stderr, `error: ${bad}: no identity card (a card with id "paper")\n`);
});

/** A library canvas of papers a and b, where b's `n1` cites a's End Argument. */
function libraryCanvas() {
  const { list, canvases } = library(["a", "b"], [link("a:e1", "b:n1", "Backing")]);
  return merge(list, canvases).canvas;
}

test("dependents follows edges across papers, nearest first", () => {
  assert.deepEqual(dependents(libraryCanvas(), "a:n1"), [
    { id: "a:e1", depth: 1, label: "Grounds", via: "a:n1" },
    { id: "b:n1", depth: 2, label: "Backing", via: "a:e1" },
    { id: "b:e1", depth: 3, label: "Grounds", via: "b:n1" },
  ]);
  assert.deepEqual(dependents(libraryCanvas(), "b:e1"), []);
});

test("dependents lists a card reached twice once, at its smallest depth", () => {
  const canvas = { nodes: ["r", "m", "t"].map((id) => card(id)), edges: [edge("1", "r", "m"), edge("2", "m", "t"), edge("3", "r", "t", "Warrant")] };
  assert.deepEqual(dependents(canvas, "r"), [
    { id: "m", depth: 1, label: "Grounds", via: "r" },
    { id: "t", depth: 1, label: "Warrant", via: "r" },
  ]);
  canvas.edges.push(edge("4", "t", "r"));
  assert.equal(dependents(canvas, "r").length, 2, "a cycle ends the walk");
});

test("cardContent names what a non-text card shows", () => {
  assert.equal(cardContent(card("n1")), "## Claim\nn1");
  assert.equal(cardContent({ id: "f", type: "file", file: "fig.png" }), "(file card: fig.png)");
  assert.equal(cardContent({ id: "g", type: "group", label: "A" }), "(group card: A)");
});

function writeLibrary() {
  const path = join(mkdtempSync(join(tmpdir(), "library-test-")), "library.canvas");
  writeFileSync(path, JSON.stringify(libraryCanvas()));
  return path;
}

test("run card prints one card of the library", () => {
  const path = writeLibrary();
  assert.deepEqual(runWith(["card", path, "b:n1"]), { code: 0, stdout: "## Claim\nn1\n", stderr: "" });
  const missing = runWith(["card", path, "b:gone"]);
  assert.equal(missing.code, 1);
  assert.equal(missing.stderr, `error: ${path}: no card "b:gone"\n`);
});

test("run uses lists every dependent card, and says when there is none", () => {
  const path = writeLibrary();
  assert.deepEqual(runWith(["uses", path, "a:e1"]), {
    code: 0,
    stdout: "1 b:n1 (Backing of a:e1)\n2 b:e1 (Grounds of b:n1)\n",
    stderr: "",
  });
  assert.equal(runWith(["uses", path, "b:e1"]).stdout, "no card uses b:e1\n");
  assert.equal(runWith(["uses", path, "b:gone"]).code, 1);
});

test("run card reports a library that cannot be read", () => {
  const dir = mkdtempSync(join(tmpdir(), "library-test-"));
  const broken = join(dir, "broken.canvas");
  writeFileSync(broken, JSON.stringify({ nodes: [card("a:n1")], edges: [edge("x", "a:n1", "a:gone")] }));
  const result = runWith(["card", broken, "a:n1"]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /toNode "a:gone" is not a card/);
  assert.match(runWith(["uses", join(dir, "none.canvas"), "a:n1"]).stderr, /cannot read \(ENOENT\)/);
});

test("run rejects wrong invocations with the usage", () => {
  for (const argv of [[], ["explore"], ["check"], ["merge", "only-one"], ["card", "lib.canvas"], ["uses", "lib.canvas", "a:n1", "b:n1"]]) {
    assert.equal(runWith(argv).code, 2, JSON.stringify(argv));
  }
  assert.match(runWith(["merge", "only-one"]).stderr, /usage:/);
  assert.equal(runWith(["--help"]).code, 0);
});
