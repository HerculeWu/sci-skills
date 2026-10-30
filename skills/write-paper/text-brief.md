# Text brief
Brief for the text agent, step 2. The main session gives it this file, `sources.md`, and the paths below, and nothing else.

You write the paper's paragraphs from its outline, one paragraph per entry, in the outline's order, within its budgets and in its posture, by copying and imitating the field's paragraphs. You edit no entry and no card: an entry you cannot carry out is reported.

## Inputs
- `sources.md`, then this brief.
- `vN/outline.md` and `vN/glossary.md`.
- For each entry, the card parts its `cards` field lists in `papers/<paper>/argument.canvas`, and no other part of the canvas.
- `papers/<paper>/paper.md`: Build, Journal, Names.
- `<library dir>/writing/`: `library-map.md` first, then the labels and the `paragraphs` tool to open a paragraph, `language.json` and the `profile` tool for the rounds (`writing/README.md` says how to run them).
- The library's full texts and Shorts, reached through the map.
- The figures the outline names; `papers/<paper>/journal/` for the class files.
- Not read: earlier versions, the outline brief, the rest of the canvas.

## Output
`vN/main.tex`, `vN/sections/*.tex` (one file per section, in reading order by name, the abstract included), `vN/refs.bib`, the built PDF, `vN/REPORT.md`. `scripts/paper.mjs check vN --root <project>` must pass.

## Each paragraph: copy, imitate, write
For each entry, in this order:
1. **Copy.** Find in the map a paragraph of the same kind on the same object (a description of the same code, potential, survey selection, quantity). Take it whole. Replace every fact in it -- number, object, version, citation -- with the listed cards' facts, or remove it: a fact of the exemplar that survives and is not on the listed cards is a fault. Change the person: an exemplar's authors say "we" about their own code; here that code is a third party, and "we" stays for this paper's own choices and findings.
2. **Imitate.** Where the library has the kind but not the object, take one exemplar's shape -- the order of its sentences' functions, its connectives, its register, its length -- and fill it from the cards.
3. **Write.** Where neither exists, write from the section guide and the ranges, rendering the cards as below.

One exemplar per paragraph, at most one more to fill a gap; never a fusion. Every paragraph opens with its trace:

```latex
% outline: dynamics.width-headline
% source: copy Kupper2010 §4.2 ¶3        (or: imitate Dinnbier2020a §5 ¶2, or: written)
```

An entry whose `context` is `?` gets its `% outline:` line and `% not written: context ?`, and no text.

## Rendering the graph
| On the cards | In the text |
|---|---|
| Grounds then Claim (an arguing paragraph) | the evidence, then "Thus …" or "which shows that …" |
| Claim then Grounds (a describing paragraph) | the claim, then the evidence: one number or one pair with its condition per clause; more than three numbers go to a table |
| A Warrant that is the paper's own physics | "because", "since", "in the … approximation"; hedged only where it interprets (`tone`) |
| A Warrant marked implicit, or textbook | not rendered |
| Backing | one citation, after the sentence it backs; the physics in the authors' voice |
| Qualifier | inside the Claim's sentence or the next, with its number; the same strength wherever the Claim recurs |
| A Rebuttal, a failed Conjecture | "We had expected …, because …. However, …" |
| A Grounds edge between paragraphs | the second paragraph's first sentence names the first's result as its cause or condition (`follows`) |
| A comparison with earlier work | their value, ours, the reason, at the point of the result |
| An End's Sentence | word for word |

A card's wording is a working record, never the reader's sentence: render its content in the field's words and the glossary's names. Every object, quantity and label takes the glossary's name; a word in several senses is never written bare; an `_Avoid_` word is never written. Add a glossary block only to name something the outline did not; change none.

## The bibliography
`scripts/paper.mjs cites papers/<paper>` lists `key=bibcode` for the library papers the canvas cites, and the `Cites:` lines outside the library. Find each outside work's bibcode with `${CLAUDE_PLUGIN_ROOT}/skills/find-papers/scripts/ads.mjs search`, then write `refs.bib` from `ads.mjs bibtex <key>=<bibcode> …`, keyed by library key where there is one. Cite only its keys; never write an entry from memory.

## Rounds
Build, then read the whole text once as the reader, in order, and run `check` and the `profile` tool against `language.json` for the paper's group. Take every item -- a failed check, a range outside, a paragraph outside its budget, a `follows` relation the text does not state, a pronoun without its antecedent, a term used before its definition -- to its paragraph, and ask there which source authorised it and what the source wants instead. A copied paragraph outside a range was copied from the wrong paragraph: find a better one, or imitate. Fix it there, or name the sentence with its source. Four rounds at most; they end when `check` passes and every range item is at its edge or named sentence by sentence.

## Report
`REPORT.md`: pages and words; per paragraph its source class, with the counts copied / imitated / written and the exemplars used; the rounds and what ended them; what the counts decided (each edit a count prompted, and the function that kept or undid it); `check` and `profile` results, with every range item named by its sentences; entries not carried out and why; card faults met; what the tools could not see.
