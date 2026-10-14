# Shorts
A **Short** lets the main agent decide, for one element of an idea, whether a paper is worth opening, without reading its canvas. It answers nothing about any idea, so it is written without one and serves every idea and every round.

It lives at `<library dir>/shorts/<paper key>.md`. Only missing Shorts are written; to have one rewritten, the user deletes its file.

## Format
```markdown
# <paper key>

**Object**: …
**Kind of work**: observation | simulation | theory | mixed

## Data and methods
- <data set, code or model>: own run | cited (<whose>); includes …, omits …; runs: <n>; role: quantitative basis | qualitative reference

## Quantities
- <quantity>: measured from data | computed from a model

## End Arguments
- `<paper key>:<card id>`: one line
```

Keep the headings as shown, and stay within about 2000 characters; a paper with many methods may run longer.

## What makes a Short useful
- **Methods in full.** What an idea needs is mostly in the Grounds of low cards, rarely in End Arguments: in the sample library only 3 of 50 relevant cards were End Arguments. A paper with an observational title often hides a simulation, and only its methods give that away. So every data set, code and model used as a tool is listed, each with the four facts above.
- **Description only.** The Short says what the paper did. Whether it did it well, and what it left out, is judged later against a particular idea, so the Short carries no evaluation and lists no gaps.

## Brief for the subagent
Give each subagent one paper: its key, its canvas (the path in the library's link list), the path of its full text or "none", and the path to write. It reads the canvas first and uses the full text to complete the methods, then writes the Short and replies with the path.
