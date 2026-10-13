# Merging into the library canvas
`scripts/library.mjs` sits next to this file. It needs Node 18+ and nothing else. Call it by absolute path:

```bash
node <skill-dir>/scripts/library.mjs check <paper.canvas>...
node <skill-dir>/scripts/library.mjs merge <link-list.json> <library.canvas>
```

Problems print as `error: <reason>` on stderr with a non-zero exit, all of them at once.

## check
Confirms that a per-paper canvas can be merged: it parses, every card has a position and size, every edge joins two existing cards, and there is an identity card (id `paper`). It prints `ok <path>` for each canvas that passes.

## The link list
A JSON file you write. It is the whole of your judgement about how the papers connect; the script adds none.

```json
{
  "papers": [
    { "key": "lee2024", "canvas": "lee2024.canvas", "label": "Lee et al. 2024", "year": 2024 },
    { "key": "smith2021", "canvas": "smith2021.canvas", "label": "Smith et al. 2021", "year": 2021 }
  ],
  "links": [
    {
      "from": { "paper": "smith2021", "card": "e2" },
      "to": { "paper": "lee2024", "card": "n3" },
      "label": "Grounds"
    }
  ],
  "notes": [
    { "paper": "lee2024", "card": "n3", "note": "Cites Smith et al. 2021 for ..., which that paper qualifies as ..." }
  ]
}
```

- `papers`: every paper in the library. `key` is a short name of letters, digits, `.`, `_` and `-`, unique in the list. `canvas` is relative to the link list's directory. `label` (default: the key) titles the paper's group; `year` orders papers that do not cite each other.
- `links`: one per cross-paper link. `from` is the cited paper's argument, `to` is the card that cites it -- the same direction as the edges inside a paper, from the Claim that is used to the argument that uses it. `card` is the card's id in its own canvas. `label` is `Grounds`, `Warrant`, `Backing` or `Rebuttal`.
- `notes`: one per Audit Note. `card` must be a text card.

## merge
Writes the library canvas, replacing any file at that path. It is rebuilt whole on every run, so a change belongs in a per-paper canvas or in the link list, never in the library canvas itself.

- Each paper becomes a group holding its full canvas with the layout unchanged. Card ids become `<key>:<id>`.
- A paper sits above every paper it cites; papers in one row are ordered by year.
- Cross-paper links are purple edges. Edges inside a paper keep their look.
- Each Audit Note is appended to its card under an `## Audit Note` heading, and the card turns red.
- A circular dependency that the links close is not broken: every card on it gets an Audit Note, and the script prints a `cycle across papers:` line with the cards.

On success it prints one `wrote ...` line with the counts.
