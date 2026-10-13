# Sci-skills glossary
The vocabulary of the sci-skills plugin. These meanings apply when working with its skills; elsewhere the words keep their ordinary sense.

## Language
### Argumentation
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
- **Argument Library**: The Argument DAGs of a set of papers joined into one graph along the citations between them. Where an argument of one paper cites another paper of the set, the cited paper's argument feeds it as Grounds, Warrant, Backing or Rebuttal.

## Relationships
- An argument cannot stand without Claim, Grounds and Warrant. To adapt to practical situations and address counterarguments, Backing, Qualifier and Rebuttal are added.
- Native Argument and End Argument are special type of an Argument. An End Argument can not serve as Grounds, Warrant, Backing or Rebuttal of any other Argument in the same paper; in an Argument Library it can serve an argument of another paper.

## Flagged ambiguities
- **Claim**, **Grounds**, **Warrant**, **Backing**, **Qualifier** and **Rebuttal** are common English words. They name a Toulmin element only when capitalized.
