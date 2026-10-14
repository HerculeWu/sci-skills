# Comparison table
`proposals/<name>/table.md`, one per goal. Every round appends to it: rows carry the round they were added in, and a row is edited only to change a candidate's status. Every *silent* and *assumed* on the canvas traces back to a cell here.

```markdown
# Comparison table · <name>

Goal: <the goal as a question>
Library: <library dir> (<M> papers, Shorts in `shorts/`)

## Elements

| id | Element | Source | Added in |
|---|---|---|---|
| T | … | said by the user | round 1 |
| Q1 | … | drawn from the library (`Weis2025:tail-robust`) | round 1 |
| K | constraints and warnings for this kind of run | fixed | round 1 |
| S | scatter or effect sizes usable as a yardstick | fixed | round 1 |

## Opening record

The scope of every "silent" is the papers listed here.

| Element | Papers opened | Count | Round |
|---|---|---|---|

## Papers × elements

Stances: **established** / **assumed** / **disputed** / **silent** (full text checked) / **no card mentions it** (no full text) / — (does not apply)

| Paper | T | Q1 | K | S |
|---|---|---|---|---|
| Gieles2021 | **established**: one quoted or paraphrased line (`A_setup`) | … | — | — |

## Findings across papers

| id | Finding | Cards | On the canvas |
|---|---|---|---|

## Candidates

| Round | Verification group | Costly? | Conjectures | Status | Reason |
|---|---|---|---|---|---|

## Papers that may be worth adding to the library

Works outside the set, cited by the cards the chosen candidates move. Adding them is the user's choice.

| Cited on | Work (as on the `Cites:` line) |
|---|---|
```

- **Elements**: the agreed elements of the idea, plus K and S.
- **Opening record**: for each element, the papers opened for it. This is the scope of every *silent*.
- **Papers × elements**: one stance per cell from the subagents' reports, with the card id (within the paper) and one quoted line.
- **Findings across papers**: findings that span papers, such as two cards that conflict without citing each other, and whether each went on the canvas.
- **Candidates**: every candidate laid out in step 3. Status is *chosen*, *not chosen* or *ruled out*; Reason records who decided and why, so a ruled-out direction stays out of later rounds.
- **Papers that may be worth adding to the library**: from the `Cites:` lines of the cards the chosen candidates move, for works outside the set.
