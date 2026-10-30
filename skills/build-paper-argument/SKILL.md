---
name: build-paper-argument
description: Build a paper's own Argument DAG from the judged rounds of one or more proposals, as an Obsidian canvas the author reviews before any text is written; run again to bring in rounds judged since.
disable-model-invocation: true
---
# build-paper-argument
Turn the judgements recorded by `implement-proposal` into the Argument DAG of the paper that will report them: what the paper claims, on which judgements each Claim rests, and what it delivers to whom. The canvas is the one source of what is true for `write-paper`, so every error left in it reaches the text unseen. The author owns it; this skill drafts it and, on later runs, brings in what new rounds established.

## Language
Terms in bold are defined in the sci-skills glossary, loaded at session start. If it is not in your context, read `${CLAUDE_PLUGIN_ROOT}/GLOSSARY.md` first.

Words this skill uses in its own sense:
- *judgement*: a Conjecture the user judged held or failed in a handed-over round, named `<name>/round-<k>:C<n>`.
- *reading*: a measurement made in a round without a criterion fixed in advance: a not-done Conjecture's result, or a quantity asked for as context.
- *reader*: the community that reads the paper for one End.

## Input
- `<paper>`: a short name for the paper. Ask for it on the first run.
- The proposals the paper reports: `proposals/<name>/` with their canvases and progress records. The user names them; by default, every `<name>` with a handed-over round.
- The Argument Library (`build-argument-library`), its Shorts and its papers' `meta.json`.
- The files the progress records point at: results, figures, notes.
- On a later run: the existing `papers/<paper>/argument.canvas`.

## Output
- `papers/<paper>/argument.canvas`. Format: [canvas-output.md](canvas-output.md).
- A reply, below.

The canvas is written in English, whatever language the conversation is in: `write-paper` and its subagents read it. Only the reply is in the user's language.

## What the canvas stands on
- **Only judgements make Claims.** A held judgement grounds a Claim; a failed one limits or objects to a Claim, or stays out. Building a Claim on the opposite of a failed one is the author's call, never the agent's. The user judged each against a criterion fixed in advance, and a Claim stronger than its judgements is the error no reader can catch.
- **Every number traces to a file.** Each number on a card names the judgement, file or library card it comes from. Later checks compare the text with the canvas; only this trace makes the canvas worth comparing with.
- **The library is the field's shape.** Natives come from the library; the canvas's depth and width are set beside the library's (`shape`), as testimony of how papers in this field are built.
- **The author decides what the paper is for.** Which End is the main one, the sentence each End leaves with the reader, and who that reader is: without these the paper cannot say what its main result is, and only the author can say them.
- **The author's edits stand.** On a later run, only cards touched by new judgements change; the author removes cards.

## Steps
Stop for the author twice: after step 1 and after step 3. Each stop asks everything it needs at once.

`scripts/paper-argument.mjs` (see [canvas-output.md](canvas-output.md)) does what must come out the same every time: listing the judgements, measuring the library's shape, checking the canvas.

### 1. Gather and propose the Ends
**Goal**: the author has decided the Ends: which there are, their Rank, their Sentence and their reader.

- `judgements` lists every held and failed Conjecture with its Claim and Result. Read each Result's files where the Result line leaves the number or its scope unclear. List the readings from the progress records and the files they point at.
- Group the judgements by what they establish together, and propose the Ends: for each, the Claim it would deliver, the judgements under it, a proposed Rank and Sentence, and its reader. Ask whether a reader is left without an End, and whether an End has no reader.
- Name every failed judgement that fits under no Claim, so the author sees what stays out.
- On a later run, `judgements --canvas` marks the `new` ones. Propose where each enters the existing canvas, or the new End it makes.

### 2. Build the chains
**Goal**: every End stands on a chain of cards from Natives through Methods and Results, and every judgement has its place or is named as left out.

- Work from each End down. A card exists because a card above uses it; a card that only restates others, or is used only as a caveat, is folded into the card it serves.
- Natives come from the library cards that the rounds' canvases cite and that the chains need; read them with `library.mjs card` (`${CLAUDE_PLUGIN_ROOT}/skills/build-argument-library/scripts/library.mjs`). The gap (`i-`) is what the rounds' goal cards said the library lacks.
- One Method card carries the setup and the yardstick most Results use; a Result names it as its Warrant.
- A Claim says what was measured, against what, how large, and under which conditions; its limits go in the Qualifier, never into a weakened Claim.
- A derived number gets its file before it gets its card.
- Set the canvas's shape beside the library's with `shape`. A row much wider or a chain much shallower than the library's papers is worth a second look.

### 3. Check and hand over
**Goal**: `check` passes, and the author has the canvas with every fault and open item in view.

- Run `check` until it passes. Each `fault:` line is fixed when the card is wrong, or shown to the author when the card is right as written.
- The canvas then goes to the author to review before `write-paper` runs. An error in the argument is found here or by `write-paper`'s referee, and the author fixes it in the canvas.

## Reply
A guide to the canvas; the cards speak for themselves.

**At the first stop**: the proposed Ends, one block each (Claim, judgements, Rank, Sentence, reader), then the failed judgements that fit nowhere and the readings found, then the questions.

**At hand-over**:
1. Where the canvas is.
2. Each End with its Rank and Sentence, and the main chain under it.
3. The shape beside the library's median.
4. The `fault:` lines left, with why each card stands.
5. Judgements left out, and readings entered as Not a Conjecture.
6. Numbers the cards need that no file holds yet: the files to write, or the analyses to ask for.
7. The next step: the author reviews the canvas; then `write-paper` on `papers/<paper>/`.
