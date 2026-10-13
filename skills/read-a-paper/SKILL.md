---
name: read-a-paper
description: Read and understand a paper, and write its argument structure as an Obsidian canvas. Use when the user wants a detailed logical breakdown of a paper -- "explain paper X", "introduce paper X in details"
---
# read-a-paper
Break down a research paper into a network of interconnected arguments using the **Toulmin Model of Argumentation** as a foundation. By formalizing text into a Directed Acyclic Graph (DAG) structure --- **Argument DAG**, you can bypass rhetorical filler and directly see a paper's logical integrity

## Languages
Terms in bold are defined in the sci-skills glossary, loaded at session start. If it is not in your context, read `${CLAUDE_PLUGIN_ROOT}/GLOSSARY.md` first.

Every argument you record has a Claim, Grounds and a Warrant. When the paper leaves the Warrant unstated, write the one you infer and mark it `(implicit)`.

## Step-by-Step Prescription for Argument DAG Construction
Follow this sequence to read the paper and map its structural logic from the bottom up.
### Step 1: Excavate and Verify the Native Arguments
Go to the Literature Review, Methodology, or Background sections. Look for statements backed entirely by citations or industry standards. Formulate these as your foundational Native Argument nodes. Example Node: 
```
[Claim]: Feature extraction via ResNet-50 is robust for image classification. 
[Grounds]: Baseline accuracy scores from [Citation X].
[Warrant]: (implicit) High accuracy on a standard benchmark indicates features that are robust for the task.
```
Draw these at the bottom layer of your Argument DAG layout.

### Step 2: Parse the Intermediate Logical Chain (Bottom-Up Synthesis)
Read the Results, Experiments, and Discussion sections. Look for how the authors use their foundational elements to build new claims. Connect your Native Arguments to new, intermediate argument nodes by defining their functional relationships. Ask yourself: How is this native knowledge being weaponized? Draw edges labeled by "As Grounds", "As Warrant", "As Backing" or "As Rebuttal".

### Step 3: Map Inhibitors and Scope Constraints (Rebuttals & Qualifiers)
Look for limitations sections, edge cases, or statistical error margins. Attach Qualifiers and Rebuttals to your active nodes.

### Step 4: Advance through Intermediate Nodes to the End Arguments
Continue mapping intermediate nodes (e.g., Lemma 1 leads to Theorem 1; Experiment A and Experiment B together form the baseline for System Architecture C). Iteratively link these intermediate claims until they directly feed into End Arguments.

### Step 5: Verify and Audit the Completed Graph
Inspect the final Argument DAG to ensure it functions as a valid Directed Acyclic Graph. Audit Check:
- Are there circular dependencies? (e.g., A relies on B, which relies on A. If found, highlight this as a logical flaw in the paper).
- Do all paths successfully terminate at the End Arguments?

### Step 6: Write the Argument DAG as a Canvas
Write the audited Argument DAG as an Obsidian canvas, following [canvas-output.md](canvas-output.md).
