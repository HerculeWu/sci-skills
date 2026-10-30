---
name: write-paper
description: Write one version of a paper from its Argument DAG and a calibrated Argument Library -- an outline, the text copied and imitated from the field's paragraphs, a calibration and review, and a referee's report -- each step by a fresh agent; or, once the author has declared a text final, check it.
disable-model-invocation: true
---
# write-paper
Write one **version** of a paper: from the paper's Argument DAG (`build-paper-argument`) and the library's calibration (`calibrate-to-library`), fresh agents write an outline, the text, a calibration with a review, and a referee's report. Each version is written afresh from its sources, never patched from the last ([ADR 0001](../../docs/adr/0001-recompile-each-version.md)): a fault found in a version is repaired in the canvas, in the outline, or as a check, and the next version shows whether the repair held.

## Language
Terms in bold are defined in the sci-skills glossary, loaded at session start. If it is not in your context, read `${CLAUDE_PLUGIN_ROOT}/GLOSSARY.md` first.

Words this skill uses in its own sense:
- *version*: `papers/<paper>/vN/`, everything one run writes.
- *outline*: one entry per paragraph, saying what the paragraph does, where, how long and in what posture; the second source of the paper after the canvas.
- *the four sources*: graph, outline, library, reader; [sources.md](sources.md).
- *final*: `papers/<paper>/final/`, the version the author chose and now edits by hand.

## Input
- `papers/<paper>/argument.canvas`, passing `build-paper-argument`'s check.
- `papers/<paper>/paper.md`: the author's decisions ([paper-md.md](paper-md.md)).
- `<library dir>/writing/` from `calibrate-to-library`, and the library's full texts.
- The project's figures, and the notes and proposals the outline may draw context from.

## Output
- `papers/<paper>/vN/`: `outline.md`, `glossary.md`, `OUTLINE-REPORT.md`; `main.tex`, `sections/`, `refs.bib`, the PDF, `REPORT.md`; `sections-precal/`, `CALIBRATION.md`, `REVIEW.md`; `REFEREE.md`.
- A reply, below.

Every file is in English, whatever language the conversation is in; only the reply is in the user's language.

## What a version stands on
- **One rule, four sources.** Every element of the text is authorised by the graph, the outline, the library or the reader, and the graph outranks the outline outranks the reader outranks the library ([sources.md](sources.md)). Writing and review ask the same question of every element: which source authorised it?
- **Isolation makes faults traceable.** Each step is a fresh agent that reads only the inputs its brief lists, so a fault runs back from paragraph to outline entry to card, and is repaired at its owner. You orchestrate: prepare inputs, dispatch, run the checks, report. You write none of the paper.
- **The field has written most paragraphs already.** Copying a library paragraph of the same kind and object, with its facts and person replaced, is the cheapest way into the field's register; imitating one is the next.
- **What is measured holds; what is only written drifts.** `scripts/paper.mjs` checks the outline and the text against the plugin's own formats; the calibration's tools measure the field's language. A fault the review finds twice becomes a project check.
- **The author decides; the agents report.** No step edits a card, and only the outline agent writes the outline. Card faults and outline faults go to the author.

## Steps
`scripts/paper.mjs` (`${CLAUDE_PLUGIN_ROOT}/skills/write-paper/scripts/paper.mjs`) does what must come out the same every version: `lint-outline`, `check`, `cites`. Each brief names the files a step reads; give the subagent the brief, `sources.md`, those paths with `<paper>`, `vN` and the library filled in, and the full paths of the scripts it runs. Ask each for its report as text too, in case it cannot write a file.

### 0. Prepare
**Goal**: every input is in place and the author has decided everything `paper.md` asks, before any agent starts.

- `final/` exists: run the final check (below) instead of a version.
- The canvas passes `build-paper-argument`'s check, and `<library dir>/writing/` exists. When either is missing, name the skill that makes it, and stop.
- `paper.md` lacks an item: ask for every missing item at once. An item left open is a default taken silently, which the author sees only afterwards.
- N is one more than the highest version. Run every project check in `papers/<paper>/checks/` that reads the canvas.

### 1. Outline
**Goal**: `vN/outline.md` passes `lint-outline`, and the author has seen its questions.

Dispatch the outline agent with [outline-brief.md](outline-brief.md). Then give the author the reader-questions in order and the report's open items, and offer the choice: go on, or stop here to edit `vN/outline.md` (the author's edits hold for this version only). Going on needs no answer when the author asked for a whole version.

### 2. Text
**Goal**: `vN/sections/` passes `check`, and the PDF builds.

Dispatch the text agent with [text-brief.md](text-brief.md). Then run `check` and the project checks yourself.

### 3. Calibration and review
**Goal**: the text is aligned with the field and the ledger, `check` still passes, and `REVIEW.md` sets the text against the outline.

Dispatch the calibrator with [calibrator-brief.md](calibrator-brief.md).

### 4. Referee
**Goal**: `REFEREE.md` holds a referee's report on the PDF alone, and each point is classified.

Dispatch the referee with [referee-brief.md](referee-brief.md), giving it the PDF and nothing else. Then classify each point yourself, tracing it from the PDF to its paragraph, its outline entry and its cards:
- (a) the graph is wrong; (b) the text claims more than its card; (c) it needs a new analysis; (d) the referee is wrong.
Recompute every number the referee gives against its source before accepting it: referees miscalculate too. Append the classification to `REFEREE.md`. You change nothing: (a) is the author's to fix in the canvas, (c) a candidate for the next round of `research-proposal`.

### Final check
When `papers/<paper>/final/` exists, the text is the author's. Run `check` and the project checks on it, build it, and run the referee as in step 4. Report; edit nothing.

## Reply
**After the outline**: the reader-questions, one line each, then `context ?` entries and card faults, and the choice.

**After a version**:
1. Where `vN/` and its PDF are; pages, words; copied / imitated / written counts.
2. The referee's points by class, (a) and (c) first.
3. The review by owner: card faults (the author's canvas), outline faults (this version's outline, or a recurring one for the canvas), text faults (for a check, if they recur).
4. Range items left outside, and what the counts decided.
5. Review findings that also appeared in the previous version: propose a project check for each, written into `papers/<paper>/checks/` when the author agrees.
6. The next step: the author fixes the canvas and runs another version, or declares one final by copying it to `final/`.
