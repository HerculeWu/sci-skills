---
name: research-proposal
description: Turn a vague research idea into a proposal drawn from an Argument Library -- one layer of Conjectures, each hung on the Verification that would decide it, as an Obsidian canvas.
disable-model-invocation: false
---
# research-proposal
Turn a vague research idea into a proposal: an Obsidian canvas that adds one layer of **Conjectures** on top of an **Argument Library**, each hung on the **Verification** that would produce its Grounds. Research runs in rounds -- propose, implement, analyse, propose again, with collaborators in between. This skill writes the proposal of one round; implementing it and judging its outcomes belong to the user.

## Language
Terms in bold are defined in the sci-skills glossary, loaded at session start. If it is not in your context, read `${CLAUDE_PLUGIN_ROOT}/GLOSSARY.md` first.

Words this skill uses in its own sense:
- *goal*: the question the idea asks. A question, not a claim.
- *lever*: something concrete enough to look up in the library: what the idea changes, compares, explains or measures.
- *costly*: as the glossary defines it for a Verification. A costly Verification is where a commitment can be wasted.
- *shallow*: a Conjecture whose Warrant and other Grounds already stand; none of them is another Conjecture.
- *outlook*: work beyond this round, drawn without commitment, naming what it still lacks.

## Input
- The idea. It must name three things; ask for whichever is missing:
  - the goal;
  - the object of study: a class of objects ("tidal tails of star clusters") is enough, one object also works;
  - at least one lever.
- An Argument Library built by `build-argument-library`. Find it in the project; ask when you cannot.
- From round 2 on: the earlier rounds under the same `proposals/<name>/`, the outcomes the user reports with the files that hold them, and collaborators' comments in whatever form they come.

The project's own docs (`AGENTS.md`, README and the files they point to) say what code, compute and data are at hand.

## Output
- `proposals/<name>/round-N.canvas`: this round's proposal, one layer of Conjectures. Each round is a new file; earlier rounds stay as they are. Format: [canvas-output.md](canvas-output.md).
- `proposals/<name>/table.md`: the comparison table, one per goal, appended to every round. Format: [table.md](table.md).
- `<library dir>/shorts/<paper key>.md`: one **Short** per paper of the library. Format: [short.md](short.md).
- A reply, below.

Every file is written in English, whatever language the conversation is in, because later rounds and subagents read these files back. What the user said goes on the goal card in English too. Brief every subagent in English and ask for its report in English. Only the reply is in the user's language.

## What the proposal stands on
- **The work ends at the canvas.** Reading the project and the library is all the legwork this skill does; simulations, builds and ADS queries belong to the rounds the user runs after it.
- **The library is the literature.** The user chose which papers to trust. What the library lacks is either not done or not published, and neither changes the proposal. So every card on the canvas comes from the library or is the proposal's own, and "new" means "not in the library".
- **Outcomes are the user's to judge.** A Claim stays crisp: its limits go in the Qualifier, objections in the Rebuttal. The pull toward a hedged middle-ground Claim is what these two elements exist to absorb, and a hedged Claim can no longer be decided.

## Steps
Stop for the user at most three times: step 0 (only when Shorts are missing), step 1 and step 3. Each stop asks everything it needs at once.

The library canvas is read card by card through `${CLAUDE_PLUGIN_ROOT}/skills/build-argument-library/scripts/library.mjs`: `card <library.canvas> <paper:card>` prints one card, `uses <library.canvas> <paper:card>` lists every card that depends on it.

### 0. Shorts (only when some are missing)
**Goal**: every paper of the library has a Short, so that whether to open a paper for an element can be decided without opening its canvas.

- A Short is independent of the idea: written once, reused by every idea and every round.
- One subagent per paper writes it, from the paper's canvas and its full text where there is one ([short.md](short.md)).
- Writing Shorts is a large one-time cost, about 50k-80k tokens per paper on the sample library. Tell the user how many are missing and the rough cost, and write them once they agree.

### 1. Align
**Goal**: agree with the user on what the idea means before spending anything large.

- Read every Short, then state your reading: the goal as a question, the object, the levers, and the quantities to look at that you draw from the library. Mark the source of each: said by the user, drawn from the library, or inferred by you.
- Where the idea reads more than one way, set the readings side by side and ask. An idea that feels clear usually means you have already picked one reading.
- Ask only what only the user knows, all in one go; look up the rest yourself.
- Say roughly how many papers this reading would open, so the user can narrow the idea while it is cheap.
- From round 2 on, the user tells you whether each Conjecture held, failed or was not done, and where the results are. You read them as the user states them; speak up only where what you read disagrees with the criterion the card set in advance.
- The agreed reading goes on the goal card. In round 1, agree on `<name>` too.

### 2. Compare the idea with the library
**Goal**: for each element of the idea, the library's stance -- established, assumed, disputed or silent -- each backed by card ids.

- Choose from the Shorts which papers to open. One subagent per paper reads its whole canvas, and its full text where there is one, against the agreed checklist ([opening.md](opening.md)). One paper per context, because papers read together each get a thinner reading.
- Check two things against the full text: a "silent" before it is asserted, and support that is a reader's inference such as `(implicit)`. Without the full text, "silent" becomes "no card mentions it".
- "Silent" holds only for the papers opened; write its scope.
- A silence is an opportunity only on an element the idea names. Silences you notice elsewhere go in the reply as observations.
- Library edges come from citations and say little about relevance to the idea. Use them, through `uses`, to find what depends on a card.
- Structural signals (Audit Notes, `(implicit)`) are leads to look at, and stay leads.
- Record the results in the comparison table. From round 2 on, check papers new to the library against the existing elements, and open papers only for elements that are new.

### 3. Lay out the candidates
**Goal**: the user chooses which Verification groups this round commits to.

- A finding is worth proposing when it has a place in the graph and names the library cards it moves. There are three places: supporting or rebutting the goal (motivation), a Conjecture, and supporting or rebutting a Verification's design (benchmarks included).
- Group the candidates by Verification. For each group, state the arguments it moves, the commitment it needs, and the least it yields. Leave weighing them to the user: no scores, no ranking by importance.
- Ask in the same stop every question a candidate's viability depends on: what only the user knows, and facts about resources the project does not record.
- What costs nothing goes on the canvas without being chosen: motivation, discussion arguments that point out a conflict, benchmarks.
- From round 2 on, set out again the outlooks whose premises now hold, together with last round's unchosen candidates. Directions collaborators ruled out stay out.

### 4. Draw the canvas and write the table
**Goal**: a proposal that adds one layer of Conjectures, in which no large commitment is wasted outright.

The canvas has these properties:
- **The big ones first.** "What if it fails" is worked out for costly Verifications only; other Conjectures can be plain bets with no other side written.
- **Shallow.** Every costly Verification grounds at least one shallow Conjecture, with what holding and failing would each establish. Where that is impossible, mark the exception ⚠ and say why. A costly Verification that can only be designed once other results are in is outlook.
- **Decidable Claims.** Every Conjecture's Claim names what is measured, what it is compared with, and the direction. A Claim that cannot be written this way is not yet a Conjecture.
- **The design is an argument.** A costly Verification's design is supported from the library, and the library arguments against it are attached as `Rebuttal`, in plain view.
- **A yardstick.** A costly Verification's design includes the runs that produce its yardstick. The effect size is estimated where the library grounds it, and written "unknown" where it does not.
- **Numbers come from somewhere.** A choice in the design with no support is marked for the user to decide. Give the scale of a Verification and compare it with the limits the project states; the cost in hours is the user's to estimate.
- **Benchmarks first.** Where the library holds a comparable result, reproducing it is the preferred Conjecture on a costly Verification.
- **Direct.** Reach the goal directly where you can, and keep the graph as shallow as possible. Any round can bring in new Native Arguments.
- **"New" is relative to the library.** Write "not in the library", never "not in the literature".

Run `scripts/proposal.mjs check` (see [canvas-output.md](canvas-output.md)) until it passes.

## Reply
A guide to the canvas; the cards speak for themselves:
1. Where the canvas and the comparison table are.
2. For each costly Verification: the least this commitment yields, and which Verifications it depends on.
3. The ⚠ exceptions to shallow, and why.
4. Which papers were opened and which were not, and why.
5. The candidates not chosen.
6. Ideas judged not feasible, and why.
7. Silences outside the idea's elements, as observations.
8. Where the library may need extending: works outside the set named on the `Cites:` lines of the cards that the chosen candidates move.
9. Every item on the canvas left for the user to decide.
