# paper.md
`papers/<paper>/paper.md` holds what the author decides about the paper that neither the canvas nor the library holds. The End ranks and Sentences are on the canvas; everything else the author decides is here. `write-paper` asks for every missing item at once on the first run, and the file wins over memory afterwards. The bold fields are read by `scripts/paper.mjs`; keep them exactly as written.

```markdown
# Paper · tail-treatment

**Group**: simulation
**Library**: literatures
**Abstract limit**: 300
**Build**: latexmk -pdf -outdir=build main.tex

## Readership
Star-cluster dynamicists and Gaia tail observers.
Undefined: N-body, Jacobi radius, epicycle, convergent point, King, Plummer.

## Standard and own
- Standard (one sentence and a citation): the codes, the IMF, the Galactic potential, the stellar tracks, the selections.
- Own (in full, each choice with its physical reason): the treatments, the width and its split, the yardstick.

## Objects of the Results
1. The bound cluster.
2. The distance of the tails from the orbit.
3. …

## Names
- T1 → the reference treatment; T2 → Galaxy-only; T3 → the tree treatment.

## Journal
A&A: structured abstract (Context, Aims, Methods, Results, Conclusions); class files in `papers/<paper>/journal/`; units with a thin space, ranges with an en dash.
```

- **Group**: the group of the calibration (`<library dir>/writing/README.md`) whose papers this one is written like.
- **Library**: the library directory, from the project root; its `writing/` is the calibration.
- **Abstract limit**: the journal's limit in words.
- **Build**: run from the version directory.
- **Readership**: who reads, and the terms they hold without definition.
- **Standard and own**: what gets one sentence and a citation, and what is given in full with its reason.
- **Objects of the Results**: the subsections of the Results, as objects of study. Where they and the End ranks disagree, the ranks win.
- **Names**: the reader's names for the project's internal labels.
- **Journal**: the form the journal asks for, and where its class files are.
