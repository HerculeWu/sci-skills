/**
 * A JSON Schema (draft 2020-12) validator for the keywords argument.schema.json
 * uses, and no others: the plugin's scripts have no dependencies. A schema
 * that uses a keyword this file does not know is refused, so a new keyword in
 * the schema fails loudly instead of being skipped.
 *
 * validate(schema, value) → [{ path: ["arguments", 3, "id"], message }]
 */

const ANNOTATIONS = new Set(["$schema", "$id", "$comment", "title", "description", "$defs"]);
const KNOWN = new Set([
  ...ANNOTATIONS,
  "type", "const", "enum", "pattern", "minLength", "maxLength",
  "properties", "required", "additionalProperties",
  "items", "minItems", "contains", "minContains", "maxContains",
  "allOf", "if", "then", "else", "$ref",
]);

const typeOf = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : Number.isInteger(v) ? "integer" : typeof v);
const isType = (v, t) => t === typeOf(v) || (t === "number" && typeof v === "number");
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const show = (v) => {
  const s = JSON.stringify(v);
  return s.length > 60 ? `${s.slice(0, 57)}...` : s;
};

function resolveRef(root, ref) {
  if (!ref.startsWith("#/")) throw new Error(`schema: only local $ref is supported, not ${ref}`);
  let at = root;
  for (const key of ref.slice(2).split("/")) {
    at = at?.[key.replace(/~1/g, "/").replace(/~0/g, "~")];
    if (at === undefined) throw new Error(`schema: $ref ${ref} names nothing`);
  }
  return at;
}

/** Every problem of `value` against `schema`, each with the path to the value it concerns. */
export function validate(schema, value) {
  const errors = [];
  check(schema, schema, value, [], errors);
  return errors;
}

/** Whether `value` matches, without collecting why not. */
const matches = (root, schema, value) => {
  const errors = [];
  check(root, schema, value, [], errors);
  return errors.length === 0;
};

function check(root, schema, value, path, errors) {
  if (schema === true) return;
  if (schema === false) {
    errors.push({ path, message: "is not allowed here" });
    return;
  }
  for (const key of Object.keys(schema)) if (!KNOWN.has(key)) throw new Error(`schema: keyword ${key} is not supported by json-schema.mjs`);
  const before = errors.length;
  const fail = (message, at = path) => errors.push({ path: at, message });

  if ("$ref" in schema) check(root, resolveRef(root, schema.$ref), value, path, errors);
  if ("type" in schema) {
    const types = [].concat(schema.type);
    if (!types.some((t) => isType(value, t))) {
      fail(`is ${typeOf(value)}, not ${types.join(" or ")}`);
      return; // the other keywords would only repeat the wrong type
    }
  }
  if ("const" in schema && !equal(value, schema.const)) fail(`is ${show(value)}, not ${show(schema.const)}`);
  if ("enum" in schema && !schema.enum.some((e) => equal(value, e))) fail(`is ${show(value)}, none of ${schema.enum.map(show).join(", ")}`);

  if (typeof value === "string") {
    const length = [...value].length;
    if ("minLength" in schema && length < schema.minLength) fail(schema.minLength === 1 ? "is empty" : `has ${length} characters, fewer than ${schema.minLength}`);
    if ("maxLength" in schema && length > schema.maxLength) fail(`has ${length} characters, more than ${schema.maxLength}`);
    if ("pattern" in schema && !new RegExp(schema.pattern, "u").test(value)) fail(`${show(value)} does not match ${schema.pattern}`);
  }

  if (typeOf(value) === "object") {
    for (const key of schema.required ?? []) if (!(key in value)) fail(`has no ${key}`);
    const props = schema.properties ?? {};
    for (const [key, v] of Object.entries(value)) {
      if (key in props) check(root, props[key], v, [...path, key], errors);
      else if ("additionalProperties" in schema) check(root, schema.additionalProperties, v, [...path, key], errors);
    }
  }

  if (Array.isArray(value)) {
    if ("minItems" in schema && value.length < schema.minItems) fail(value.length === 0 ? "is empty" : `has ${value.length} items, fewer than ${schema.minItems}`);
    if ("items" in schema) value.forEach((v, i) => check(root, schema.items, v, [...path, i], errors));
    if ("contains" in schema) {
      const n = value.filter((v) => matches(root, schema.contains, v)).length;
      const min = schema.minContains ?? 1;
      const max = schema.maxContains ?? Infinity;
      if (n < min || n > max) fail(`has ${n} matching items; ${min === max ? `exactly ${min}` : `${min} to ${max}`} must match`);
    }
  }

  for (const sub of schema.allOf ?? []) check(root, sub, value, path, errors);
  if ("if" in schema) {
    const branch = matches(root, schema.if, value) ? schema.then : schema.else;
    if (branch !== undefined) check(root, branch, value, path, errors);
  }

  // a schema that says what it is for names that rule in each of its errors
  if (schema.description && schema !== root) for (const e of errors.slice(before)) if (!e.rule) e.rule = schema.description;
}
