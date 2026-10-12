---
name: read-a-paper
description: Read and understand a paper, and write its argument structure as an Obsidian canvas. Use when the user wants a detailed logical breakdown of a paper -- "explain paper X", "introduce paper X in details"
---
# read-a-paper
Break down a research paper into a network of interconnected arguments using the **Toulmin Model of Argumentation** as a foundation. By formalizing text into a Directed Acyclic Graph (DAG) structure --- **Argument DAG**, you can bypass rhetorical filler and directly see a paper's logical integrity

## Languages
- **Toulmin model of argumentation**: The Toulmin Model of Argumentation is a structured framework for analyzing and building thoroughly reasoned arguments. In Toulmin model, an argument consists of up to six elements:
  - **Claim**: The conclusion or statement that the author wants the reader to accept.
  - **Grounds**: The evidence, facts, or inputs that support the Claim.
  - **Warrant**: The underlying logic, rule, or principle that explains why the Grounds legitimately lead to the Claim.
  - **Backing**: Additional evidence or credentials used to prove that the Warrant itself is reliable and valid.
  - **Qualifier**: Words or constraints that limit the scope or certainty of the Claim (e.g., "under high pressure conditions," "typically").
  - **Rebuttal**: Acknowledged exceptions or conditions under which the Claim becomes invalid.
- **Argument DAG**: When arguments connect to each other, we can treat each argument as a node on a DAG. For example, the Claim outputted by Argument A might serve as the Grounds or the Warrant for Argument B. 
- **Native Argument**: A Native Argument is a foundational argument whose validity does not rely on any calculations, experiments, or proofs generated within the current paper. Its Grounds, Warrants, or Backings consist entirely of external elements: peer-reviewed citations, established baseline datasets, mathematical ansatzes, laws of physics, or standard domain knowledge.
- **End Argument**: An End Argument is a destination argument representing the ultimate objective of the paper. It delivers the primary contributions, novel frameworks, or definitive conclusions promised in the abstract or introduction. No other arguments inside the paper depend on it. Once you reach the End Arguments, the structural purpose of the paper is fulfilled.

## Notes of Languages
- An argument cannot stand without Claim, Grounds and Warrant. To adapt to practical situations and address counterarguments, Backing, Qualifier and Rebuttal are added.
- Every argument you record has a Claim, Grounds and a Warrant. When the paper leaves the Warrant unstated, write the one you infer and mark it `(implicit)`.
- Native Argument and End Argument are special type of an Argument. An End Argument can not serve as Grounds, Warrant, Backing or Rebuttal of any other Argument.

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
