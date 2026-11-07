# The argument file, version 1
A paper's Argument DAG as one JSON file, `papers/<paper>/argument.json`. `build-paper-argument` writes it, `write-paper` reads it, and another project trains a writing model on graphs in exactly this form.

[`argument.schema.json`](argument.schema.json) (JSON Schema, draft 2020-12) is the single source. Other projects copy it verbatim; any incompatible change bumps `version`. This page says the same in words, plus the rules a schema cannot state.

## Example
```json
{
  "version": 1,
  "paper": { "id": "tail-treatment", "title": "Tidal tails under three force treatments" },
  "arguments": [
    {
      "id": "r-width",
      "kind": "result",
      "title": "Tails are 35% wider with the Galaxy-only treatment",
      "claim": "At 700 Myr the tail width under T2 exceeds T1 by 7.5 pc at 1300 Msun ...",
      "grounds": [
        { "text": "held: 29.0 vs 21.5 pc at 700 Myr, 44 SE", "source": "tail-treatment-compare/round-1:C2" },
        { "text": "Width against time, both masses", "source": "f-widths" }
      ],
      "warrant": "The yardstick of m-ensemble.",
      "warrant_implicit": false,
      "backing": "",
      "qualifier": "Only over 50-300 pc of both tails ...",
      "rebuttal": "",
      "sources": ["tail-treatment-compare/round-1:C2", "figures/r1-v1/c2_width.png"],
      "cites": ["2010MNRAS.401..105K"]
    },
    {
      "id": "e-dynamics",
      "kind": "end",
      "title": "...",
      "claim": "...", "grounds": [{ "text": "...", "source": "r-width" }], "warrant": "...",
      "warrant_implicit": false, "backing": "", "qualifier": "...", "rebuttal": "",
      "sources": [], "cites": [],
      "rank": "main",
      "sentence": "The one sentence written word for word into the abstract and the conclusions.",
      "reader": "Star-cluster dynamicists."
    }
  ],
  "figures": [
    { "id": "f-widths", "kind": "figure", "file": "figures/r1-v1/c2_width.png",
      "shows": "Tail width against time for the three treatments, both masses." }
  ],
  "edges": [
    { "from": "r-width",  "to": "e-dynamics", "role": "grounds" },
    { "from": "f-widths", "to": "r-width",    "role": "grounds" }
  ]
}
```

## Fields
| Field | Type | Rule |
|---|---|---|
| `version` | integer | `1` |
| `paper.id`, `paper.title` | string | `id` is the `<paper>` name |
| `arguments[].id` | string | `^(n\|i\|m\|r\|d\|e)-[a-z0-9-]+$`, unique across arguments and figures; the prefix matches `kind` |
| `arguments[].kind` | enum | `native` (n), `intro` (i), `method` (m), `result` (r), `discussion` (d), `end` (e) |
| `title` | string | at most 80 characters; the Claim in a few words, with its key number |
| `claim` | string | required, non-empty |
| `grounds` | array of `{text, source}` | at least one item. `source` is a string, required whenever `text` states a number (contains a digit): a judgement `<name>/round-<k>:C<n>`, a library card `<paper key>:<card id>`, a project file path from the project root, or the id of an argument or figure in this graph. Other projects may also give a location in a published paper (`Sect. 4.2`, `Table 2`, `Eq. (5)`); the schema accepts any non-empty string. Whether a judgement was held or failed goes at the start of `text`. |
| `warrant` | string | required, non-empty |
| `warrant_implicit` | boolean | the Warrant is textbook or unstated in the text |
| `backing`, `qualifier`, `rebuttal` | string | `""` when absent |
| `sources` | array of string | what the argument rests on: judgements, files, library cards, ids |
| `cites` | array of string | ADS bibcodes only (19 characters), never library keys or free-form references; a library key is looked up in the library's `meta.json` |
| `rank`, `sentence`, `reader` | enum / string / string | on `end` arguments only, and required there. `rank` is `main`, `secondary` or `side`, with exactly one `main` per graph |
| `figures[].id` | string | `^(f\|t)-[a-z0-9-]+$` |
| `figures[].kind` | enum | `figure`, `table` |
| `figures[].file` | string or null | a path from the project root, or a table label |
| `figures[].shows` | string | what it shows, as a working record (not the caption) |
| `edges[]` | `{from, to, role}` | `role` is `grounds`, `warrant`, `backing` or `rebuttal`; `from` is an argument or figure, `to` an argument |

Every object has exactly the fields above; no others.

## Rules beyond the schema
A JSON Schema cannot state these; a reader of the file checks them itself (`build-paper-argument`'s `check` does):
- Ids are unique across arguments and figures, and every edge's `from` and `to` name one.
- No edge leaves an `end` (the schema checks the id prefix), there is no cycle, and no `(from, to, role)` repeats.
- Every argument and figure lies on a path to some `end`.

## Text
Text fields are markdown and may contain `$math$`. All Toulmin text is in English. Card text is a working record for the author and the writer, never prose for the reader; only `sentence` goes into the paper word for word.
