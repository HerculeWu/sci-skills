#!/usr/bin/env node
/**
 * The mechanical check of the research-proposal skill. Zero dependencies
 * beyond build-argument-library's library.mjs.
 *
 *   node proposal.mjs check <round-N.canvas> <library.canvas>
 *
 * Confirms that a proposal canvas opens in Obsidian, that every library card it
 * names exists, and that the markers canvas-output.md fixes are in place: edge
 * labels, and a shallow Conjecture on every costly Verification. Whether the
 * proposal is worth doing is the user's judgement; nothing here weighs it.
 */

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { checkCanvas, InvalidInput, LABELS, loadLibrary, readJson, UsageError } from "../../build-argument-library/scripts/library.mjs";

// Obsidian canvas colour preset 2 (orange) marks a costly Verification
const COSTLY_COLOR = "2";
const RESULT_LABEL = new RegExp(`^(holds|fails) → (${LABELS.join("|")})$`);
// a library card named on a card: `<paper key>:<card id>`, keys as library.mjs allows them
const CARD_REF = /`([A-Za-z0-9._-]+):([^`\s]+)`/g;
const SHALLOW = "shallow";
const EXCEPTION = "⚠";
const HOLDS = "If it holds";
const FAILS = "If it fails";

export const USAGE = `usage:
  proposal.mjs check <round-N.canvas> <library.canvas>  check a proposal canvas against its Argument Library

errors go to stderr with a non-zero exit, all of them at once.`;

const q = (v) => JSON.stringify(v);

/** The `<paper>:<card>` references in a card's text; a URL's `scheme://` is not one. */
export function cardRefs(text) {
  return [...(text ?? "").matchAll(CARD_REF)].filter((m) => !m[2].startsWith("//")).map((m) => ({ paper: m[1], id: `${m[1]}:${m[2]}` }));
}

/** The tags of a card: the `·`-separated parts of its heading after the first. */
export function tags(card) {
  const heading = (card.text ?? "").split("\n").find((line) => line.trim() !== "") ?? "";
  return heading.replace(/^#+\s*/, "").split("·").slice(1).map((t) => t.trim());
}

const twoSided = (card) => (card.text ?? "").includes(HOLDS) && (card.text ?? "").includes(FAILS);

/** Problems of a proposal canvas checked against the library canvas; empty when it passes. */
export function checkProposal(proposal, library) {
  const problems = checkCanvas(proposal, { identity: false });
  if (problems.length > 0) return problems;

  const libraryIds = new Set(library.nodes.map((n) => n.id));
  const papers = new Set(library.nodes.filter((n) => n.id.includes(":")).map((n) => n.id.split(":")[0]));
  for (const card of proposal.nodes) {
    for (const ref of cardRefs(card.text)) {
      if (libraryIds.has(ref.id)) continue;
      if (!papers.has(ref.paper)) problems.push(`card ${q(card.id)}: names ${q(ref.id)}, but no paper ${q(ref.paper)} is in the library`);
      else problems.push(`card ${q(card.id)}: names ${q(ref.id)}, which is not a card of the library`);
    }
  }

  const edges = proposal.edges ?? [];
  for (const [i, edge] of edges.entries()) {
    if (LABELS.includes(edge.label) || RESULT_LABEL.test(edge.label ?? "")) continue;
    problems.push(`edge ${q(edge.id ?? i)}: label ${q(edge.label ?? "")} is none of ${LABELS.join(", ")}, holds → <label>, fails → <label>`);
  }

  const byId = new Map(proposal.nodes.map((n) => [n.id, n]));
  for (const verification of proposal.nodes.filter((n) => n.color === COSTLY_COLOR)) {
    const conjectures = edges.filter((e) => e.fromNode === verification.id && e.label === "Grounds").map((e) => byId.get(e.toNode));
    const shallow = conjectures.some((c) => tags(c).includes(SHALLOW) && twoSided(c));
    const excepted = conjectures.some((c) => tags(c).some((t) => t.startsWith(EXCEPTION)));
    if (shallow || excepted) continue;
    problems.push(
      `costly Verification ${q(verification.id)}: grounds no Conjecture tagged ${SHALLOW} with both "${HOLDS}" and "${FAILS}", and none tagged ${EXCEPTION}`,
    );
  }
  return problems;
}

function runCheck(args, out) {
  if (args.length !== 2) throw new UsageError("check takes a proposal canvas and a library canvas");
  const [proposalPath, libraryPath] = args;
  const problems = [];
  let proposal;
  let library;
  try {
    proposal = readJson(proposalPath);
  } catch (e) {
    if (!(e instanceof InvalidInput)) throw e;
    problems.push(...e.problems);
  }
  try {
    library = loadLibrary(libraryPath);
  } catch (e) {
    if (!(e instanceof InvalidInput)) throw e;
    problems.push(...e.problems);
  }
  if (problems.length > 0) throw new InvalidInput(problems);
  const found = checkProposal(proposal, library);
  if (found.length > 0) throw new InvalidInput(found.map((p) => `${proposalPath}: ${p}`));
  out(`ok ${proposalPath}\n`);
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
