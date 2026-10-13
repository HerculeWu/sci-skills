---
name: build-argument-library
description: Build an Argument Library from a set of papers -- read each into an Argument DAG with subagents, then join them along their citations into one Obsidian canvas.
disable-model-invocation: true
---
# build-argument-library
Build an **Argument Library**: one Obsidian canvas in which the **Argument DAG** of every paper in a set is joined to the others along the citations between them. A reader can then follow a chain of evidence from one paper's **End Argument** down into the papers it rests on.

## Language
Terms in bold are defined in the sci-skills glossary, loaded at session start. If it is not in your context, read `${CLAUDE_PLUGIN_ROOT}/GLOSSARY.md` first.

## Input
A set of papers. Which papers, and where their full text is, come from the user; ask when either is unclear.

When canvases from an earlier run already exist for some of the papers, ask the user whether to reuse them.

## Reading the papers
Each paper is read by its own subagent with the `read-a-paper` skill, which writes that paper's canvas. One paper per fresh context, because several papers read in one context each get a thinner reading.

A paper that cannot be read, or whose canvas fails `check` (see [merging.md](merging.md)), is left out of the library. Continue with the rest.

## Joining the papers
A link comes from a citation: a card in paper A carries a `Cites:` line naming paper B, another paper of the set. Match the line to B through B's identity card, the card with id `paper`. Citations are the only source of links, because a citation can be checked against the text and a resemblance between two Claims cannot.

For each such citation, find the argument in B whose Claim A relies on, and link it to A's card with the label that says how A uses it: `Grounds`, `Warrant`, `Backing` or `Rebuttal`. Both cards stay. A's card is how A restates B and B's card is what B argued; the library exists to put the two side by side.

Every citation of a paper in the set ends in a link, an Audit Note on A's card, or both:
- **No argument in B makes the Claim.** A link asserts that B argued it, so here the citation becomes an Audit Note instead, saying that A cites B for this Claim and B's canvas holds no such argument.
- **A restates B more strongly than B argued** -- a dropped Qualifier, an ignored Rebuttal. Link the two cards and add an Audit Note that quotes both A's wording and B's, so the user can check the difference themselves.

These Audit Notes belong to the library canvas only, through the link list. A paper's own canvas stays as `read-a-paper` wrote it: how other papers cite it depends on which papers are in the set, and is no property of the paper.

A citation of a paper outside the set gets no card and no link. Count these citations for the reply. A paper that was left out counts as outside the set.

## Writing the library canvas
Record the papers, links and Audit Notes in a link list and let `scripts/library.mjs` write the canvas from it. [merging.md](merging.md) has the format and what the script produces.

## Reply
Tell the user where the library canvas is, then report:
- the papers in the library, and those left out with the reason;
- the main chains of argument that cross papers: whose End Arguments support which papers;
- the papers outside the set that the set cites most, as candidates for extending it;
- the citations of papers that were left out.
