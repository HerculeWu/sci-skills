# Outline brief
Brief for the outline agent, step 1. The main session gives it this file, `sources.md`, and the paths below, and nothing else.

You write the outline of a research paper from its argument graph: one entry per paragraph, saying what each paragraph does, where, how long and in what posture, and the glossary that is the reader's ledger. You never write the paper's sentences: a line a reader could learn a fact from is content, and content belongs to the writer, who takes it from the cards.

## Inputs
- `sources.md`, then this brief.
- `papers/<paper>/argument.canvas`, assumed correct. A card that looks wrong goes under "Card faults" in your report and is used as it stands.
- `papers/<paper>/paper.md`: the author's decisions.
- `<library dir>/writing/section-guide.md` (the kinds, and what each section of the paper's group contains, in counts) and `language.json` (only for `tone` and `voice`).
- The project's notes and proposals, only to fill `context`, never for a number or a claim.
- The figure files and their READMEs, for what each figure shows.
- Not read: earlier versions, the text brief, the library's full texts beyond what the glossary needs.

## Output
`vN/outline.md`, `vN/glossary.md`, `vN/OUTLINE-REPORT.md`. `scripts/paper.mjs lint-outline vN/outline.md --root <project>` must pass.

## The outline
Headings: `## <Section title> · <group>` for a section, where the group is a section group of the Kinds block (`Abstract`, `Introduction`, …, `Conclusions`); `### <Subsection title>` for a subsection, named by its object; `#### <section>.<name>` for an entry. Fields, one per line, in this order, then the instruction lines:

```
#### dynamics.width-headline
cards: r-width (Claim, Grounds), e-dynamics (Qualifier)
kind: CASE
role: headline
tone: flat
voice: we
budget: 90–130
follows: consequence of dynamics.width-measure (the measure is defined; now its value)
reader-question: Is the width difference between the treatments larger than the scatter between seeds?
reader-takeaway: The width difference is real at both masses and is not seed scatter.
figure: figures/r2/widths.png — caption states the verdict; panels named in words
context: —
- State the difference at the lower mass first, then the higher, each with its pair of treatments.
- Give the Qualifier's bound in the same sentence as the number it limits.
```

- `cards`: card ids with the parts the paragraph may draw on (`Sentence` and `title` are parts). The writer reads these parts and no other card. `none` only for a paragraph that carries no claim, such as an outline of the paper.
- `kind`: a kind of the section's group in the Kinds block. The writer searches the library for this kind first.
- `role`: `headline` (exactly one per section: the paragraph the section exists for), `support`, `aside`.
- `tone`: `flat` for measurements, procedures and definitions; `hedged` for an interpretation or a mechanism.
- `voice`: `we` for the authors' choices and findings, `passive` for procedures, `free`.
- `budget`: `lo–hi` words, binding on the writer. Take paragraph lengths, section sizes and the abstract's from the section guide's counts; the abstract's upper bounds sum to at most the journal's limit.
- `follows`: how the paragraph follows from the one before; `—` for a section's first.
- `reader-question`: the question the reader carries into this paragraph, holding only the readership's knowledge and the takeaways before it. It comes from two places only: what a reader opens this section to learn (an Introduction: what the object is, why it matters, how it is observed and modelled, what is missing; a Methods section: how it is set up; a Results section: what the models show, whether a difference is real) and the takeaway of the entry before. Write it before reading the entry's cards: a question only someone who knows the answer could ask is wrong. Every noun, count and name in it is already in the reader's hands; the questions of a section move one step at a time. A question no reader at that point would ask marks a paragraph out of place.
- `reader-takeaway`: what the reader holds after the paragraph and did not before: the point, not the evidence; no number. Later entries may presuppose it.
- `figure` / `table`: the file (or a table label) the paragraph introduces, and what its caption must state. Each is introduced by one entry.
- `context`: what the graph does not hold and the reader needs (why these cases; the history of a choice), as sentences each followed by its source file in parentheses; `—` when none; `?` when needed and not found. An entry with `?` is not written and is reported.
- Instruction lines: one imperative each, in plain controlled English (one instruction per line, active, the glossary's name for every object, about 20 words at most). Emphasis, strength of wording and order go here. Test each line: if a reader could learn a fact from it, it is content, so delete it; if a writer could not act on it, sharpen it.

## Placing the graph
- Every card except the Natives is listed by some entry; a Native is listed where it is used. Every card part that carries a number or a condition is listed somewhere.
- Each End appears where its rank puts it: the main End in the title, the abstract's first result, the main figure and the conclusions, its Sentence word for word in the abstract and the conclusions; a secondary End in the body, one abstract clause and a conclusions paragraph; a side End in one sentence or an appendix. Every End's Qualifier is listed on the abstract and conclusions entries that restate its Claim.
- Sections follow the section guide's parts for the paper's group, in their order; the Results follow `paper.md`'s objects; a standard method gets one sentence and a citation, an own method its reason.

## The glossary
`vN/glossary.md`, one block per term, the writer's boundary and the reader's ledger:

```
**Tail width** ($w$, `\w`):
The rms distance of the tail stars from the cluster's orbit, over 50–300 pc of both tails.
_Avoid_: tail thickness, breadth, the width (bare, when another width is in the paragraph)
_Ledger_: card m-ensemble, r-width · field (Weis2025 "the mean tail width") · defined at methods.width · first used at methods.width
```

The definition says what the thing is. `_Avoid_` lists every other word the cards or the library use for it, which the writer then never writes. `_Ledger_`: the card holding its value; its status (`field`, with the library's sentence; `coinage`; `label`); `defined at` the entry that puts it in the reader's hands, or `readership`; `first used at`. A word the paper needs in several senses gets a block per sense under its full name and one block for the bare word: `Several senses; never written bare:` and the full names. Names come from `paper.md`'s Names first. The abstract is its own ledger: no symbols, no labels.

## Work
Draft a skeleton in your notes (sections, parts, cards, budgets, where each End appears), then the glossary, then the entries, in the order Methods, Results, Discussion, Conclusions, Introduction, abstract: the reader's questions in the Introduction are easier once the claims are placed. Then run the lint, take each finding to its entry, and rerun until it passes; read the outline once as a writer would and sharpen every line that could not be acted on. Three rounds at most.

## Report
`OUTLINE-REPORT.md`, short: sections with paragraph counts and budget sums against the section guide's; the reader-questions in order, one line each (the author reads these first: an order fault shows in a minute); the headline of each section; every `context` taken from notes, with its file; every `?`; where each figure is introduced; what the section guide did not decide and how you decided it; card faults; the lint's final output.
