# sci-skills

[English](#english) | [中文](#中文)

A Claude Code plugin with skills for scientific work: find papers, read one paper into a graph of its arguments, join a set of papers into one graph along their citations, draw a research proposal from that graph, carry it out round by round, and build the argument of the paper that reports it.

### Skills

| Skill | What it does | How it starts |
|---|---|---|
| `find-papers` | Builds a ranked reading list on a topic from NASA ADS | Claude picks it up when you ask for papers on a topic |
| `read-a-paper` | Breaks one paper down into an Argument DAG, written as an Obsidian canvas | Claude picks it up when you ask for a detailed breakdown of a paper |
| `build-argument-library` | Reads a set of papers and joins their Argument DAGs along the citations between them into one Obsidian canvas | Only when you call `/sci-skills:build-argument-library` |
| `research-proposal` | Turns a vague research idea into a proposal drawn from an Argument Library: one layer of Conjectures, each with the Verification that would decide it, as an Obsidian canvas | Only when you call `/sci-skills:research-proposal` |
| `implement-proposal` | Carries out one round of a proposal across many sessions: produces the Grounds its Verifications promise, sets each result against its criterion, and records your judgements in a progress file | Only when you call `/sci-skills:implement-proposal` |
| `build-paper-argument` | Builds the Argument DAG of the paper that reports your judged rounds, as an Obsidian canvas you review before any text is written | Only when you call `/sci-skills:build-paper-argument` |
| `calibrate-to-library` | Measures how the papers of an Argument Library are written (what each section's paragraphs do, in what order and proportion, the register of their sentences) and leaves the counts, a map of the library's paragraphs by kind, and measuring tools for writing a paper in that field | Only when you call `/sci-skills:calibrate-to-library` |

#### find-papers

Ask for something like *"find 10–15 papers on tidal tails, starting from a few that Pavel Kroupa co-authored"*. Claude searches ADS for seed papers that match your constraints (topic, author, year), expands from them with the ADS `similar` and `useful` operators, then reads the abstracts to rank and trim the list.

- The reply is a table of title, authors, year, bibcode, and how each paper was found.
- Every paper in the list comes from ADS in that session. Nothing is added from memory.
- It is read-only: it writes no files and downloads no full texts.

#### read-a-paper

Give Claude a paper and ask it to explain the paper in detail. It reads the paper with the Toulmin model of argumentation: each argument is recorded as a Claim with its Grounds and Warrant, plus Backing, Qualifier and Rebuttal where the paper gives them. The arguments are linked bottom-up, from the ones that rest only on outside knowledge to the paper's main conclusions.

The result is an Obsidian canvas:

- One card per argument, with a `Source:` line saying where in the paper it comes from and a `Cites:` line for each publication it rests on.
- One identity card with the paper's title, authors, year and identifier.
- Edges labelled `Grounds`, `Warrant`, `Backing` or `Rebuttal`, saying how one argument's Claim is used by the next.
- Audit Notes on cards where the logic has a problem: a circular dependency, or an argument that leads to none of the paper's conclusions.

#### build-argument-library

Call `/sci-skills:build-argument-library` and tell Claude which papers to use and where their full texts are. Each paper is read by its own subagent with `read-a-paper`. Claude then follows the citations between the papers: where an argument in paper A cites paper B, it finds the argument in B that A relies on and links the two.

The result is one Obsidian canvas, rebuilt whole on every run:

- Each paper is a group holding its full Argument DAG. A paper sits above the papers it cites.
- Links between papers are purple edges with the same four labels.
- Audit Notes (red cards) mark citations that do not hold up: the cited paper has no argument that makes the Claim, or the citing paper states it more strongly than the cited paper argued.
- Links come from citations only. Papers the set cites but does not contain are counted in the reply as candidates for extending the set.

#### research-proposal

Call `/sci-skills:research-proposal` with a vague idea that names a goal (a question), an object of study (a class of objects is enough) and at least one lever: something you want to change, compare, explain or measure. Claude works from an Argument Library you built with `build-argument-library`, and from nothing outside it: the library is the set of papers you chose to trust.

A run stops for you at most three times:

- the first time it uses a library, before writing a Short for each paper (a one-page summary, written once and reused), with the cost;
- to agree on what the idea means, with its readings set side by side and the number of papers it would open;
- to let you choose which Verifications to commit to, grouped by what each would move and what it needs.

In between, one subagent per relevant paper reads the paper against the idea and reports where it stands on each element: established, assumed, disputed or silent, with card ids.

The result goes under `proposals/<name>/`:

- `round-N.canvas`: one layer of Conjectures on top of the library. Each Conjecture has a decidable Claim and hangs on the Verification that would decide it. Every costly Verification carries at least one shallow Conjecture that says what holding and failing would each establish. Choices the library does not support are left for you to decide.
- `table.md`: a comparison table of papers against the idea's elements, with the papers opened and the candidates laid out, kept across rounds.

The skill only proposes: it runs no simulation and queries no database. After you have done the work, call it again with the outcomes for the next round. A new canvas is written each round; whether a Conjecture held is yours to say.

#### implement-proposal

Call `/sci-skills:implement-proposal` at the start of each working session on a round, optionally with the proposal's `<name>` and what you want done ("do V4"). A round takes many sessions -- allocations, runs that take days, missing pieces to settle -- so each session starts by reading where things stand, proposes one thing to move forward, carries it to a pause point, and records it.

- How each Verification is done comes from your project's own docs (`AGENTS.md` and what it points to). Where the project has no way to do something, Claude lays out the options and leaves the choice to you; it does not invent a procedure or change anything outside the project.
- Nothing costly starts before the choices the canvas left to you are made and you say go.
- Each result is set against the criterion its Conjecture wrote in advance. Whether the Conjecture held, failed or was not done is yours to say; Claude records your words.
- Progress lives in `proposals/<name>/round-N.progress.md`, next to the canvas, one section per card. You can read and edit it in Obsidian.

When every Conjecture is judged, the round is handed over: a summary of your judgements, the limits the next round should know, and the ideas noted along the way. The progress file is what `research-proposal` takes as the round's outcomes.

#### build-paper-argument

Call `/sci-skills:build-paper-argument` when the rounds you have judged are enough for a paper. Claude reads the progress files of the proposals you name and builds the paper's own Argument DAG under `papers/<paper>/argument.canvas`.

- Only Conjectures you judged held make Claims. A failed one enters only as a Qualifier or Rebuttal of a held one, or stays out. Measurements made without a criterion fixed in advance enter as results marked "Not a Conjecture".
- Every number on a card names the judgement, file or library card it comes from.
- Before building the chains, it stops for you to decide the End Arguments: which one is main, the one sentence each leaves in the abstract and the conclusions, and who reads the paper for it. It stops again when the canvas passes its check, for you to review it.
- Run it again after further rounds: it brings in the new judgements and leaves your own edits to the canvas alone.

#### calibrate-to-library

Call `/sci-skills:calibrate-to-library` once per Argument Library, with the papers' full texts in place. It works out how the field writes, so that a paper written later reads as the field's own.

- It first reads the Shorts and several full texts, then proposes, each with its reason: groups of papers written alike, a vocabulary of paragraph kinds per section, the measures of sentence style worth taking, and the cost. You decide before anything large runs. An earlier calibration ships as a worked example; the agent borrows from it only where it fits your field.
- One subagent per paper labels its paragraphs. The agent writes the scripts that split papers and measure style for your library, and checks each against a sample it reads by hand.
- The result goes under `<library dir>/writing/`: a section guide in counts, the labels, a map from each kind of paragraph to the library paragraphs that do it, the style ranges per group, and the tools.

A typical path through the skills: use `find-papers` to get a reading list, obtain the full texts yourself, run `build-argument-library` on them, then `research-proposal` with your idea, `implement-proposal` for the round you chose, and `research-proposal` again with its outcomes. When the outcomes are enough for a paper, `build-paper-argument` drafts its argument.

### Glossary

`GLOSSARY.md` defines the terms the skills share (Toulmin model, Argument DAG, Native Argument, End Argument, Argument Library, Conjecture, Verification, Round, Short, End rank). The plugin's hooks load it into every session and every subagent.

### Install

In Claude Code:

```
/plugin marketplace add HerculeWu/sci-skills
/plugin install sci-skills@sci-skills
```

### Requirements

- Node 18 or later, for the scripts.
- `jq`, used by the hook that loads the glossary into subagents.
- An ADS API token in `~/.ads/dev_key`, for `find-papers`. Get one from your [ADS account settings](https://ui.adsabs.harvard.edu/user/settings/token).
- [Obsidian](https://obsidian.md), to open the `.canvas` files.
- For `research-proposal`: an Argument Library built by `build-argument-library`, ideally with the papers' full texts next to it.
- For `implement-proposal`: a canvas written by `research-proposal`, and project docs that say how its Verifications are done.
- For `build-paper-argument`: at least one round handed over by `implement-proposal`, and the Argument Library.
- For `calibrate-to-library`: an Argument Library with its papers' full texts as markdown.

### Development

`AGENTS.md` holds the principles the skills are built on. The scripts have unit tests:

```bash
node --test skills/find-papers/scripts/ads.test.mjs skills/build-argument-library/scripts/library.test.mjs skills/research-proposal/scripts/proposal.test.mjs skills/implement-proposal/scripts/progress.test.mjs skills/build-paper-argument/scripts/paper-argument.test.mjs
```

## 中文

一个 Claude Code 插件，提供科研用的 skill：查找论文，把一篇论文读成论证图，把一组论文按引用关系连成一张图，从这张图出发写研究提案，一轮一轮地实现它，再建出报告它的论文的论证。

### Skills

| Skill | 功能 | 触发方式 |
|---|---|---|
| `find-papers` | 通过 NASA ADS 按主题整理出一份排好序的阅读清单 | 你让 Claude 找某个主题的论文时，它会自己调用 |
| `read-a-paper` | 把一篇论文拆解成 Argument DAG，写成 Obsidian canvas | 你让 Claude 详细讲解一篇论文时，它会自己调用 |
| `build-argument-library` | 读一组论文，把各篇的 Argument DAG 按彼此的引用关系连成一张 Obsidian canvas | 只在你调用 `/sci-skills:build-argument-library` 时运行 |
| `research-proposal` | 从 Argument Library 出发，把一个模糊的研究想法写成提案：一层 Conjecture，每个挂在能判定它的 Verification 上，写成 Obsidian canvas | 只在你调用 `/sci-skills:research-proposal` 时运行 |
| `implement-proposal` | 跨多个会话实现提案的一轮：产出 Verification 承诺的 Grounds，把每个结果和它的判据摆在一起，把你的判断记进进度文件 | 只在你调用 `/sci-skills:implement-proposal` 时运行 |
| `build-paper-argument` | 从你判断过的各轮建出报告它们的论文的 Argument DAG，写成 Obsidian canvas，在写任何正文之前由你审 | 只在你调用 `/sci-skills:build-paper-argument` 时运行 |
| `calibrate-to-library` | 测量 Argument Library 里的论文是怎么写的（各节段落做什么、什么顺序和比例、句子的语体），留下计数、按段落种类索引的 library 段落地图，以及在这个领域写论文时用的测量工具 | 只在你调用 `/sci-skills:calibrate-to-library` 时运行 |

#### find-papers

你可以这样提问：*“找 10–15 篇关于 tidal tails 的论文，从 Pavel Kroupa 参与的几篇出发”*。Claude 先在 ADS 里按你的条件（主题、作者、年份）搜出种子论文，再用 ADS 的 `similar` 和 `useful` 从种子扩展，最后读摘要来排序和筛选。

- 回复是一张表：标题、作者、年份、bibcode，以及每篇论文是怎么找到的。
- 清单里的每一篇都来自当次会话的 ADS 查询结果，不会凭记忆添加。
- 它是只读的：不写文件，也不下载全文。

#### read-a-paper

给 Claude 一篇论文，让它详细讲解。它用 Toulmin 论证模型来读：每个论证记为一个 Claim 加上它的 Grounds 和 Warrant，论文给出时再加上 Backing、Qualifier 和 Rebuttal。论证自底向上相连，从只依赖外部知识的论证一直连到论文的主要结论。

结果是一张 Obsidian canvas：

- 每个论证一张卡片，带一行 `Source:` 说明它出自论文哪里，它依赖的每篇文献各有一行 `Cites:`。
- 一张身份卡片，写着论文的标题、作者、年份和标识符。
- 边的标签是 `Grounds`、`Warrant`、`Backing` 或 `Rebuttal`，说明一个论证的 Claim 在下一个论证里起什么作用。
- 逻辑有问题的卡片带 Audit Note：循环依赖，或者某个论证通不到论文的任何结论。

#### build-argument-library

调用 `/sci-skills:build-argument-library`，告诉 Claude 用哪些论文、全文在哪里。每篇论文由一个单独的 subagent 用 `read-a-paper` 来读。然后 Claude 顺着论文之间的引用走：论文 A 的某个论证引用了论文 B，它就在 B 里找到 A 所依赖的那个论证，把两者连起来。

结果是一张 Obsidian canvas，每次运行都整张重新生成：

- 每篇论文是一个 group，里面是它完整的 Argument DAG。引用别人的论文排在被引论文的上方。
- 论文之间的连接是紫色的边，标签同样是那四种。
- Audit Note（红色卡片）标出站不住的引用：被引论文里没有提出这个 Claim 的论证，或者引用方说得比被引论文论证的更强。
- 连接只来自引用。这组论文引用了、但不在这组里的论文，会在回复里统计出来，作为扩充文献库的候选。

#### research-proposal

调用 `/sci-skills:research-proposal`，给出一个模糊的想法，其中要有目标（一个问题）、研究对象（给一类对象就够）和至少一个抓手：你想改变、比较、解释或测量的东西。Claude 只从你用 `build-argument-library` 建好的 Argument Library 出发，不查 library 之外的文献：library 就是你选定可信的那组论文。

一次运行最多停下来问你三次：

- 第一次用到某个 library 时，在给每篇论文写 Short（一页摘要，写一次、反复用）之前，告诉你开销；
- 对齐想法的意思：几种读法并排列出，并说明大约要打开几篇论文；
- 让你挑这一轮投入哪几组 Verification，每组写明牵动什么、需要什么。

中间每篇相关论文由一个 subagent 带着想法去读，报告它对每个要素的态度：已确立、被假定、有争议还是没说，并给出卡片 id。

结果放在 `proposals/<短名>/` 下：

- `round-N.canvas`：在 library 之上加一层 Conjecture。每个 Conjecture 的 Claim 都可判定，并挂在能判定它的 Verification 上。每次昂贵的 Verification 至少挂一个浅的 Conjecture，写明成立、不成立各得出什么。library 不支撑的选择留给你决定。
- `table.md`：对照表，论文 × 想法的要素，记下打开了哪些论文、摆出过哪些候选，跨轮保留。

这个 skill 只提案：不跑模拟，不查数据库。你做完之后带着结果再调用它，进入下一轮。每轮写一张新 canvas；Conjecture 成立与否由你来说。

#### implement-proposal

在实现某一轮的每个工作会话开头调用 `/sci-skills:implement-proposal`，可以带上提案的 `<短名>` 和你想做的事（「做 V4」）。一轮要跨很多会话：等 allocation、等跑好几天的模拟、补齐缺的东西。所以每个会话先读清楚各项进展到哪，提出这次推进哪一件，推进到一个停顿点，然后记下来。

- 每个 Verification 具体怎么做，看你项目自己的说明（`AGENTS.md` 和它指向的文件）。项目里找不到做法的，Claude 把可选的路摆出来，由你选；它不自己发明流程，也不改项目以外的东西。
- 昂贵的工作，要等 canvas 留给你的选择都定了、你说了 go，才开始投入资源。
- 每个结果都和 Conjecture 事先写好的判据摆在一起。成立、不成立还是没做，由你来说；Claude 照你的原话记下。
- 进度记在 canvas 旁边的 `proposals/<短名>/round-N.progress.md`，每张卡一节，可以在 Obsidian 里读和改。

所有 Conjecture 都判断完，这一轮就交接了：给出你的判断汇总、下一轮需要知道的限制，以及过程中记下的新想法。进度文件就是 `research-proposal` 下一轮读的结果。

#### build-paper-argument

当你判断过的轮次够写一篇论文时，调用 `/sci-skills:build-paper-argument`。Claude 读你指定的提案的进度文件，在 `papers/<论文短名>/argument.canvas` 建出这篇论文自己的 Argument DAG。

- 只有你判为 held 的 Conjecture 能成为 Claim。failed 的只作为某个 held 卡的 Qualifier 或 Rebuttal 进来，否则不进。没有事先定判据的测量作为结果进来，标明 "Not a Conjecture"。
- 卡上的每个数都写明来自哪个判断、文件或 library 卡片。
- 建论证链之前，它停下来请你定 End Argument：哪个是主结果、每个在摘要和结论里留下的那一句话、谁为它读这篇论文。canvas 通过检查后再停一次，请你审。
- 之后的轮次判断完可以再运行：它把新的判断带进来，你对 canvas 的手改不动。

#### calibrate-to-library

每个 Argument Library 调用一次 `/sci-skills:calibrate-to-library`，全文要先放好。它弄清这个领域怎么写论文，让之后写出的论文读起来像这个领域自己的。

- 它先读 Short 和几篇全文，再提出方案并逐项给理由：哪些论文写法相近分成一组、每节段落种类的词汇、值得测的语体指标、大致成本。你决定之后才大规模运行。skill 附带一次早先的校准作为例子，agent 只在适合你的领域时借用。
- 每篇论文由一个 subagent 给段落标种类。切分论文和测语体的脚本由 agent 针对你的 library 写，每个都用它亲自读过的样本核对。
- 结果放在 `<library dir>/writing/`：用计数写成的 section guide、标签、从段落种类到 library 段落的地图、各组的语体范围，以及工具。

几个 skill 的典型用法：先用 `find-papers` 得到阅读清单，自己取得全文，对它们运行 `build-argument-library`，再带着你的想法运行 `research-proposal`，用 `implement-proposal` 实现选定的这一轮，最后带着结果再运行 `research-proposal`。结果够写论文时，用 `build-paper-argument` 建出它的论证。

### 词表

`GLOSSARY.md` 定义了各个 skill 共用的术语（Toulmin model、Argument DAG、Native Argument、End Argument、Argument Library、Conjecture、Verification、Round、Short、End rank）。插件的 hook 会把它加载到每个会话和每个 subagent 里。

### 安装

在 Claude Code 里：

```
/plugin marketplace add HerculeWu/sci-skills
/plugin install sci-skills@sci-skills
```

### 依赖

- Node 18 或更高版本，用来运行脚本。
- `jq`，把词表加载到 subagent 的 hook 要用。
- `find-papers` 需要一个 ADS API token，放在 `~/.ads/dev_key`。可以在 [ADS 账号设置](https://ui.adsabs.harvard.edu/user/settings/token)里获取。
- [Obsidian](https://obsidian.md)，用来打开 `.canvas` 文件。
- `research-proposal` 需要一个由 `build-argument-library` 建好的 Argument Library，最好全文也放在旁边。
- `implement-proposal` 需要一张由 `research-proposal` 写好的 canvas，以及写明各 Verification 怎么做的项目说明。
- `build-paper-argument` 需要至少一轮由 `implement-proposal` 交接过的进度文件，以及 Argument Library。
- `calibrate-to-library` 需要 Argument Library，以及各篇论文的 markdown 全文。

### 开发

`AGENTS.md` 记录了构建这些 skill 的原则。脚本带有单元测试：

```bash
node --test skills/find-papers/scripts/ads.test.mjs skills/build-argument-library/scripts/library.test.mjs skills/research-proposal/scripts/proposal.test.mjs skills/implement-proposal/scripts/progress.test.mjs skills/build-paper-argument/scripts/paper-argument.test.mjs
```
