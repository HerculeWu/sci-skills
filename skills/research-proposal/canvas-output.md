# Canvas output
Round N's proposal is `proposals/<name>/round-N.canvas`, an Obsidian canvas. The headings, field names and markers below stay exactly as written: the user finds the same thing in the same place every round, and `scripts/proposal.mjs check` reads the colours, tags and labels.

## Layout
Bottom to top, in the same direction as `read-a-paper`:

1. library cards;
2. the proposal's own established arguments, and the Verification designs;
3. Conjectures;
4. outlook;
5. the goal card.

Colour marks the zones; no groups. A legend card sits at the top left. Size every card to its text, and leave enough space between rows for edge labels to be read.

| Colour (Obsidian preset) | Card |
|---|---|
| cyan `5` | goal card |
| none | library card |
| green `4` | the proposal's own established argument: motivation, discussion, benchmark, a result from an earlier round |
| orange `2` | costly Verification |
| yellow `3` | cheap Verification, and every Conjecture |
| purple `6` | outlook |
| red `1` | ⚠ exception: no shallow Conjecture is possible |

## Naming a library card
A library card is named as its id in the library canvas, in backticks: `` `<paper key>:<card id>` ``. `check` looks every such name up in the library, because a reference to a card that does not exist is the quietest error this skill can make. Keep backticked `word:word` for card names only.

## Cards

### Goal card
```
# Goal · round N

**Question**: … — *said by the user*
**Object**: … — *said by the user*
**Levers**: … — *said by the user*
**Quantities to look at** — *drawn from the library*
- … (`Weis2025:tail-robust`)

**Novelty is judged against the library only; no literature outside it was searched.**

Aligned on <date> · opened <n> of <M> papers (see table.md)
```
Each item carries its source: *said by the user*, *drawn from the library* or *inferred by the agent*. Several readings agreed in step 1 are listed as (a), (b), ….

### Library card
```
`Gieles2021:A_setup` · intermediate
one sentence of what the card says
```
The category is `Native`, `End` or `intermediate`. The sentence summarises the library card, which stays the authority. When the support the proposal uses is a reader's inference (`(implicit)` in the library) rather than the paper's words, mark it **(reader's inference)**.

### The proposal's own argument
Motivation, discussion, benchmark, or a result from an earlier round:
```
## M1 · Motivation
## D1 · Discussion: <what conflicts>
## B1 · Benchmark: <what can be compared>
## R1 · Result · from round k
```
Then **Claim**, **Grounds**, **Warrant**, and **Qualifier**, **Rebuttal** where needed.
- Two library cards that conflict and do not cite each other become a discussion argument naming both.
- A result from an earlier round -- a Conjecture that held, or the opposite of one that failed -- has Grounds pointing to the file that holds the result.

### Verification card
```
## V1 · Verification · costly      (orange)
## V0 · Verification · cheap       (yellow)
```
- **Design (argument)**: what is done, supported by edges from library cards and benchmarks.
- **Needs**: one line each, ✓ or ✗, with where it comes from (a file of the project, or *said by the user*).
- **Yields**: the quantities or plots it produces.

A costly Verification also has:
- **Scale**: the scale, compared with the limits the project states, or **cannot tell**.
- **Yardstick**: the yardstick, and the runs in the design that produce it.
- **For the user to decide**: every choice in the design without support.

A library argument against the design is drawn as a `Rebuttal` edge into the card.

### Conjecture card
```
## C1 · Conjecture (V1) · shallow · benchmark
**Claim**: In V1, the tail's number-density profile along the orbit under treatment 1 differs from `Gieles2021:A_setup` by less than σ_seed.
**Warrant**: …
**Qualifier**: …
**Rebuttal (criterion)**: a deviation above 2σ_seed in any distance bin refutes it.
**Effect size**: …

**If it holds** → …
**If it fails** → …
```
- The heading names the Verification it hangs on, then its tags, separated by ` · `: `shallow`, `benchmark`, `bet`, `⚠ not shallow`, `from round k`.
- **Claim**: one decidable sentence: what is measured, what it is compared with, which direction.
- **Rebuttal (criterion)**: the result that would refute it, stated now.
- **Effect size**: an estimate with the card id it rests on, or **unknown**.
- **If it holds** / **If it fails**: what each outcome establishes. A costly Verification needs at least one Conjecture tagged `shallow` with both lines; other Conjectures may have **If it holds** only.
- When no library card can be named for it, write **The library has nothing to say here.**
- An untested Conjecture carried over from round k keeps its card and adds the tag `from round k`.

**The exception.** When a costly Verification can have no shallow Conjecture, its Conjecture is red, tagged `⚠ not shallow`, with a line **Exception**: saying why.

### Outlook card
```
## O1 · Outlook (no commitment)
what it would do
**Lacks**: what it still lacks
```
A costly Verification in the outlook says so in its heading: `## O3 · Outlook · costly Verification V2 (no commitment)`.

### Legend card
Top left, uncoloured: the colour table above and the edge labels below.

## Edges
- Every edge has one label: `Grounds`, `Warrant`, `Backing` or `Rebuttal`. Direction as in the Argument DAG, from the Claim that is used to the argument that uses it. A Verification feeds each of its Conjectures as `Grounds`.
- An edge from a Conjecture to the argument its outcome would feed says which outcome: `holds → <label>` or `fails → <label>`, coloured yellow `3`.
- Every `Rebuttal` edge is red `1`.

## Wording of gaps
A gap is written with its scope: "not in the library", "none of the N papers opened mentions it", and "no card mentions it" when the full text was not available.

## Check
`scripts/proposal.mjs` sits next to this file and needs Node 18+:

```bash
node <skill-dir>/scripts/proposal.mjs check <round-N.canvas> <library.canvas>
```

It confirms that:
- the canvas parses, every card has a position and size, and every edge joins two existing cards;
- every backticked `<paper key>:<card id>` is a card of the library;
- every edge label is one of the four, or `holds → <label>` / `fails → <label>`;
- every orange card grounds a Conjecture tagged `shallow` with both **If it holds** and **If it fails**, or one tagged `⚠`.

It prints `ok <path>`, or every problem as `error: <reason>` with a non-zero exit.
