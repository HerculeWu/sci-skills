---
name: calibrate-to-library
description: Read an Argument Library's full texts for how its field writes -- what each section's paragraphs do, in what order and proportion, and the register of its sentences -- as measured testimony and tools that write-paper reuses for every paper in that field.
disable-model-invocation: true
---
# calibrate-to-library
Measure how the papers of an Argument Library are written, so that `write-paper` can write a paper the field reads as its own. A paper drafted from rules and impressions reads as an agent's; one set beside the field's measured forms, and copied from its paragraphs where they fit, does not. This runs once per library, and again when the library grows; every paper in the field reuses what it leaves.

## Language
Terms in bold are defined in the sci-skills glossary, loaded at session start. If it is not in your context, read `${CLAUDE_PLUGIN_ROOT}/GLOSSARY.md` first.

Words this skill uses in its own sense:
- *kind*: what a paragraph does in its paper (opens the stakes, defines a quantity, works through a representative case …). A paper is a sequence of kinds; a section is a stretch of it.
- *group*: papers of the library written alike, such as simulation papers against observation papers. Counts are given per group, because a paper is written like its group.
- *testimony*: what the library shows, as counts and ranges. It says where a text stands against the field; it never says what to write.

## Input
- The Argument Library (`build-argument-library`): its canvas, the papers' full texts as markdown, their Shorts and `meta.json`.
- On a later run: the existing `<library dir>/writing/`, and the papers added since.

## Output
`<library dir>/writing/`, in the shape [outputs.md](outputs.md) fixes, because `write-paper` reads it:
- `README.md`: what was measured, on which papers, the author's decisions, and how to run the tools;
- `section-guide.md`: the kinds, and what each section of each group contains, in what order and proportion;
- `labels/<Key>.json`: every paragraph of every labelled paper, with its kind;
- `library-map.md`: for each kind, the paragraphs of the library that do it;
- `language.json`: the register ranges, per group;
- `tools/`: the scripts that split, label-check and measure, so that `write-paper` measures its drafts the same way.

Missing Shorts are written in `research-proposal`'s format (`${CLAUDE_PLUGIN_ROOT}/skills/research-proposal/short.md`). Every file is in English, whatever language the conversation is in; only the reply is in the user's language.

## What the calibration stands on
- **The library, not a style manual.** Every kind, order, proportion and range comes from these papers. The field already wrote most of the paragraphs a paper needs, so the most useful output is where to find them.
- **Induce, then decide with the author.** The vocabulary of kinds, the groups, the metrics and the tools are yours to propose from what you read, with the reason for each; the author decides before anything large is spent. [examples.md](examples.md) holds one earlier calibration as a worked example, to borrow from where it fits this field and to depart from where it does not.
- **Measure what will be checked.** A form the text is held to without a measurement drifts, version after version; a measured one comes into range once measured. Propose a metric where the reader would notice the difference, and leave out what nobody would.
- **A range binds both ways and decides nothing.** Zero where the field writes a form is as far from the field as a rate above its range. A range tells the writer where to look, never what to write, and a rule read to its extreme does more harm than no rule.
- **A tool is trusted after it is checked.** Every script is checked on a sample read by hand, and the comparison goes to the author.

## Steps
Stop for the author twice: after step 1 and after step 3. Each stop asks everything it needs at once.

### 1. Read and propose
**Goal**: the author has decided the kinds, the groups, the metrics, the papers to label and the cost.

- Report coverage: papers with a full text, with a Short, and those without; a paper without a full text gives its Short and citations, never a paragraph to copy. Missing Shorts are written once the author agrees, one subagent per paper.
- Read the Shorts and several full texts of each likely group, whole, before proposing anything.
- Propose:
  - the groups, with their papers;
  - the vocabulary of kinds per section, each with a one-line definition and an example paragraph (`Key §n ¶m`), marked as borrowed from the example or induced here;
  - the metrics of register, each with what it reveals and why a reader of this field would notice it;
  - how the full texts will be split into paragraphs, and what is skipped (equations, captions, tables, references);
  - which papers get labelled, and the rough cost: one subagent per paper.

### 2. Label and measure
**Goal**: every agreed paper has its labels, the tools measure what was agreed, and both are checked against a hand-read sample.

- Write the splitting tool first, so paragraph numbers are stable: `labels/`, `library-map.md` and `write-paper` all point at paragraphs by number.
- One subagent per paper labels its paragraphs against the agreed vocabulary, from the paper's own text, and names any paragraph no kind fits. A kind that keeps not fitting is a vocabulary fault, raised to the author, not forced.
- Write the measuring tool, and run it on every full text of each group.
- Check each tool on a sample you read yourself: some paragraphs' splits and labels, some sentences' metrics. Fix the tool until the sample agrees, or name where it cannot.

### 3. Write the guide and hand over
**Goal**: the files of [outputs.md](outputs.md) exist, and the author has reviewed the counts and the guide.

- `section-guide.md` states, per group and section, what the library does, as counts: paragraphs, the kinds in their order, their proportions, the lengths, and what is rare or absent. Then the parts in order, each with the kinds it is made of.
- `library-map.md` is generated from the labels.
- Every statement in the guide is a count or a pointer to paragraphs; whatever is your judgement is marked as such.

## Reply
**At the first stop**: coverage; then the proposal of step 1, each item with its reason; the cost.

**At hand-over**:
1. Where `writing/` is, and how to run its tools.
2. Per group: papers, and the headline counts of each section.
3. The ranges, with the metrics whose spread is too wide to say much.
4. The sample checks, side by side, and what the tools cannot see.
5. Kinds that fit badly, and paragraphs left unlabelled.
6. The next step: `write-paper`, which reads `writing/`.
