# Canvas output
The Argument DAG is delivered as an Obsidian canvas, a `.canvas` file that the user opens in Obsidian.

## Cards
- One identity card with the id `paper`: the paper's title, authors and year, and the DOI or arXiv identifier printed on it. It is how this canvas is recognised when another paper's canvas cites this paper.
- One text card per Argument, with its Toulmin elements as markdown sections.
- Each card states whether it is a Native Argument or an End Argument, when it is one.
- Each card has a `Source:` line saying where in the paper the argument comes from, e.g. `Source: §3.2, Fig. 4, Eq. 7`.
- Each card that rests on another publication has one `Cites:` line per publication, holding its entry copied from the paper's reference list. Copy identifiers only as printed there: an identifier you supply from memory can match the wrong paper.
- A card is not limited to text: include a figure, equation or table wherever it makes the argument clearer.

## Edges
Every edge carries one label saying how the source argument's Claim is used by the target argument: `Grounds`, `Warrant`, `Backing` or `Rebuttal`.

## Audit findings
Mark every card involved in a finding from the audit step as "Audit Note" -- a circular dependency, or an argument with no path to an End Argument -- so the finding is visible on the canvas.

## Before finishing
Confirm that the file parses as JSON and that every edge references an existing card. A canvas that fails either check opens blank or broken in Obsidian.

## Chat reply
Tell the user where the canvas is, then summarise: the End Arguments, the main chain of arguments leading to them, and the audit findings.
