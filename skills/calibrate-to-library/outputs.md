# Outputs
`<library dir>/writing/` is read by `write-paper`: its outline step reads the kinds and the section guide, its text step finds paragraphs through the map, and its review measures drafts with the tools. The names and shapes below are that interface and stay as written. What goes inside them -- the kinds, the groups, the metrics, how the tools work -- is the calibration's own.

## README.md
- Date, the papers measured (per group), the papers without a full text.
- The author's decisions at each stop, in the author's words, with the date.
- How to run each tool (the commands below), and what each tool cannot see.
- On a later run, a dated line per change: papers added, kinds changed, ranges re-measured.

## section-guide.md
Opens with the vocabulary, one line per kind, in this form, so that a lint can read it:

```markdown
## Kinds
- `GAP` (Introduction): what the field has not done that this paper does. Example: `Weis2025 §1 ¶5`.
- `CASE` (Results): one representative model or object worked through in full. Example: `Gieles2021 §3 ¶1`.
```

The word in parentheses is the section group the kind belongs to; a kind used in several groups is listed once per group. Then, for each group of papers and each section: what the library does, as counts with the number of papers they rest on; then the parts in their order, each naming its kinds. A count resting on fewer papers than makes a pattern says so.

## labels/<Key>.json
```json
{
  "key": "Weis2025",
  "group": "simulation",
  "paragraphs": [
    { "n": 1, "section": "1 Introduction", "kind": "STAKE", "words": 112 },
    { "n": 2, "section": "1 Introduction", "kind": "PHYSICS", "words": 140 }
  ]
}
```
`n` is the paragraph number the splitting tool gives, counted through the whole paper; `kind` is `null` for a paragraph no kind fits.

## library-map.md
One heading per kind; under it, the paragraphs that do it, with the paper's group and object in a few words, so the writer can choose the one closest to its own paragraph:

```markdown
## CASE (Results)
- `Gieles2021 §3 ¶14` · simulation · a globular cluster with and without black holes
```

## language.json
```json
{
  "measured": "2026-10-30",
  "tool": "tools/<command>",
  "metrics": {
    "<name>": {
      "what": "one line: what is counted, per what unit",
      "groups": { "<group>": { "papers": 19, "median": 25.1, "q1": 23.8, "q3": 27.0 } }
    }
  }
}
```

## tools/
Whatever language and form suit the project, with two commands every version of `write-paper` runs, named in the README:
- **paragraphs**: given a paper key (and optionally a number), print its numbered paragraphs, or one paragraph, as the labels count them;
- **profile**: given any text file (markdown or LaTeX), print the metrics of `language.json` for it, as JSON with the same names.
