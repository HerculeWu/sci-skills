# 对照表 · tail-treatment

> PROTOTYPE 样张：只为看格式。只填了几行，内容取自 research 报告，未逐条核实。

目标：tail 星在 N-body 模拟里的处理方式，如何影响 (a) tail 本身的结构和运动学，(b) 从 tail 推出的结论？
library：`../astro/tidal_tails_numerical_compare/literatures/`（33 篇，short 在 `shorts/`）

## 要素

| id | 要素 | 来源 | 加入于 |
|---|---|---|---|
| T | 三种处理方式（分开积分 / 一起积分 / 一起积分加 tree） | 用户说的 | 第 1 轮 |
| Q1 | epicyclic overdensity 的位置 | 从 library 提（`Kroupa2022:e-kuepper`） | 第 1 轮 |
| Q2 | tail 沿轨道的数密度剖面 | 从 library 提（`Weis2025:tail-robust`） | 第 1 轮 |
| Q3 | 逃逸后 tail 星的 ΔL_z | 从 library 提（`Weis2025:end-selfgravity`） | 第 1 轮 |
| K | 这类运行的约束和警告 | 固定项 | 第 1 轮 |
| S | 可当标尺的散布或效应大小 | 固定项 | 第 1 轮 |

## 打开记录

「没说」的范围就是这里列出的论文。

| 要素 | 打开的论文（按 short 判断） | 篇数 | 第几轮 |
|---|---|---|---|
| T | Arnold2025, Awad2025, Boffin2022, Casamiquela2022, Dinnbier2022, Gieles2021, Jadhav2025, Jadhav2026, Jerabkova2021, Kos2024, Kroupa2022, Kroupa2024, MojtabaGhasemi2026, PflammAltenburg2023, PflammAltenburg2025, Sharma2025, Wang2024, Weis2025, Wirth2024 | 19 | 1 |
| … | … | … | … |

## 论文 × 要素

态度：**确立** / **假定** / **争议** / **没说**（全文核对过）/ **没有卡片提到**（无全文）/ —（不适用）

| 论文 | T：处理方式 | Q3：ΔL_z | K：约束 | S：标尺 |
|---|---|---|---|---|
| Gieles2021 | **确立**：逃逸星移出后作 tracer 积分（`A_setup` Grounds） | **假定**：忽略星团对 tail 星的力（`A_setup` Backing） | — | — |
| Weis2025 | **确立**：φ-GPU，全部保留（`n-phigpu`） | **确立**：自引力最多占 70%（`end-selfgravity`） | tail 结构对种子不敏感（`tail-robust`） | 15 次实现的 1σ 带（`seed-scatter`） |
| Casamiquela2022 | **确立**：test particle，无星–星引力（`n_testparticle`） | **假定（读者推断）**：逃逸后路径只由轨道和银河势决定（`n_testparticle` Warrant） | — | — |
| Wirth2024 | **没说**：只写 NBODY6，逃逸星怎么积分全文未提 | — | — | 32 个模型（`a-models`） |
| Kos2024 | **确立**：无质量粒子（`a-sim-design`） | **假定**：同上 | 与 BHTree 碰撞模拟一致（`a-nbody-check`） | 50 次重复（`a-nbody-check`） |

## 跨论文的发现

| id | 发现 | 涉及的卡片 | 上 canvas |
|---|---|---|---|
| D1 | Weis2025 的自引力结论与「忽略星–星引力」的做法冲突，两边互不引用 | `Weis2025:end-selfgravity`, `Kos2024:a-sim-design`, `Casamiquela2022:n_testparticle` | 是（讨论论证） |
| B1 | Pal 5 有两组现成模拟，分别对应处理 1 和 3 | `Gieles2021:A_setup`, `Wang2024:A_setup` | 是（基准） |

## 候选

| 轮 | Verification 组 | 昂贵？ | 挂的 Conjecture | 状态 | 理由 |
|---|---|---|---|---|---|
| 1 | V1：Pal 5 轨道，三种处理 × K 种子 | 是 | C1, C2, C3 | 挑中 | |
| 1 | V0：比较已发表的 Pal 5 tail 图 | 否 | C0 | 挑中 | |
| 1 | V3：Hyades 类模型，处理 1 对 2 | 是 | 在 Hyades 上重现 `Jerabkova2021:i-m1-model` | 未挑中 | 用户：先做 Pal 5 |
| 1 | V4：test particle 对 N-body 的 overdensity 位置 | 是 | … | 已排除 | 合作者：Kos2024 已比较过 |

## 也许值得加进 library 的论文

被挑中的候选所牵动的卡片引用的集合外工作，由用户决定加不加。

| 被引用于 | 文献（照 `Cites:` 行原文） |
|---|---|
| `Casamiquela2022:n_testparticle` | Montuori et al. 2007, ApJ, 659, 1212 |
| `PflammAltenburg2023:n_nbody` | Küpper et al. 2010 |
