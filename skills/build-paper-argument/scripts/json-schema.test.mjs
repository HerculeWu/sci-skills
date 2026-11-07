// Tests for json-schema.mjs: `node --test` from this directory.

import assert from "node:assert/strict";
import { test } from "node:test";
import { validate } from "./json-schema.mjs";

const messages = (schema, value) => validate(schema, value).map((e) => `${e.path.join("/")}: ${e.message}${e.rule ? ` (${e.rule})` : ""}`);

test("types, const, enum, strings and required properties", () => {
  const schema = {
    type: "object",
    required: ["a", "b"],
    additionalProperties: false,
    properties: { a: { type: "integer", const: 1 }, b: { enum: ["x", "y"] }, c: { type: ["string", "null"], minLength: 1, maxLength: 3, pattern: "^[a-z]+$" } },
  };
  assert.deepEqual(messages(schema, { a: 1, b: "x", c: null }), []);
  assert.deepEqual(messages(schema, { a: 2, c: "Abcd", d: 0 }), [": has no b", "a: is 2, not 1", "c: has 4 characters, more than 3", 'c: "Abcd" does not match ^[a-z]+$', "d: is not allowed here"]);
  assert.deepEqual(messages(schema, "s"), [": is string, not object"]);
  assert.deepEqual(messages({ type: "string", maxLength: 2 }, "σσ"), []); // characters, not bytes
});

test("arrays: items, minItems, contains with min and max", () => {
  const xs = { type: "array", minItems: 1, items: { type: "integer" }, contains: { const: 0 }, minContains: 1, maxContains: 1, description: "one zero" };
  const schema = { properties: { xs }, description: "the root's description names no rule" };
  assert.deepEqual(messages(schema, { xs: [0, 1] }), []);
  assert.deepEqual(messages(schema, { xs: [] }), ["xs: is empty (one zero)", "xs: has 0 matching items; exactly 1 must match (one zero)"]);
  assert.deepEqual(messages(schema, { xs: [0, 0, "a"] }), ["xs/2: is string, not integer (one zero)", "xs: has 2 matching items; exactly 1 must match (one zero)"]);
});

test("$ref, allOf and if/then/else, with the rule of the schema that failed", () => {
  const schema = {
    $defs: { n: { type: "string", minLength: 1 } },
    type: "object",
    properties: { kind: { $ref: "#/$defs/n" } },
    allOf: [{ if: { properties: { kind: { const: "end" } } }, then: { required: ["rank"] }, else: { properties: { rank: false } }, description: "rank on ends only" }],
  };
  assert.deepEqual(messages(schema, { kind: "end", rank: 1 }), []);
  assert.deepEqual(messages(schema, { kind: "end" }), [": has no rank (rank on ends only)"]);
  assert.deepEqual(messages(schema, { kind: "x", rank: 1 }), ["rank: is not allowed here (rank on ends only)"]);
  assert.deepEqual(messages(schema, { kind: "" }), ["kind: is empty"]);
});

test("a keyword it does not know, or a remote $ref, is refused", () => {
  assert.throws(() => validate({ uniqueItems: true }, []), /uniqueItems is not supported/);
  assert.throws(() => validate({ $ref: "other.json#/a" }, 1), /only local \$ref/);
});
