# Argument output
The paper's Argument DAG is `papers/<paper>/argument.json`. Its fields, enums and graph rules are fixed by [schema/argument.schema.json](schema/argument.schema.json), described in words in [schema/README.md](schema/README.md); read that page first. Another project trains on files of exactly this form, so a field that cannot carry what a card needs is raised with the user, never bent. This page says how this skill fills the file.

A card is a working record for the author and the writer, never prose for the reader. Only an End's `sentence` goes into the paper word for word.

## Kinds
| Prefix | `kind` | Card |
|---|---|---|
| `n-` | `native` | support taken entirely from the library or cited works |
| `i-` | `intro` | the gap the paper fills |
| `m-` | `method` | the setup, the yardstick, an observer model |
| `r-` | `result` | what the rounds measured |
| `d-` | `discussion` | interpretation, comparison with the library |
| `e-` | `end` | what the paper delivers |
| `f-`, `t-` | figure `figure`, `table` | a figure or table a card stands on |

Ids are short and physical (`r-width`, `e-dynamics`), never Conjecture or Verification ids: a card can rest on several judgements, and the ids outlive the rounds. `paper.id` is the `<paper>` name.

## A card
```json
{
  "id": "r-width",
  "kind": "result",
  "title": "Tails 26 % closer to the orbit at 700 Myr",
  "claim": "One statement, as strong as the judgements allow.",
  "grounds": [
    { "text": "held: 29.0 vs 21.5 pc at 700 Myr, 44 SE (`figures/r1-v1/c2_width.png`).", "source": "tail-treatment-compare/round-1:C2" },
    { "text": "The minimum lies at ≈ 3π r_J,0.", "source": "n-epicycle" }
  ],
  "warrant": "The yardstick of m-ensemble.",
  "warrant_implicit": false,
  "backing": "",
  "qualifier": "- `tail-treatment-compare/round-1:C9` failed: …",
  "rebuttal": "",
  "sources": ["tail-treatment-compare/round-1:C2", "figures/r1-v1/c2_width.png"],
  "cites": ["2010MNRAS.401..105K"]
}
```
- `title`: the Claim in a few words, with its key number, at most 80 characters. A number in the title is one the Claim, Grounds or Warrant state.
- `backing`, `qualifier`, `rebuttal` are `""` when absent; several items in one of them are `- ` lines.
- `warrant_implicit` is `true` only when the Warrant is textbook and the paper will not state it.
- References inside text are in backticks, in the forms `source` takes; a card of this graph is named by its bare id.
- **Every Grounds item that states a number names where the number comes from** in `source`: a judgement, a file, a library card, or a card or figure of this graph. A number the agent derived (a ratio, a difference) names the file that holds it, or the agent writes that file first. A graph whose numbers trace nowhere passes every later check and is still wrong. Where an item rests on several files, `source` names the one that holds its numbers and the text names the others in backticks.
- `sources` lists the judgements, files, library cards and cards the argument rests on. It names no section of the paper: where a card goes is the outline's decision, made fresh each version.
- `cites`: the ADS bibcode of every work outside the project the card uses, from the library paper's `meta.json` or an ADS record (`find-papers`' `ads.mjs`), never from memory and never a library key.

### What a judgement may become
- **held** → Grounds of a Claim: a Grounds item with the judgement as `source` and `held` at the start of its text.
- **failed** → only a Qualifier or Rebuttal of a card whose Claim rests on held judgements; where it fits nowhere, it stays out. A Claim that is the opposite of a failed Conjecture, with the failed judgement as its Grounds (`failed` at the start of the text), is the author's to make, by editing the file or by asking for it; `check` then shows it as a `fault:` and passes.
- **not done**, and readings no Conjecture fixed a criterion for in advance → a Result whose Qualifier says `Not a Conjecture: <what was read, from which Verification>`, with the file. It is a measurement and reads as one, never as a tested prediction.

### End card
Also carries `rank` (`main`, `secondary` or `side`), `sentence` (the one sentence the abstract and the conclusions carry, word for word) and `reader` (who reads the paper for this End). Exactly one End is `main`. The Rank, the Sentence and the Reader are the author's; the agent proposes, the author decides.

## Edges
`{ "from", "to", "role" }`, from the Claim that is used to the argument that uses it; `role` is `grounds`, `warrant`, `backing` or `rebuttal`. No edge leaves an End.

## Viewing
[viewer.html](viewer.html) shows the file as a layered graph, Natives at the bottom and each End where its chain closes. Open it in a browser and pick or drop `argument.json`, and a version's `outline.md` to see which entries write each card. It needs no server and no network.

## Script
`scripts/paper-argument.mjs` sits next to this file and needs Node 18+.

```bash
node <skill-dir>/scripts/paper-argument.mjs judgements <proposals dir> [<name>...] [--argument <argument.json>]
node <skill-dir>/scripts/paper-argument.mjs shape <library.canvas> [<argument.json>]
node <skill-dir>/scripts/paper-argument.mjs check <argument.json> --library <library.canvas> --root <project dir>
```

- `judgements`: every held and failed Conjecture of every handed-over round, with its Claim and Result line; rounds not handed over are listed as skipped. With `--argument`, each is marked `in the graph` or `new`.
- `shape`: cards, depth and cards per level of each library paper and their median, and of the graph when given. Testimony of how the field builds a paper, never a target.
- `check`: prints `ok <path>`, or every problem as `error: <reason>` with a non-zero exit. It validates the file against the schema first and reports only the schema's problems when there are any. Then: ids unique; `paper.id` the paper's directory; edges naming existing nodes, none repeated, no cycle, every argument and figure on a path to an End; every judgement exists in its progress record and is held or failed, and a Grounds item resting on one starts with its status; every library card, file and figure file named exists. It also prints `fault:` lines that do not fail the check: a title number the card's Claim, Grounds and Warrant do not state, a Claim range its Grounds contradict, and a failed judgement outside Qualifier and Rebuttal. Each is the author's to see.
