# Comparison table
`proposals/<name>/table.md`, one per goal, written in the user's language. Every round appends to it: rows carry the round they were added in, and a row is edited only to change a candidate's status. Every 没说 and 假定 on the canvas traces back to a cell here.

```markdown
# 对照表 · <name>

目标：<the goal as a question>
library：<library dir>（<M> 篇，short 在 `shorts/`）

## 要素

| id | 要素 | 来源 | 加入于 |
|---|---|---|---|
| T | … | 用户说的 | 第 1 轮 |
| Q1 | … | 从 library 提（`Weis2025:tail-robust`） | 第 1 轮 |
| K | 这类运行的约束和警告 | 固定项 | 第 1 轮 |
| S | 可当标尺的散布或效应大小 | 固定项 | 第 1 轮 |

## 打开记录

「没说」的范围就是这里列出的论文。

| 要素 | 打开的论文 | 篇数 | 第几轮 |
|---|---|---|---|

## 论文 × 要素

态度：**确立** / **假定** / **争议** / **没说**（全文核对过）/ **没有卡片提到**（无全文）/ —（不适用）

| 论文 | T | Q1 | K | S |
|---|---|---|---|---|
| Gieles2021 | **确立**：一句原文或转述（`A_setup`） | … | — | — |

## 跨论文的发现

| id | 发现 | 涉及的卡片 | 上 canvas |
|---|---|---|---|

## 候选

| 轮 | Verification 组 | 昂贵？ | 挂的 Conjecture | 状态 | 理由 |
|---|---|---|---|---|---|

## 也许值得加进 library 的论文

被挑中的候选所牵动的卡片引用的集合外工作，由用户决定加不加。

| 被引用于 | 文献（照 `Cites:` 行原文） |
|---|---|
```

- **要素**: the agreed elements of the idea, plus K and S.
- **打开记录**: for each element, the papers opened for it. This is the scope of every 没说.
- **论文 × 要素**: one stance per cell from the subagents' reports, with the card id (within the paper) and one quoted line.
- **跨论文的发现**: findings that span papers, such as two cards that conflict without citing each other, and whether each went on the canvas.
- **候选**: every candidate laid out in step 3. 状态 is 挑中, 未挑中 or 已排除; 理由 records who decided and why, so an excluded direction stays out of later rounds.
- **也许值得加进 library 的论文**: from the `Cites:` lines of the cards the chosen candidates move, for works outside the set.
