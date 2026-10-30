# Canvas output
The paper's Argument DAG is `papers/<paper>/argument.canvas`, an Obsidian canvas. It follows `read-a-paper`'s canvas (Toulmin elements as `##` sections, one identity card `paper`), so the paper reads like one more paper of the library. The ids, kind lines, headings and reference forms below stay exactly as written: `write-paper` and `scripts/paper-argument.mjs check` read them.

A card is a working record for the author and the writer, never prose for the reader. Only an End's `## Sentence` goes into the paper word for word.

## Kinds
The id prefix names the card's kind; the bold line under the title says the same in words. The colour marks it on the canvas.

| Prefix | Line | Colour (Obsidian preset) | Card |
|---|---|---|---|
| `n-` | `**Native Argument**` | cyan `5` | support taken entirely from the library or cited works |
| `i-` | `**Argument (Introduction)**` | none | the gap the paper fills |
| `m-` | `**Argument (Method)**` | orange `2` | the setup, the yardstick, an observer model |
| `r-` | `**Argument (Result)**` | none | what the rounds measured |
| `d-` | `**Argument (Discussion)**` | purple `6` | interpretation, comparison with the library |
| `e-` | `**End Argument**` | green `4` | what the paper delivers |

The identity card `paper` is yellow `3`; a legend card, if any, has the id `legend`. Ids are short and physical (`r-width`, `e-dynamics`), never Conjecture or Verification ids: a card can rest on several judgements, and the ids outlive the rounds.

## Card
```
# The Claim in a few words, with its key number
**Argument (Result)**

## Claim
One statement, as strong as the judgements allow.

## Grounds
- `tail-treatment-compare/round-1:C2` held: 29.0 vs 21.5 pc at 700 Myr, 44 SE (`figures/r1-v1/c2_width.png`).
- The minimum lies at ≈ 3π r_J,0 (n-epicycle).

## Warrant
The yardstick of m-ensemble.

## Qualifier
- `tail-treatment-compare/round-1:C9` failed …

## Rebuttal
…

Source: `tail-treatment-compare/round-1:C2`, `figures/r1-v1/c2_width.png`
Cites: <entry, as in the library paper's meta.json or an ADS record>
```
- `## Claim`, `## Grounds` and `## Warrant` on every card; `## Backing`, `## Qualifier`, `## Rebuttal` where they apply.
- Three reference forms, always in backticks:
  - a judgement: `` `<name>/round-<k>:C<n>` ``, followed by `held` or `failed`;
  - a library card: `` `<paper key>:<card id>` ``;
  - a project file: its path from the project root, in full.
  A card of this canvas is named by its bare id.
- **Every Grounds item that states a number names where the number comes from**: a judgement, a file, a library card, or a card of this canvas. A number the agent derived (a ratio, a difference) names the file that holds it, or the agent writes that file first. A canvas whose numbers trace nowhere passes every later check and is still wrong.
- `Source:` lists the judgements and files the card rests on. It names no section of the paper: where a card goes is the outline's decision, made fresh each version.
- `Cites:` one line per work outside the project, from the library paper's `meta.json` or an ADS record (`find-papers`' `ads.mjs`), never from memory.

### What a judgement may become
- **held** → Grounds of a Claim.
- **failed** → only a Qualifier or Rebuttal of a card whose Claim rests on held judgements; where it fits nowhere, it stays out. A Claim that is the opposite of a failed Conjecture, with the failed judgement as its Grounds, is the author's to make, by editing the canvas or by asking for it; `check` then shows it as a `fault:` and passes.
- **not done**, and readings no Conjecture fixed a criterion for in advance → a Result whose Qualifier says `Not a Conjecture: <what was read, from which Verification>`, with the file. It is a measurement and reads as one, never as a tested prediction.

### End card
Also carries:
```
## Rank
main | secondary | side

## Sentence
The one sentence the abstract and the conclusions carry, word for word.

## Reader
Who reads the paper for this End.
```
Exactly one End is `main`. The Rank, the Sentence and the Reader are the author's; the agent proposes, the author decides.

## Edges
Every edge has one label, `Grounds`, `Warrant`, `Backing` or `Rebuttal`, from the Claim that is used to the argument that uses it. Every `Rebuttal` edge is red `1`. No edge leaves an End.

## Layout
Bottom to top, as in `read-a-paper`: Natives at the bottom, then Method, Results and Discussion, each End at the height where its chain closes, the identity card on top. Size every card to its text and leave room between rows for edge labels.

## Script
`scripts/paper-argument.mjs` sits next to this file and needs Node 18+.

```bash
node <skill-dir>/scripts/paper-argument.mjs judgements <proposals dir> [<name>...] [--canvas <argument.canvas>]
node <skill-dir>/scripts/paper-argument.mjs shape <library.canvas> [<argument.canvas>]
node <skill-dir>/scripts/paper-argument.mjs check <argument.canvas> --library <library.canvas> --root <project dir>
```

- `judgements`: every held and failed Conjecture of every handed-over round, with its Claim and Result line; rounds not handed over are listed as skipped. With `--canvas`, each is marked `on canvas` or `new`.
- `shape`: cards, depth and cards per level of each library paper and their median, and of the canvas when given. Testimony of how the field builds a paper, never a target.
- `check`: prints `ok <path>`, or every problem as `error: <reason>` with a non-zero exit. It confirms the canvas parses; ids, kind lines and the three required sections; Rank, Sentence, Reader and exactly one main End; edge labels and red Rebuttals; no cycle, no edge out of an End, every card on a path to an End; every judgement exists in its progress record and is held or failed; every library card and file named exists; every Grounds item with a number names its source. It also prints `fault:` lines that do not fail the check: a title number the card's Claim, Grounds and Warrant do not state, a Claim range its Grounds contradict, and a failed judgement outside Qualifier and Rebuttal. Each is the author's to see.
