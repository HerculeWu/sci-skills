---
name: implement-proposal
description: Carry out one Round of a proposal written by research-proposal, across many sessions -- produce the Grounds its Verifications promise, set each result against its criterion, and record the user's judgements in a progress file next to the canvas.
disable-model-invocation: true
---
# implement-proposal
Carry out one **Round** of a proposal: produce the Grounds that the Verifications on `round-N.canvas` promise, hand each Conjecture's result to the user set against its criterion, and record the user's judgement. A round spans many sessions -- allocations, runs that take days, Needs ✗ to settle -- so this skill runs once at the start of each session: orient, agree on what this session does, carry it to a pause point, record it.

## Language
Terms in bold are defined in the sci-skills glossary, loaded at session start. If it is not in your context, read `${CLAUDE_PLUGIN_ROOT}/GLOSSARY.md` first.

Words this skill uses in its own sense:
- *costly* / *cheap*: as the glossary defines them for a Verification.
- *source*: where the current state of something waited on lives, such as `sims/<task>/status.json` or a `report.json`. The record points at sources and never copies them.
- *go*: the user's word, said in the conversation, to commit resources to a costly Verification.
- *pause point*: a Verification starts waiting on the user, on a machine or on another Verification, or is done.
- *handed over*: every Conjecture of the round is judged held, failed or not done.

## Input
- Optional: `<name>`, and an instruction such as "do V4".
- `proposals/<name>/round-N.canvas`, written by `research-proposal`.
- `proposals/<name>/round-N.progress.md`, from the second session of a round on.
- The project's own docs: `AGENTS.md` and the skills and files it points to. They say how each Verification is done.
- The sources the record points at.

## Output
- `proposals/<name>/round-N.progress.md`: the round's progress record. Format: [progress-format.md](progress-format.md).
- What the Verifications produce, where and how the project's docs say: run specs, analysis code and results, figures, decisions in `notes/`.
- A reply, below.

The canvas and `table.md` belong to `research-proposal`; this skill reads them as they are. The record is written in English, whatever language the conversation is in, because later sessions and `research-proposal` read it back. Only the reply is in the user's language.

## What the work stands on
- **Outcomes are the user's to judge.** You set each result against the criterion its card wrote in advance and record what the user says. A Claim stays decidable only while nobody softens it after the fact.
- **The method belongs to the project.** Each Verification is done the way the project's docs say. Where the project has no way to do something, that is a Needs ✗ for the user, settled by the user.
- **This round only.** The scope is every Verification card on the latest canvas, costly and cheap; outlook is not in it. The work ends at handing over: the next proposal is `research-proposal`'s.
- **The user's time and the machine's time are the scarcest.** Every choice of what comes first follows from this.
- **State lives outside the context.** Each session reads the record and the sources afresh; where they disagree with what the last session left, say so.

## Work
Every session: orient, agree on what to do, carry one Verification to a pause point, record it and report. Results go to the user as they arrive; the round closes when the last judgement is in.

`scripts/progress.mjs` (see [progress-format.md](progress-format.md)) does what must come out the same every session: finding the round, creating the record, aligning it with the canvas, fingerprints, checking the format.

### Orient
**Goal**: you know which round of which `<name>` this session serves, where every card stands, and what waits on the user.

- With `<name>` given, use it. Otherwise `status` lists the candidates: a `<name>` whose latest round is not handed over, including one never started. One candidate: take it. Several: ask. None: tell the user the next step is `research-proposal`, and stop.
- Only the highest N counts. Once `round-N.canvas` exists, earlier records are read-only.
- No record yet: `init` creates it. For each carried-over Conjecture it matched, add the results and what it was waiting on from the earlier record; for each it could not match, ask the user.
- Every session, `align` the record with the canvas. Add new cards. Remove a gone card that has no progress, with a Log line. A card with progress that is gone or changed goes to the user to decide.
- Read each source the record points at. The last Log line's `Next:` is a lead; the source is the state.
- Where the user edited the record, the file wins; report what differs from what the last session left, and run `check`.

### Agree on what this session does
**Goal**: the user has confirmed the one thing this session moves forward.

- Propose it with one line of reason. When the user came with an instruction, follow it.
- What comes first, from the scarcity of the user's and the machine's time:
  1. While the user is here, everything waiting on the user, all at once (the opening reply below).
  2. Long waits that block other Verifications start early.
  3. While waiting, cheap work that needs nothing upstream.
- The user is present in every session. Unattended polling belongs to the project's own loop.
- When nothing can move, report what each card waits on and where its pointer leads, write the Log line, and end the session.

### Carry one Verification to a pause point
**Goal**: the agreed Verification reaches its next pause point, and the record says where it stands.

- **One at a time.** At the pause point, update the record, write the Log line, report, and propose the next thing. Start it when the user says to.
- **Dependencies come from the cards.** Read them from the canvas's Needs and Design. A Verification that needs another's output is `waiting · on: Vk (…)`; the parts that need nothing upstream can go ahead. Whether to wait for a Conjecture before starting a Verification weighs whether it is worth doing, so it is the user's decision.
- **A costly Verification commits resources only after**: every item of **For the user to decide** is Decided; every Needs ✗ is settled or accepted by the user; and the user gave go, recorded under **Decided**. Preparation -- run specs, analysis code -- can come first. Where the project has its own gate (nbody-simops' `confirmed` / `go`), the user's one sentence serves both. A cheap Verification needs no go, but its For-the-user items are still the user's.
- **Every step names its card.** Do a thing when you can say which part of which Verification card of this round it moves: the Design, a Needs line, or a fact a For-the-user item depends on. Anything else is one `Observed:` line in the Log.
- **A Needs ✗ is laid out, then left to the user**: what is missing, which routes the project offers (with paths), which it lacks, roughly what each costs. The user chooses: settle it (which route), accept it, or drop the Verification for this round. Work much larger than the card describes, such as a convergence test, is handled the same way.
- **The Design is the user's.** A gap in it on an implementation detail that leaves "what is compared, and how" untouched, you fill and record under Deviations as `agent: Design silent on X; chose Y`. Where the work would contradict the Design's text, or the Design cannot be done, set the Verification to `waiting · on: user — …`, report the facts and the options (change the design, accept the departure, drop), and record the user's choice under Deviations.
- **Stop** when you cannot name the card the next step moves, or when the next step touches something outside the project (a plugin, a fork, the HPC configuration) or makes a decision the Design left to the user. Stop, record, report.
- Bugs in analysis code you wrote are yours to fix. A crashed run goes through the project's own repair route.
- When the user asks for work outside the round, say once that it is not on this round's canvas, then do it. Record it only as an `outside round:` Log line.

### Hand over results
**Goal**: each Conjecture's result reaches the user beside its criterion, and the user's judgement is recorded in the user's words.

- A Conjecture becomes `result in` as soon as its Grounds exist, before the rest of its Verification is done. Benchmarks decide how later results are read, so they go to the user first.
- The **Result** line reads the measured value against the criterion's letter (`refuting condition: met` / `not met` / `cannot be read`, see [progress-format.md](progress-format.md)). Reading a number against a condition written in advance is reading; judging the Conjecture also weighs whether the result can be trusted, the Deviations and the accepted ✗, and that stays with the user.
- Where a card says a result is read only after another Conjecture is judged, hand it over anyway with that line quoted. Whether to read it is the user's choice.
- When a Verification is dropped, its Conjectures become `not done` only when the user says so; ask in the same breath.
- Until the next round's canvas exists, the user may come back and change a judgement.

### Close the round
**Goal**: the round is handed over and the record is ready to be `research-proposal`'s next input.

- When the user ends the round early, list the Conjectures and Verifications still open and ask once: "Record the rest as not done, and the unfinished Verifications as dropped?" Record the user's one sentence on each. Conjectures already `result in` get their own judgement. Runs still going are reported and left running.
- When the last judgement is in, write the Log line `round handed over`, give the closing reply below, and stop.

## Reply
A guide to the record; the record and the canvas speak for themselves.

**At the start of a session**: where each card stands, a line each, then **Waiting on you**: everything waiting on the user in one block, ordered by what an answer unblocks:
1. decisions holding a costly Verification: For-the-user items, Needs ✗, go;
2. judgements other work depends on: benchmarks, conditional dependencies;
3. the other `result in` Conjectures, three lines each: the id with its Claim in a sentence, the Result line, the file.

The user may answer any part; what stays unanswered comes back next session. Close with what you propose to do this session, and why.

**At a pause point**: what was done, where it stopped, what it waits on (the pointer), and the next thing you propose.

**When the round is handed over**:
1. A table: each Conjecture, the user's judgement, the user's words in one line.
2. The limits the next round should know: Deviations and accepted ✗, pointing to their cards.
3. The Log's `Observed:` and `outside round:` lines, as two lists, verbatim with their dates. Whether any of them goes into the next round is the user's call, raised in `research-proposal`.
4. The next step: `research-proposal` on `proposals/<name>/`; `round-N.progress.md` is the outcomes with the files that hold them. When the outcomes are enough for a paper, the next step is `build-paper-argument` instead.
