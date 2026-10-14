# Progress record
`proposals/<name>/round-N.progress.md`, one per round, next to `round-N.canvas`. Markdown, so Obsidian shows it beside the canvas. Field names and status words stay exactly as written below, in English, in the canvas's style (bold field names, parts separated by ` · `): `research-proposal` reads this file as the next round's outcomes, and `scripts/progress.mjs` reads the headings and fields.

The agent writes the whole file; the user may edit it, and the file wins over memory. A user's judgement, `dropped` and every other decision of the user is written only after the user said it, in the user's words.

## Layout

```markdown
# Progress · tail-treatment-compare · round 1

Canvas: `round-1.canvas` · started 2026-10-15 · written by the agent; the user may edit it, the file wins over memory.

## Verifications

### V1 · waiting
**on**: `sims/r1-v1-t1/status.json`, `sims/r1-v1-t2/status.json` (T1 and T2 runs; T3 done)
**design**: sha256:98f5e40e (at in progress, 2026-10-16)
**Decided**
- k = 10 seeds. — user, 2026-10-16
- ✗ PHIDBL shift after REMOVE → keep as a stated limitation. — user, 2026-10-16: "Don't touch escape.F this round, write it down as a limitation." See `notes/phidbl.md`.
- ✗ storage → open
- go — user, 2026-10-16: "Go for V1."
**Results**
- T3: `sims/r1-v1-t3/report.json`, `analysis/out/v1_t3_asym.csv`
**Deviations**
- T3 seeds 7 and 9 crashed; T3 has 8 seeds instead of 10. — user, 2026-10-29: "Go on with 8, no rerun."
- agent: Design silent on how tail stars are selected; chose stars beyond 2 r_J.

### V5 · not started

## Conjectures

### C1 · held
**claim + criterion**: sha256:0f1d2428 (at result in, 2026-10-29)
**Result**: max seed-averaged |ε|√n after 200 Myr = 1.42 at 412 Myr (criterion: a seed-averaged significance above 3 in any snapshot after 200 Myr refutes it) · refuting condition: not met. 8 seeds, see V1 Deviations. `analysis/out/v1_t3_asym.csv`
**User**: 2026-10-30: "C1 holds, 1.4 is well within Kroupa's 1.7."

### C4 · open
**from round 1**: C6 · open · results: (none) · was waiting on: Needs — RTIDE cannot be written in a spec

### C2 · open

## Log

- 2026-10-15 · Record created from the canvas: 5 Verifications not started, 12 Conjectures open.
- 2026-10-16 · V1 spec written with `request-run`; user gave go. · Next: V4 analysis code while V1 runs. · Observed: V2's lever (RTIDE) cannot be written in a spec.
- 2026-10-22 · Helped the user plot the Hyades CMD. · outside round: CMD plot for the group meeting, `figures/hyades_cmd.pdf`.
- 2026-11-20 · round handed over
```

## Verification status
The status sits in the heading: `### V1 · <status>`.

| Status | Means | Also written |
|---|---|---|
| `not started` | nothing done yet | |
| `in progress` | work under way | **on**: one line on how far it is; **design** fingerprint |
| `waiting` | stopped on something | **on**: a pointer to what it waits on: `sims/<task>/status.json`, `V1 (snapshots)`, `Needs — …`, `user — …` |
| `done` | its Grounds exist | **Results**: the files |
| `dropped` | the user chose not to do it this round | the user's reason and words under **Decided**; the canvas card stays |

## Conjecture status

| Status | Means | Also written |
|---|---|---|
| `open` | no Grounds yet | heading only |
| `result in` | the result is with the user, set against its criterion | **claim + criterion** fingerprint; **Result** |
| `held` / `failed` / `not done` | the user's judgement | **User**: the user's words; `held` / `failed` keep the fingerprint and **Result** |

The round is **handed over** when every `### C<n> · ` heading reads `held`, `failed` or `not done`. No need to read the canvas for it.

## Fields
- **on**: a pointer to the source, never a copy of it. Each session reads the source for the current state.
- **Decided**: one line per item of **For the user to decide**, per Needs ✗ and per go: the decision, `user, <date>`, the user's words, and a pointer to the project's `notes/` file where there is one. An item not yet decided reads `→ open`. These fill gaps the Design left open, so they are not Deviations.
- **Results**: paths only.
- **Deviations**: where the work differs from the Design, and who decided it. A gap the Design left on an implementation detail, filled by the agent, reads `agent: Design silent on X; chose Y`. A departure from the Design's text is the user's, with the user's words.
- **Result**: three things: the measured value, the criterion verbatim, and `refuting condition: met` or `not met` as read off the criterion's letter. Only the quantities the criterion names; for an "any" criterion, the extreme value and where it occurs, with the full table in a file. When the criterion cannot be read off as written, `refuting condition: cannot be read` and why. Point to the Deviations and accepted ✗ that bear on the result.
- **User**: `<date>: "<the user's words>"`. Where the result and the criterion seem at odds, say so to the user and add one sentence after the quote; the judgement stays the user's.
- **from round k**: written by `init` for a Conjecture tagged `from round k`: the round-k card with the same Claim and its status there. Add `results: …` and `was waiting on: …` from the round-k record. `→ no match` means no card had the same Claim: ask the user which it was.
- Dependencies between cards are read from the canvas and never written here.
- **Log**: append only, one line per session: `- <date> · <what was done> · Next: … · Observed: … · outside round: …`, the last three where they apply. `Observed:` holds new ideas and Conjectures not tied to any card of this round; `outside round:` holds work the user asked for beyond the round.

## Fingerprints
`sha256:` and the first 8 hex digits of a SHA-256, written when a card is started so a later change to it shows up:

- a Verification's, when it enters `in progress`: of the text after `**Design (argument)**:`;
- a Conjecture's, when it enters `result in`: of the Claim, a newline, and the Rebuttal (criterion).

A field's text runs to the next blank line or the next line starting with `**`, with whitespace collapsed, so re-wrapping a card in Obsidian is no change. Get it from `progress.mjs fingerprint`; never compute it by hand.

## Script
`scripts/progress.mjs` sits next to this file and needs Node 18+. Cards are found by their headings (`## V1 · Verification`, `## C3 · Conjecture`), whatever their canvas ids. `init` is the only command that writes; edit the record directly for everything else.

```bash
node <skill-dir>/scripts/progress.mjs status <proposals dir>
node <skill-dir>/scripts/progress.mjs init <round-N.canvas>
node <skill-dir>/scripts/progress.mjs align <round-N.canvas> <round-N.progress.md>
node <skill-dir>/scripts/progress.mjs fingerprint <round-N.canvas> <V<n>|C<n>>
node <skill-dir>/scripts/progress.mjs check <round-N.progress.md>
```

- `status`: one line per `<name>`: `<name> · round N · <no record | k of M judged | handed over>`, for the highest N.
- `init`: writes the record with every Verification `not started`, every Conjecture `open`, and the first Log line; refuses when the record exists. Prints each carried-over Conjecture it matched or could not match.
- `align`: prints `aligned`, or the cards that are `new` on the canvas, `gone` from it (each marked with its progress), and `changed` since their fingerprint was taken.
- `fingerprint`: prints the fingerprint of one card.
- `check`: the title and the three sections are there, every status word is one of the above, and each status carries the fields the tables require. Prints `ok <path>`, or every problem as `error: <reason>` with a non-zero exit.
