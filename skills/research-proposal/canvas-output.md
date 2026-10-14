# Canvas output
Round N's proposal is `proposals/<name>/round-N.canvas`, an Obsidian canvas. Write its content in the user's language. The headings, field names and markers below stay exactly as written, whatever that language is: the user finds the same thing in the same place every round, and `scripts/proposal.mjs check` reads the colours, tags and labels.

## Layout
Bottom to top, in the same direction as `read-a-paper`:

1. library cards;
2. the proposal's own established arguments, and the Verification designs;
3. Conjectures;
4. outlook;
5. the goal card.

Colour marks the zones; no groups. A legend card sits at the top left. Size every card to its text, and leave enough space between rows for edge labels to be read.

| Colour (Obsidian preset) | Card |
|---|---|
| cyan `5` | goal card |
| none | library card |
| green `4` | the proposal's own established argument: motivation, discussion, benchmark, a result from an earlier round |
| orange `2` | costly Verification |
| yellow `3` | cheap Verification, and every Conjecture |
| purple `6` | outlook |
| red `1` | ⚠ exception: no shallow Conjecture is possible |

## Naming a library card
A library card is named as its id in the library canvas, in backticks: `` `<paper key>:<card id>` ``. `check` looks every such name up in the library, because a reference to a card that does not exist is the quietest error this skill can make. Keep backticked `word:word` for card names only.

## Cards

### Goal card
```
# 目标 · 第 N 轮

**问题**：… — *用户说的*
**研究对象**：… — *用户说的*
**抓手**：… — *用户说的*
**要看的量** — *从 library 提*
- …（`Weis2025:tail-robust`）

**新颖性只相对于 library 判断，未查 library 之外的文献。**

对齐于 <date> · 打开了 <M> 篇里的 <n> 篇（见 table.md）
```
Each item carries its source: *用户说的*, *从 library 提* or *agent 推断*. Several readings agreed in step 1 are listed as (a), (b), ….

### Library card
```
`Gieles2021:A_setup` · 中间论证
one sentence of what the card says
```
The category is `Native`, `End` or `中间论证`. The sentence summarises the library card, which stays the authority. When the support the proposal uses is a reader's inference (`(implicit)` in the library) rather than the paper's words, mark it **(读者推断)**.

### The proposal's own argument
Motivation, discussion, benchmark, or a result from an earlier round:
```
## M1 · 动机
## D1 · 讨论：<what conflicts>
## B1 · 基准：<what can be compared>
## R1 · 结果 · 来自第 k 轮
```
Then **Claim**, **Grounds**, **Warrant**, and **Qualifier**, **Rebuttal** where needed.
- Two library cards that conflict and do not cite each other become a discussion argument naming both.
- A result from an earlier round -- a Conjecture that held, or the opposite of one that failed -- has Grounds pointing to the file that holds the result.

### Verification card
```
## V1 · Verification · 昂贵      (orange)
## V0 · Verification · 便宜      (yellow)
```
- **设计（论证）**: what is done, supported by edges from library cards and benchmarks.
- **需要的东西**: one line each, ✓ or ✗, with where it comes from (a file of the project, or 用户说的).
- **产出**: the quantities or plots it produces.

A costly Verification also has:
- **规模**: the scale, compared with the limits the project states, or **无法判断**.
- **标尺**: the yardstick, and the runs in the design that produce it.
- **待用户决定**: every choice in the design without support.

A library argument against the design is drawn as a `Rebuttal` edge into the card.

### Conjecture card
```
## C1 · Conjecture（V1）· 浅 · 基准
**Claim**：V1 中处理 1 的模型，其 tail 沿轨道的数密度剖面与 `Gieles2021` 的结果之差在 σ_seed 之内。
**Warrant**：…
**Qualifier**：…
**Rebuttal（判据）**：任一距离区间的偏差超过 2σ_seed 则不成立。
**效应大小**：…

**若成立** → …
**若不成立** → …
```
- The heading names the Verification it hangs on, then its tags, separated by ` · `: `浅`, `基准`, `赌注`, `⚠ 不浅`, `来自第 k 轮`.
- **Claim**: one decidable sentence: what is measured, what it is compared with, which direction.
- **Rebuttal（判据）**: the result that would refute it, stated now.
- **效应大小**: an estimate with the card id it rests on, or **未知**.
- **若成立** / **若不成立**: what each outcome establishes. A costly Verification needs at least one Conjecture tagged `浅` with both lines; other Conjectures may have **若成立** only.
- When no library card can be named for it, write **library 在这里没有话说**.
- An untested Conjecture carried over from round k keeps its card and adds the tag `来自第 k 轮`.

**The exception.** When a costly Verification can have no shallow Conjecture, its Conjecture is red, tagged `⚠ 不浅`, with a line **例外**：saying why.

### Outlook card
```
## O1 · 展望（非承诺）
what it would do
**缺**：what it still lacks
```
A costly Verification in the outlook says so in its heading: `## O3 · 展望 · 昂贵 Verification V2（非承诺）`.

### Legend card
Top left, uncoloured: the colour table above and the edge labels below.

## Edges
- Every edge has one label: `Grounds`, `Warrant`, `Backing` or `Rebuttal`. Direction as in the Argument DAG, from the Claim that is used to the argument that uses it. A Verification feeds each of its Conjectures as `Grounds`.
- An edge from a Conjecture to the argument its outcome would feed says which outcome: `成立 → <label>` or `不成立 → <label>`, coloured yellow `3`.
- Every `Rebuttal` edge is red `1`.

## Wording of gaps
A gap is written with its scope: 「library 里没有」, 「在打开的 N 篇里没有一篇提到」, and 「没有卡片提到」 when the full text was not available.

## Check
`scripts/proposal.mjs` sits next to this file and needs Node 18+:

```bash
node <skill-dir>/scripts/proposal.mjs check <round-N.canvas> <library.canvas>
```

It confirms that:
- the canvas parses, every card has a position and size, and every edge joins two existing cards;
- every backticked `<paper key>:<card id>` is a card of the library;
- every edge label is one of the four, or `成立 → <label>` / `不成立 → <label>`;
- every orange card grounds a Conjecture tagged `浅` with both **若成立** and **若不成立**, or one tagged `⚠`.

It prints `ok <path>`, or every problem as `error: <reason>` with a non-zero exit.
