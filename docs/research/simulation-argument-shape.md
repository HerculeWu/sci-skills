# 做模拟的论文里，模拟周围的论证长什么样

为 wayfinder ticket「proposal 图要有怎样的冗余」（issue #5）做的一次核对。问题是：昂贵的模拟在 Argument DAG 里的位置，是不是「前面直接接 Native Argument」。

论文是事后写的，里面已经没有猜想，所以这里看到的是研究做完之后图的形状。

## 方法

样本是 `tidal_tails_numerical_compare/literatures/` 下每篇论文自己的 canvas。选了 6 篇，代码和类型各不相同：

| 论文 | 代码 | 类型 |
|---|---|---|
| Gieles2021 | NBODY6++GPU | 用约 2e5 颗星的模型网格拟合一个球状星团（Pal 5） |
| Weis2025 | φ-GPU | 拟合疏散星团（Praesepe），再在拟合出的那次运行上分析机制 |
| Wirth2024 | NBODY6 | 纯数值实验加模拟观测者，32 次运行 |
| PflammAltenburg2025 | 自写 Hermite（Milgrom 动力学） | 新代码论文：少体测试，再做孪生星团实验 |
| Jerabkova2021 | AMUSE / Huayno | 用模拟设计观测搜索，另加变体运行 |
| Jadhav2025 | PeTar | 模型网格作为基准，给 122 个已发表的观测星表打分 |

**机械得到的**（脚本可重跑）：卡片的 Native / End / 中间类别、边、上下游、给定标签后的所有计数。

**阅读判断的**（逐张读了 6 篇的全部非 Native 卡片，标签存在 `labels.json`）：

- `S`：设置卡片，Grounds 里没有运行输出。
- `SD`：设置卡片，Grounds 里同时有运行输出。
- `D`：Grounds 含论文自己的模拟输出（图、表或数）。
- `X`：Grounds 是借助模拟筛选或评分的观测数据，不含模拟输出。
- `R`：Grounds 只是复述上游基于模拟的 Claim。
- `O`：与模拟输出无关。

「第一批论证」指标为 `D`、且上游没有别的 `D` 卡片的那些。`SD` 卡片有两种算法：变体 A 把它算作用了模拟输出，变体 B 把它算作纯设置。

重跑：`python3 -I docs/research/simulation-argument-shape/analyze.py [Paper ...]`（`canvaslib.py` 顶部的 `ROOT` 指向样本目录）。

## 结果

| | Gieles2021 | Weis2025 | Wirth2024 | PflammAltenburg2025 | Jerabkova2021 | Jadhav2025 |
|---|---|---|---|---|---|---|
| 论证卡片（Native / 中间 / End） | 34 (11/19/4) | 40 (14/21/5) | 32 (15/14/3) | 40 (20/15/5) | 34 (11/17/6) | 47 (18/23/6) |
| 设置卡片 | `A_setup`，中间，`S` | `sim-suite`，中间，`SD` | `a-models`，中间，`S` | `a-setup`，中间，`S` | `i-m1-model`，中间，`SD` | `n_sim`，**Native**，`S` |
| 设置卡片的支撑 | 4 张 Native | 5 张 Native 加 2 张观测中间卡片 | 4 张 Native | 1 张 Native 加 2 张中间卡片 | 5 张 Native | 无入边，11 条 Cites |
| 代码怎么进来 | Warrant | Backing | Warrant | 推导卡片的 Warrant | Backing | `n_sim` 里的一行 |
| 第一批论证 | 3 | 4（B） | 4 | 4（孪生实验） | 4（B） | 5 |
| 它们的 Grounds / Warrant 全是 Native 吗 | 否 | 否 | 否 | 否 | B：否；A：是 | 是 |
| 中间隔着什么 | 设置卡片；观测目标定义（作 Warrant） | 设置卡片；观测样本；质点轨道积分 | 设置卡片；4 张只由 Native 推出的「工具」卡片 | 代码推导；解析推导；设置卡片 | 设置卡片 | 无 |
| `D` 卡片数 | 16 | 18 | 9 | 9 | 14 | 16 |
| End 离第一批的最短步数 | 1：2 个；2：2 个 | 1：2；2：2；3：1 | 1：1；2：2 | 1：2；4：1；5：2 | 1：3；2：3 | 0：1；1：2；2：1；3：2 |
| 最长的链（边数） | 3 | 6 | 3 | 5 | 6 | 8 |
| 不依赖模拟的 End | 0 / 4 | 0 / 5 | 0 / 3 | 0 / 5 | 0 / 6 | 0 / 6 |
| 设置卡片的 `D` 直接下游 / 它们之间的边 | 3 / 0 | 11 / 6 | 5 / 1 | 4 / 0 | 4 / 0 | 14 / 9 |
| 后续模拟 | 有（全文里；canvas 上没有卡片） | 有（`seed-scatter`，另有一次对照运行没有卡片） | 未见 | 有（`a-setup`） | 有（三张变体卡片） | 未见 |

## 六篇都成立的

1. 每个 End Argument 上游都有用到模拟输出的卡片。
2. 每篇的主模拟只有一张设置卡片，代码、初始条件、运行清单不会拆成几张。
3. 代码从不作为 Grounds 进入：3 篇是 Warrant，2 篇是 Backing，1 篇是表里的一行。设置卡片则作为 **Grounds** 进入第一批论证。
4. 一张设置卡片喂 3–5 个第一批论证，3–14 个 `D` 直接下游。
5. 第一批论证的输入不全是 Native 时，多出来的卡片只有三类：设置卡片本身（5 篇）；观测目标或样本卡片（Gieles 的 `A_targets` 作 Warrant，Weis 的 `obs-sample` 和 `orbit` 作 Grounds）；只由 Native 推出的工具或推导卡片（Wirth 4 张，PflammAltenburg 的 `a-hermite-mld`、`a-efe`）。
6. End 卡片多数只是复述：29 张里 26 张是 `R`。
7. 没有哪张后续模拟的设计卡片直接把一个模拟结果当作 Grounds 或 Warrant。后续模拟要么被折进某张结果卡片的 Grounds，要么作为结果卡片挂在设置卡片下。
8. 看到的每个第一批「没有差别」型结果都通到了 End，用法不同：
   - Gieles `B_nobh1`：作主链的 Rebuttal，同时作几个判别性检验的 Grounds。
   - Jadhav `s_ecc`（偏心轨道与圆轨道相同）：作 Warrant，支持只用圆轨道网格做基准。
   - Jerabkova `i-rotation`（没有出现不对称）：作 Grounds 排除一种解释，并单独支撑一个 End。
   - Jadhav `e_rv_phi`：零结果本身就是 End。
   - Wirth `a-mf-flatter`：Δα = 0.2 ± 0.3，在 1σ 之内，仍一步到 End。

## 不符合的

- **模拟本身是 Native（Jadhav2025）。** 论文自己的网格记成了 Native 卡片，于是第一批论证的输入全是 Native，还有一个 End 自己就是第一批论证。
- **设置和第一个结果写在同一张卡片里（Jerabkova `i-m1-model`，Weis `sim-suite`）。** 怎么算这张卡片，决定了第一批论证是 1 张还是 4 张。
- **设置在观测的下游（Weis）。** 设置卡片和 Native 层之间有三张观测中间卡片：`n-gaia-cp` → `obs-sample` → `obs-centre` → `orbit` → `sim-suite`。`orbit` 是一次便宜的质点回溯积分。
- **设置在一个模拟结果的下游（PflammAltenburg）。** 主实验的 softening 由测试结果辩护：`a-binary-ext`（`D`）→ `a-softrole`（`R`）→ `a-setup`。6 篇里只有这一处。全文 §3.5 在测试之前就解析地给出了同样的理由，所以先后无法确定。这组运行只有 400 颗星，并不昂贵。
- **深度差别大。** 链长 3（Gieles、Wirth）、6（Weis、Jerabkova）、8（Jadhav）。长链都经过观测类的 `X` 卡片，或经过「先验证模型、再用模型预测」。
- **验证结果作 Warrant** 只在 Weis 出现（`bfsr-match`）。Gieles 里匹配上的模型 `A_wbh1` 被当作 Grounds 用了 12 次。
- **动机没有画成边（Jerabkova）。** 全文说做 lump 运行是为了解释观测到的不对称，canvas 上 `i-asymmetry` 到 `i-lump-sims` 没有边。
- **回头的边。** 后做的运行反驳了先前的方法卡片：`i-lump-sims` -Rebuttal-> `i-ccp-method`。

## 没能确定的

- **先后顺序。** 后续模拟是否在看到第一批结果后才设计，canvas 上看不出。从全文确认了 Gieles、Weis、Jerabkova；PflammAltenburg 无法确定；Wirth 和 Jadhav 没有证据。
- **运行的代价。** canvas 上没有。
- **`D` 与 `R` 的界线**对 End 卡片是软的。Wirth 的 `a-tails` 只在 Qualifier 里引用了运行输出；若把它标成 `D`，第一批论证会塌成它一张。
- **其余 9 篇候选**没有分析。只看卡片标题，Dinnbier2022 和 Jadhav2026 也把模拟记成了 Native 卡片。
- 论文只写有用的零结果，第 8 条有幸存者偏差。
