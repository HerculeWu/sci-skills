# Keeping a long-running agent on course across sessions

Research for issue #19 (child of map #17). Question: what are the known, published practices for keeping a long-running LLM agent oriented across many sessions? That covers progress files, task lists, per-session orientation, one thing per session, clean handoffs, preventing a premature "done", and preventing the agent from going past the intended stopping point.

This is a list of facts with sources. It does not make design decisions for the map.

Sources were read on 2026-10-14. Only first-party Anthropic material was used: engineering blog posts, Claude Platform docs and Claude Code docs. Quotes are verbatim, and paraphrases are marked as such.

## Sources

| Key | Source | Date |
|---|---|---|
| [HARNESS] | Justin Young, [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), Anthropic Engineering | 2025-11-26 |
| [HARNESS2] | Prithvi Rajasekaran, [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps), Anthropic Engineering | 2026-03-24 |
| [CTX] | Rajasekaran, Dixon, Ryan, Hadfield, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), Anthropic Engineering | 2025-09-29 |
| [CCOMP] | Nicholas Carlini, [Building a C compiler with a team of parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler), Anthropic Engineering | 2026-02-05 |
| [MULTI] | [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), Anthropic Engineering | 2025-06-13 |
| [BEA] | Erik S. and Barry Zhang, [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents), Anthropic Engineering | 2024-12-19 |
| [PROMPT] | [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices), Claude Platform docs, section "Agentic systems" | current |
| [FABLE5] | [Prompting Claude Fable 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5), Claude Platform docs | current |
| [FABLE51] | [Prompting Claude Fable 5.1](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1), Claude Platform docs | current |
| [OPUS5] | [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5), Claude Platform docs | current |
| [SONNET55] | [Prompting Claude Sonnet 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5), Claude Platform docs | current |
| [MEM] | [Memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool), Claude Platform docs, including "Multisession software development pattern" | current |
| [CCBP] | [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices), Claude Code docs | current |
| [GOAL] | [Keep Claude working toward a goal (`/goal`)](https://code.claude.com/docs/en/goal), Claude Code docs | current |
| [HOOKS] | [Hooks reference](https://code.claude.com/docs/en/hooks), Claude Code docs (Stop and SessionStart) | current |

## 1. Failure modes the sources name

- **F1. No memory between sessions.** "each new session begins with no memory of what came before". The post compares this to engineers working shifts with no handoff. [HARNESS]
- **F2. Compaction alone is not enough.** Opus 4.5 running in a loop on the Agent SDK "will fall short of building a production-quality web app if it's only given a high-level prompt." [HARNESS]
- **F3. One-shotting.** The agent "tended to try to do too much at once" and often ran out of context mid-implementation, leaving a half-built feature for the next session. [HARNESS]
- **F4. Premature victory.** A later agent would "see that progress had been made, and declare the job done." [HARNESS]
- **F5. Untested completion.** Claude marked features complete after unit tests or `curl` checks, without confirming end-to-end behaviour. [HARNESS] Similarly: "it is easy to see tests pass and assume the job is done, when this is rarely the case." [CCOMP]
- **F6. Lenient self-evaluation.** Agents "reliably skew positive when grading their own work". Out of the box, "Claude is a poor QA agent": it found real issues and then talked itself into approving the work. [HARNESS2]
- **F7. Coherence loss and "context anxiety".** Models "tend to lose coherence on lengthy tasks as the context window fills", and some "begin wrapping up work prematurely" near a context limit they perceive. [HARNESS2] Newer models can still occasionally "suggest a new session, offer to summarize and hand off, or trim its own work", most often when the harness shows a token countdown. [FABLE5]
- **F8. Stopping on a promise.** Deep in a long session the model can end a turn with a statement of intent ("I'll now run X") without making the call, or ask permission for a step the request already covered. [FABLE5] [FABLE51]
- **F9. Overreach and unrequested scope.** Models can add steps nobody requested or apply their own view of what the task should be [OPUS5]. They can take unrequested actions, such as drafting an email or making defensive branch backups [FABLE5], or keep adding features, tests, docs, review rounds and refactors once the requested work is done [SONNET55] [FABLE51].
- **F10. Not knowing when to stop searching.** Agents kept "continuing when they already had sufficient results", and early versions spawned "50 subagents for simple queries". [MULTI]
- **F11. Time blindness and regressions.** Claude "will happily spend hours running tests instead of making progress". New features often broke existing ones until a CI gate was added. [CCOMP]
- **F12. Context pollution within a session.** "If you've corrected Claude more than twice on the same issue in one session, the context is cluttered with failed approaches." The "kitchen sink session" and "infinite exploration" are also listed as failure patterns. [CCBP]

## 2. State that lives outside the context window

- **F13. Three artifacts plus git.** [HARNESS] used:
  - a progress file, `claude-progress.txt`, holding a log of what agents have done;
  - a feature list in JSON;
  - an `init.sh` that starts the dev server;
  - git history.

  Paraphrase: a fresh session gets up to speed from the `claude-progress.txt` file "alongside the git history". [HARNESS]
- **F14. Feature list format.** The initializer expanded the user's prompt into more than 200 features. Each has `category`, `description`, `steps` (end-to-end test steps) and `passes`, and every `passes` starts as `false`. Coding agents may edit the file "only by changing the status of a passes field", under a strongly worded rule: "It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality." [HARNESS]
- **F15. JSON for status, prose for notes.** JSON was chosen because "the model is less likely to inappropriately change or overwrite JSON files compared to Markdown files." [HARNESS] The docs say the same in general form:
  - "Use structured formats for state data", such as test results and task status;
  - "Use unstructured text for progress notes";
  - "Use git for state tracking … Claude's latest models perform especially well in using git to track state across multiple sessions." [PROMPT]

  The docs' example pairs a `tests.json` (id, name, status of `passing`/`failing`/`not_started`, plus totals) with a `progress.txt`. That progress file has a "Session 3 progress" entry listing what was done, a "Next:" line, and a reminder not to remove tests. [PROMPT]
- **F16. Agentic memory and note-taking.** "Structured note-taking, or agentic memory, is a technique where the agent regularly writes notes persisted to memory outside of the context window." Examples are a to-do list or a `NOTES.md`. In the Pokémon example, the agent records progress toward a target ("…8 levels toward the target of 10") and reads its notes after context resets. Note-taking "excels for iterative development with clear milestones". [CTX]
- **F17. Plan persisted to memory.** The research lead agent starts by saving its plan to memory, because context past 200,000 tokens gets truncated. Agents "summarize completed work phases and store essential information in external memory before proceeding to new tasks". [MULTI]
- **F18. Running READMEs and failed-approach logs.** Fresh-container agents kept "extensive READMEs and progress files" updated with current status. When stuck, they kept a running doc of failed approaches and remaining tasks. [CCOMP]
- **F19. Memory tool protocol.** When the memory tool is enabled, the API injects this instruction: "ALWAYS VIEW YOUR MEMORY DIRECTORY BEFORE DOING ANYTHING ELSE … As you make progress, record status / progress / thoughts etc in your memory. ASSUME INTERRUPTION: Your context window might be reset at any moment, so you risk losing any progress that is not recorded in your memory directory." [MEM]
- **F20. Files loaded every session.** CLAUDE.md "is a special file that Claude reads at the start of every conversation". It should stay short: "Bloated CLAUDE.md files cause Claude to ignore your actual instructions!" Knowledge needed only some of the time belongs in skills, which load on demand. [CCBP] A SessionStart hook can inject context at startup, resume, `/clear` or compaction (`additionalContext`, or plain stdout), "like existing issues or recent changes". [HOOKS]

## 3. A separate first session

- **F21. Initializer vs coding agent.** The first session uses a different prompt. It sets up `init.sh`, the progress file, the feature list and an initial git commit. "Every subsequent session asks the model to make incremental progress, then leave structured updates." The two differ only in their initial user prompt: system prompt, tools and harness were the same. [HARNESS]
- **F22. Same pattern in the docs.** "Use a different prompt for the very first context window: Use the first context window to set up a framework (write tests, create setup scripts), then use future context windows to iterate on a todo-list." [PROMPT]

  [MEM] describes three steps:
  1. An initializer session sets up a progress log ("what has been done and what comes next"), a feature checklist ("defining the scope of work") and a pointer to any startup script.
  2. Each later session "opens by reading those memory files".
  3. Before a session ends, it updates the progress log with what was completed and what remains.

  [MEM] says to set these files up "deliberately instead of writing them ad hoc".
- **F23. Specs written to disk, then a fresh session.** For larger work, have Claude interview the user and write a spec, then "start a fresh session to execute it". "The most useful specs are self-contained: they name the files and interfaces involved, state what is out of scope, and end with an end-to-end verification step". [CCBP]

## 4. Orientation at the start of each session

- **F24. The getting-up-to-speed steps** in [HARNESS]:
  1. "Run `pwd` to see the directory you're working in. You'll only be able to edit files in this directory."
  2. "Read the git logs and progress files to get up to speed on what was recently worked on."
  3. "Read the features list file and choose the highest-priority feature that's not yet done to work on."

  The agent then starts the dev server and runs a basic end-to-end test, so it finds and fixes a broken state left by the last session before starting anything new. The post's sample session runs `pwd`, reads the progress file and feature list, runs `git log --oneline -20`, starts the server and tests basic functionality. [HARNESS]
- **F25. Be prescriptive about how a fresh window starts.** The docs give example instructions [PROMPT]:
  - "Call pwd; you can only read and write files in this directory."
  - "Review progress.txt, tests.json, and the git logs."
  - "Manually run through a fundamental integration test before moving on to implementing new features."

  The same section adds: "Claude's latest models are extremely effective at discovering state from the local filesystem." [PROMPT]
- **F26. A fresh window over compaction.** When a context is cleared, "consider starting with a brand new context window rather than using compaction". [PROMPT] A context reset "provides a clean slate", but the handoff artifact has to carry enough state for the next agent to continue. With compaction, "context anxiety can still persist". [HARNESS2] Later, Opus 4.5 "largely removed" context anxiety, so that harness dropped resets for one continuous session with automatic compaction. [HARNESS2]
- **F27. What a compaction or handoff summary should keep.** The client-side compaction instruction in [FABLE51] asks for six things:
  1. difficulties and how they were handled;
  2. options raised, tried or set aside, and why;
  3. anything "asked for, decided, agreed, ruled out, or established as a preference, constraint, or boundary — stated exactly";
  4. "exactly where things stand now";
  5. anything "still open, unresolved, promised, or expected to happen next";
  6. hard-to-reconstruct details, kept exactly.

  It also says to keep the user's words close to verbatim and condense the agent's own reasoning. [FABLE51]

## 5. One thing at a time, and a clean handoff

- **F28. One feature at a time.** The coding agent works on "only one feature at a time". The post calls this incremental approach "critical" to stopping the agent from doing too much at once. [HARNESS] The docs describe the same behaviour: Claude "maintains orientation across extended sessions by focusing on incremental progress, making steady advances on a few things at a time rather than attempting everything at once". They also advise: "Explicitly ask Claude to keep track of its progress and focus on incremental work." [PROMPT]
- **F29. A clean state at the end of each session.** Each session should leave code "appropriate for merging to a main branch": no major bugs, "orderly and well-documented", so the next session can start a new feature without first cleaning up. Each session ends with a git commit with a descriptive message and a progress-file update. Git also lets the agent "revert bad code changes". [HARNESS]
- **F30. Don't run out of context with work unsaved.** Example prompt: "it may be beneficial to plan out your work clearly … just make sure you don't run out of context with significant uncommitted work." [PROMPT] For harnesses that compact: "As you approach your token budget limit, save your current progress and state to memory before the context window refreshes." [PROMPT]
- **F31. Mark complete only after end-to-end verification.** The memory-tool pattern states its key principle: "Work on one feature at a time. Mark a feature complete only after end-to-end verification confirms it works, not when the code is written. This keeps the progress log accurate from session to session." [MEM]
- **F32. Split the task into units with clear boundaries.** Parallel agents claimed tasks by writing a lock file to `current_tasks/`. When every agent hit the same bug, the work was re-split, using GCC as an oracle so agents could work on different failures. [CCOMP] Subagent tasks need "an objective, an output format" and clear boundaries. Without them, agents "duplicate work, leave gaps, or fail to find necessary information". [MULTI]

## 6. Preventing a premature "done"

- **F33. A fixed list of everything that has to pass.** The [HARNESS] failure table maps fixes to problems:

  | Problem | Initializer fix | Coding agent fix |
  |---|---|---|
  | Declares victory too early | Writes the full feature list | Reads the list and picks one feature |
  | Marks features done prematurely | Writes the feature list | Self-verifies and sets `passes` only "after careful testing" |
  | Leaves bugs or undocumented progress | Sets up a git repo and progress notes | Reads notes and logs, runs a basic test, ends with a commit and a progress update |

  [HARNESS]
- **F34. Give the agent a check it can run.** "Claude stops when the work looks done. Without a check it can run, 'looks done' is the only signal available, and you become the verification loop." Have Claude "show evidence rather than asserting success: the test output, the command it ran and what it returned, or a screenshot". [CCBP] Explicitly prompting Claude to use browser automation and test "as a human user would" improved end-to-end verification "dramatically". [HARNESS]
- **F35. The verifier must be strong.** "the task verifier is nearly perfect, otherwise Claude will solve the wrong problem." [CCOMP] Agents need "ground truth" from the environment at each step to judge progress. [BEA]
- **F36. Ground progress claims in tool results.** "Before reporting progress, audit each claim against a tool result from this session. Only report work you can point to evidence for; if something is not yet verified, say so explicitly." In Anthropic's testing, this "nearly eliminated fabricated status reports". [FABLE5]
- **F37. Separate the grader from the worker.** A separate evaluator agent tests the running app against criteria with hard thresholds. A sprint fails if any criterion falls below its threshold. [HARNESS2] "Separate, fresh-context verifier subagents tend to outperform self-critique." [FABLE5] Before treating a task as done, a reviewer subagent can check the diff against the plan in a fresh context. It should be told to flag only gaps that affect correctness or the stated requirements, because a reviewer asked to find gaps "will usually report some, even when the work is sound". [CCBP]
- **F38. Agree "done" before the work starts.** In the "sprint contract", the generator proposes what it will build and how success will be verified. The evaluator reviews the proposal, and they iterate "until they agreed". Contracts were granular: one sprint had 27 criteria. [HARNESS2]
- **F39. Mechanical gates on stopping in Claude Code.**
  - `/goal <condition>`: after every turn, a separate model checks the condition against the conversation. Verdicts are "not yet met" (keep working), "met" or "impossible". Good conditions have "one measurable end state", "a stated check", and "constraints that matter", such as what must not change. The evaluator "doesn't run commands or read files independently", so the condition must be provable from Claude's own output. A turn or time cap can be written into the condition. [GOAL]
  - A Stop hook can block the turn from ending (`"decision": "block"` with a reason) until a script's check passes. [HOOKS] [CCBP]
- **F40. Model-version note.** Opus 5 verifies its own work unprompted. On that model, explicit verification instructions "cause over-verification" and the docs say to remove them. [OPUS5] Verification instructions are therefore model-dependent (see F48).

## 7. Preventing the agent from going past the intended stopping point

- **F41. Name the scope as the deliverable.** "The user's request — or the plan they approved — sets the scope, and the scope is the deliverable: don't quietly narrow, widen, or swap it." Something else worth doing "is a suggestion to make at the end, not a change to make". [FABLE51] Also: "Deliver what was asked, at the scope intended … Finish the whole task, and stop short of actions that are clearly beyond what was asked." [OPUS5]
- **F42. Stop and report once the asked work is done and checked.** "When the work the user asked for is done and checked, stop and report. Don't add features, tests, files, docs or refactors that weren't asked for. If you think one would help, mention it at the end instead of doing it." [SONNET55] A variant also stops self-started review rounds; in testing it cut session cost by about a third with no change in quality. [SONNET55]
- **F43. Assessment-only requests end at the assessment.** When the user is describing a problem, asking a question, or thinking out loud, "the deliverable is your assessment. Report your findings and stop. Don't apply a fix until they ask for one." [FABLE5] [FABLE51] Similarly: "When the user asks for ideas, options or a plan, give them that and stop." [SONNET55]
- **F44. Define when to pause for the user.** "Pause for the user only when the work genuinely requires them: a destructive or irreversible action, a real scope change, or input that only they can provide. If you hit one of these, ask and end the turn, rather than ending on a promise." [FABLE5] The autonomous-run prompt ends: "End your turn only when the task is complete or you are blocked on input only the user can provide." [FABLE51] For partly blocked work: "complete every other part in full and say exactly what you left out and why — the whole task is the deliverable, and scaling it down is the user's call". [FABLE51]
- **F45. Stopping conditions and effort budgets.** Add "stopping conditions (such as a maximum number of iterations) to maintain control". Agents "can then pause for human feedback at checkpoints or when encountering blockers". [BEA] The research system wrote explicit effort-scaling rules into its prompts, such as "Simple fact-finding requires just 1 agent with 3-10 tool calls". [MULTI]
- **F46. Constrain deliverables, not paths.** The planner should "constrain the agents on the deliverables to be produced and let them figure out the path", and stay at product level rather than detailed implementation, so that spec errors do not cascade. Without the planner, "the generator under-scoped". [HARNESS2]
- **F47. A re-grounding handoff message.** For a reader who was not watching: "your final message is their first look at any of it. Write it as a re-grounding, not a continuation of your working thread: the outcome first, then the one or two things you need from them, each explained as if new." [FABLE5]

## 8. Caveats in the sources themselves

- **F48. Harness components depend on the model version.** "every component in a harness encodes an assumption about what the model can't do on its own". With Opus 4.6 the sprint construct was removed entirely; the planner and a single end-of-run evaluator were kept. [HARNESS2] "Skills developed for prior models are often too prescriptive for Claude Fable 5 and can degrade output quality." [FABLE5] The docs advise starting minimal and adding instructions only from observed failures [CTX], and to "do the simplest thing that works". [CTX] [HARNESS2]
- **F49. The domain was web apps, and generalisation is untested.** [HARNESS] says its demo "is optimized for full-stack web app development". As future work, the post asks whether the lessons transfer to other long-running tasks, naming work "required in, for example, scientific research or financial modeling". None of the sources reports testing these patterns on scientific research.
- **F50. Single vs multi-agent is open.** "It's still unclear whether a single, general-purpose coding agent performs best across contexts" or whether specialised agents (testing, QA, cleanup) do better. [HARNESS]
- **F51. Inconsistency in [HARNESS].** Its sample session reads `tests.json`, while the rest of the post uses the feature-list JSON. The post does not explain the difference.

## Map concerns and the findings that bear on them

This is an index, not a recommendation.

| Concern in map #17 | Findings |
|---|---|
| Each session knows which proposal is current, what this round must do, and how far it has got | F13–F20, F22, F24–F27 |
| Keep pushing toward the round's goal and don't sink into local problems | F3, F11, F12, F28, F32, F45, F46 |
| Work that spans waits (allocations, runs) across sessions | F1, F21–F22, F26, F29–F31 |
| Don't declare the round done prematurely | F4–F6, F31, F33–F39 |
| Stop at the handoff, with no new Conjectures and no outlook | F9, F41–F44, F47 |
| Missing method gets reported as Needs ✗ rather than invented | F44 (pause for input only the user can provide; complete the rest and say what was left out) |
| Keep the first SKILL.md minimal | F20, F48 |

## Not found

- No first-party source describes a status vocabulary for research outcomes, for example a Claim confirmed or refuted against a pre-stated criterion. The closest analogues are the `passes` boolean [HARNESS] and `passing`/`failing`/`not_started` [PROMPT].
- No first-party source covers sessions separated by long external waits, such as HPC queues. The `/goal` docs cover background work inside one session: evaluation is deferred while a subagent or background shell runs, with check-ins after 30 minutes. [GOAL]
