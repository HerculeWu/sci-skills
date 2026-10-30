# Sources: one rule
Every agent of `write-paper` reads this page first. It decides what an element of the paper may be; the briefs only say who does what.

## The rule
Every element of the text -- a claim, a number, a condition, a strength, a reference, a word, a symbol, a pronoun, a connective, a hedge, a sentence boundary, a paragraph, its place, its length -- is authorised by exactly one of four sources, and the writer can say which. A count, a tool, a brief's example and the writer's own judgement are not sources. An element that exists to move a count, satisfy a tool, or fill what a source left empty is a fault.

At every element, while writing and while reviewing, ask one question: **which source authorised this?**

## The four sources
- **The graph says what is true.** `papers/<paper>/argument.canvas`, owned by the author. Every claim, number, direction, condition, Qualifier strength, reason and citation is a card's. A step reaches it only through the card parts an outline entry lists.
- **The outline says what is written, where, how much and in what posture.** `vN/outline.md`: which paragraphs exist, their order, their cards, kind, role, tone, voice, budget, the relation to the paragraph before, the figure, and the context the graph does not hold. The outline agent writes it from the graph; the author may edit it before the text is written.
- **The library says how.** `<library dir>/writing/` and the papers' full texts. Most paragraphs a paper needs, the field has already written: a paragraph of the same kind and object is copied with its facts and person replaced, one of the same kind is imitated in its shape, and only where neither exists is one written from the section guide and the measured ranges.
- **The reader says when, and in what words.** One reader reads once, in order, holding only the readership's knowledge and what the text has given so far. A symbol before its definition, a word in a second sense, a pronoun whose antecedent is not the subject of the previous sentence or of its own clause, a result without the scope that limits it, a sentence that does not say how it follows from the one before: none is authorised. The cards and the outline are not in the reader's hands. The glossary of the version is the reader's ledger.

## When sources conflict
The source whose error the reader cannot repair wins: **graph > outline > reader > library**. A wrong number is invisible to the reader; a paragraph in the wrong place misleads about what matters; a missing definition stops the reader, who can look back; a form off the field's rate costs no truth. So a fact comes from the card and an arrangement from the outline; a Claim's number does not move to fit a sentence or a budget; a measurement takes no hedge to meet a range; the noun is written where a pronoun would be unclear, whatever the pronoun rate does; the field's word replaces a card's word, and the card's number and strength stay.

## When a source is silent or wrong
A card without a reason, an entry whose cards lack what it asks, a `context` of `?`, a tool that cannot see inside a construction: follow the highest source that speaks, and report the gap to the source's owner. Nothing is filled in. No step edits a card; only the outline agent writes the outline.

## Isolation
Each step reads the inputs its brief lists and no other, so that a fault can be traced: paragraph → `% outline:` entry → cards. A fault is repaired at the source that holds it -- the author's canvas for an argument, the outline for a place, a length or a posture, the text for a form -- never where it was noticed.

## Ranges and counts
A range from `language.json` is the library's testimony that the field writes a form at that rate. Outside it, the text holds sentences where a form's function is present and the form missing, or the form present and its function absent: find them by their function, or name each remaining sentence with the source that keeps it. A source given for a whole metric is no answer. A count decides where to look next, never what to write; a range binds both ways, and zero where the field writes a form is as far off as a rate above it. Every edit a count prompted is listed, with the function that kept or undid it.

## Writing is iterative
A draft, then rounds that read the whole: the relations between paragraphs, the reference chain, the terminology, the definitions no paragraph sees from inside. A round ends when no hard item remains and every range item is at its edge or named sentence by sentence; after that, further rounds move counts, not sentences.
