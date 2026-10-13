# library 的哪些结构信号能产出研究机会

Ticket [#3](https://github.com/HerculeWu/sci-skills/issues/3)，map [#1](https://github.com/HerculeWu/sci-skills/issues/1)。调查日期 2026-10-13。

本文只报告在样本上看到的事实。它不定义「值得做」，也不给研究方向排序。凡是标「判断」的地方，都是我在领域背景有限的情况下读卡片得出的，单人单遍，没有复核。

## 结论

1. **带信号几乎不构成筛选。** 四种卡片级信号（Audit Note、`(implicit)` Warrant、Qualifier、Rebuttal）合起来覆盖 library 93% 的论证卡片（1083/1163），核心区 96%（170/177）。
2. **各信号的命中率都在五分之一上下，而且主要来自锚点，不来自信号。** 在核心区，带 `(implicit)` Warrant 的卡片有 20% 被我判为指向机会；Warrant 写明的对照组是 14%。Qualifier 20%，Rebuttal 段 18%，Audit Note 24%，出度 ≥3 的 Native Argument 25%。先用想法的词汇把卡片圈出来，再看信号，信号本身只多带来很少的区分。
3. **两种更窄的形式命中率高得多。** Audit Note 里「循环依赖」一类 6/7；Qualifier 里带「stated, not tested」一类措辞的 7/12。两者样本都小。
4. **「互不引用的论文之间 End Argument 冲突」对这个想法的产出是 0。** 与想法相关的冲突确实存在于互不引用的论文之间，但冲突的一方是上游卡片的 Warrant 或 Backing，不是 End Argument。
5. **集合外引用指向的是该补读什么，不是机会。** 按被引次数排，排在前面的是通用配料（银河势、恒星演化、IMF）；与想法最贴近的集合外论文各只被一篇引用。
6. **信号找不到的机会有五处**（见[信号找不到的机会](#信号找不到的机会)）。其中最贴近想法原文的一处：library 里已有两篇论文算了同一个天体（Pal 5），一篇把逃逸星移出后另行积分（NBODY6++GPU，对应想法里的处理 1），一篇不移出任何恒星（PeTar，对应处理 3），没有卡片比较它们的 tail。它是靠拿想法里的三种处理当清单逐项搜出来的。

## 样本与方法

- library：`/Users/wenjie/programm/astro/tidal_tails_numerical_compare/literatures/library.canvas`，33 篇论文，1196 张卡片（33 张 identity card，1163 张论证卡片），2489 条边，其中 452 条跨论文。
- 想法：用户原话见 map 的 Notes。三种处理：tail 单独积分（Nbody6）；tail 与 cluster 成员一起积分（Nbody6）；一起积分但 tail 与 cluster 的相互作用用 tree code（PeTar）。
- 本文的计数由 [`library-signals.mjs`](library-signals.mjs) 产生，它只读不写：

  ```bash
  node docs/research/library-signals.mjs <literatures>/library.canvas <literatures>/README.md
  ```

  例外只有一个：Audit Note 来自 link list 的张数，用 `jq '.notes | length' <literatures>/library.links.json` 得到（41 条，落在 41 张不同的卡片上）。
- 判断没有脚本。每个判断旁边都列了卡片 id，可以打开 library 对照。

### 卡片怎么解析

各篇论文的卡片格式不一致（每篇由不同的 `read-a-paper` subagent 写）。脚本同时接受以下写法：

| 内容 | 出现的写法 |
|---|---|
| Toulmin 元素 | `## Claim` / `### Claim` 标题（27 篇）；`**Claim:**` 粗体标签（6 篇：Casamiquela2020、Kos2024、Kroupa2023、Qin2025、Tang2019、Zhang2020） |
| Native / End 标记 | `**Native Argument**`；`**Type:** Native Argument`；`# N2 · Native Argument` |
| Audit Note | `## Audit Note` 标题（merge 时追加，或论文自己的 canvas 里就有） |

只认 `**Native Argument**` 这一种标记时，Native Argument 会从 516 张掉到 346 张，End Argument 从 142 掉到 97；只认标题时，有 180 张卡片读不出 Claim。

### 与 map Notes 里数字的出入

| map Notes | 本文 | 原因 |
|---|---|---|
| 83 张带 Audit Note | 70 张 | 83 是全文匹配「Audit Note」的卡片数。其中 12 张是 identity card，图例里提到这个词；1 张（`MojtabaGhasemi2026:e-fade`）正文提到。带 `Audit Note` 段的论证卡片是 70 张：41 张来自 link list 的 notes，29 张来自论文自己的 canvas。 |
| 673 张含 `(implicit)` Warrant | 664 张 | 673 是全文含 `(implicit)` 的卡片数。Warrant 段里含它的是 664 张；另有 9 张 Qualifier、4 张 Rebuttal、1 张 Backing 带 `(implicit)`。 |

### 「附近」怎么定义

library 的边只来自引用，想法本身不在图里，所以锚点只能从想法的词汇出发。

- **核心区**（177 张）：论证卡片的正文匹配一个关于「cluster 或 tail 怎么被数值计算」的正则（代码名 NBODY6/7、PeTar、P3T、AMUSE、galpy；tree code、Hermite、leapfrog、softening、regularisation、time step、test particle、N-body model/simulation/code、orbit integration 等；完整正则是脚本里的 `SEED`）。
- **外环**（326 张）：与核心区卡片隔一条边（任一方向）、自己不在核心区的卡片。
- 核心区加外环共 503 张，占论证卡片的 43%。外环太宽，所以逐卡阅读只在核心区做，外环只读了 Audit Note 和 End Argument 的 Claim。

核心区按论文分布：Kroupa2022 14，PflammAltenburg2025 12，Dinnbier2022、Jerabkova2021、Risbud2025 各 10，Arnold2025、Boffin2022 各 9，其余更少；Casamiquela2020、Kroupa2023、Qin2025、Sha2024 为 0。

核心区里有 17 张卡片只因 `galpy` 或「orbit integration」一类措辞命中（机械）。判断：其中 16 张讲的是 cluster 轨道或银河势，与想法无关（例如 `Tang2019:n-orbit`、`Zhang2020:n-galpy`）；1 张相关（`Kos2024:a-sim-design`）。

### 我读了什么

| 范围 | 读的内容 |
|---|---|
| 核心区 177 张 | 全部 Warrant（114 张 implicit + 63 张写明的）；全部 122 段 Qualifier；全部 40 段 Rebuttal；全部 17 条 Audit Note；全部 25 张 End Argument 的 Claim |
| 外环 326 张 | 全部 20 条 Audit Note；全部 37 张 End Argument 的 Claim |
| 全文 | 约 40 张卡片整张读完（下文举例的卡片基本都在内） |
| 没读 | 核心区多数卡片的 Grounds 和 Backing；外环的 Warrant、Qualifier、Rebuttal；「附近」之外的 660 张 |

### 「指向机会」和「噪声」在本文里的含义

这是为了计数用的操作标签，不是「值得做」的定义。

- **指向机会**：信号所在的那段文字记录了一条关于「cluster 或 tail 怎么被数值计算」的假设、未检验的断言、适用范围限制或冲突，而 library 里没有论证为它提供 Grounds。
- **噪声**：信号在，但内容与想法无关（银河势、IMF、观测完备性、措辞强弱、论文笔误），或只是书目问题。
- **边缘**：与数值模型有关，但不涉及处理方式本身。

## 计数（机械）

| 信号 | library | 核心区 | 外环 |
|---|---|---|---|
| 论证卡片 | 1163 | 177 | 326 |
| Audit Note | 70 | 17 | 20 |
| `(implicit)` Warrant | 664 | 114 | 157 |
| Qualifier | 760 | 122 | 242 |
| Qualifier 且含「not tested」一类措辞 | 45 | 12 | 14 |
| Rebuttal 段 | 204 | 40 | 69 |
| 在某条 Rebuttal 边上（源或目标） | 169 | 27 | 57 |
| Native Argument | 516 | 94 | 101 |
| Native Argument 且出度 ≥3 | 78 | 16 | 29 |
| End Argument | 142 | 25 | 37 |
| 四种卡片级信号一个都不带 | 80 | 7 | 22 |

- Rebuttal 边共 108 条，12 条跨论文；碰到核心区的 23 条，其中 3 条跨论文。
- 论文对共 528 个，168 对之间有连接，360 对没有。Arnold2025、Awad2025、Kroupa2023 三篇与任何论文都没有连接。
- `Cites:` 行共 3082 条，2721 条指向集合外；核心区卡片上 698 条，617 条指向集合外。

## 逐个信号

### Audit Note

- **计数**：核心区 17，外环 20。
- **抽样**：37 条全读。
- **判断**：核心区 4 条指向机会，2 条边缘，11 条噪声；外环 4 条指向机会，16 条噪声。
- **按类别**（按 Audit Note 开头的措辞分类，机械；一张卡片可以带几条不同类别的 Audit Note，所以各行之和大于卡片数）：

  | 类别 | library | 附近 | 判为指向机会 |
  |---|---|---|---|
  | 循环依赖（含 near、partial、model-dependent selection） | 19 | 7 | 6 |
  | 被引论文里没有这个论证（`Cites X for …`） | 18 | 15 | 1，另 1 条边缘 |
  | 复述得更强或不同（`Restates X …`） | 25 | 16 | 1，另 1 条边缘 |
  | 没有通到 End Argument 的路径 | 11 | 2 | 0 |

- **指向机会的例子**
  - `Jerabkova2021:e-full-extent`、`Jerabkova2021:i-candidate-sample`：样本按模型的运动学和三维形状裁剪，之后又发现样本与同一个模型一致。观测到的 tail 样本继承了 N-body 模型。
  - `Arnold2025:a-profile-match`、`Arnold2025:a-tail-match`（外环）：成员用本文模拟拟合出的自行轨迹选出，再拿去和模拟比。
  - `Risbud2025:n_ccp`：把 Kos2024 的模型称作 N-body，而 `Kos2024:a-sim-design` 是无质量粒子在收缩的 Plummer 势里的非碰撞模拟。
  - `Risbud2025:n_models`：引 PflammAltenburg2023 作 N-body 模拟，而它是静态 Plummer 势里的 test-particle 积分。
- **噪声的例子**
  - `Boffin2022:n-ccp`、`Boffin2022:alt-ccp`：参考文献条目写错了 Röser 2019 的哪一篇。
  - `Jerabkova2021:n-prior-detections`：搜索半径写成 1.5 km/s，原文是 2.5 km/s。
  - `Sharma2025:n_wirth`：把 tail 的双星比例说得比 Wirth2024 强，与数值处理无关。
  - `Kroupa2022:a-fraction-tail`（外环）：没有通到 End Argument 的路径。
- **边缘**：`Sharma2025:n_sim`（两套 PeTar 模型的初始条件不同）；`Kroupa2022:n-kuepper`（epicyclic overdensity 的「候选」身份被丢掉）。
- **能否机械找到**：能。`## Audit Note` 标题或红色卡片。类别可以按开头措辞粗分，但这些措辞是建库时的写法，没有规范保证。
- **观察**：判为指向机会的 8 条里，没有一条说「某种数值处理没被检验」。它们说的是观测样本依赖模型，或引用方把一种模拟说成了另一种。它们指出的是想法的结果会传到哪里，而不是缺口本身。

### `(implicit)` Warrant

- **计数**：核心区 114，外环 157。
- **抽样**：核心区 114 段 Warrant 全读；另读了核心区 63 段写明的 Warrant 作对照。
- **判断**：114 张里 23 张指向机会（20%），1 张边缘，90 张噪声。对照组 63 张里 9 张指向机会（14%）。
- **指向机会的例子**
  - `Casamiquela2022:n_testparticle`：「恒星一旦逃逸，路径就由 cluster 轨道和银河势决定。」
  - `Boffin2022:n-petar`：「带恒星演化和真实银河势的碰撞 N-body 代码能复现恒星的逃逸和之后的轨道，从而复现 tail 的位置。」
  - `Arnold2025:n-code`：「各代码论文里验证过的方法，组合起来仍然有效。」
  - `Kos2024:a-nbody-check`：「带体间相互作用的代码给出同样的分布，说明简化模型省掉的相互作用对 likelihood 不重要。」
  - `MojtabaGhasemi2026:n-code`、`Wirth2024:n-nbody6`、`Jadhav2026:n-nbody-setup`、`Gieles2021:N_code`、`Weis2025:n-phigpu`、`Kroupa2024:n11`、`Jadhav2025:n_sim`：都是「发表过、测试过的代码给出可靠的 cluster 演化」这一句式。
- **噪声的例子**
  - `Tang2019:n-orbit`、`Zhang2020:n-galpy`、`Bhattacharya2022:n-distances-orbit`：拟合过的银河势给出可靠的轨道方向。
  - `Ramezani2026:n_praesepe`：「数字照所引研究报告的取。」
  - `Wirth2024:a-dalpha-fmul`：未分辨双星对质量函数的线性影响。
  - `Roeser2019b:n_hyades`：同一数据、同一模型，所以结果可并列。
- **对照组里同样指向机会的卡片**（Warrant 写明，所以这个信号找不到）
  - `Kos2024:a-sim-design`：「远离核心处恒星的运动完全由银河势主导；恒星一旦被抛出或剥离，cluster 内部动力学与它之后的轨道无关。」
  - `Kroupa2022:a-method-valid`、`PflammAltenburg2025:a-softrole`、`Wang2024:N_code`、`Kroupa2024:n14`、`Weis2025:torque-decomp`、`PflammAltenburg2023:a_mc_setup`、`Casamiquela2022:a_sim`、`PflammAltenburg2025:e-limits`。
- **能否机械找到**：能，Warrant 段里的 `(implicit)`。内容是否相关要读。
- **观察**：`(implicit)` 的 Warrant 是读论文的 agent 推断的，不是论文写的。它标记的是「论文没说为什么」，这在一篇论文的 Native Argument 上几乎是常态：核心区 94 张 Native Argument 里 80 张带它。

### Qualifier

- **计数**：核心区 122，外环 242。
- **抽样**：核心区 122 段全读。
- **判断**：25 张指向机会（20%），1 张边缘，96 张噪声。
- **指向机会的例子**
  - `Jadhav2025:n_caveats`：最初 10 Myr 之后的行为「should be similar in any setup, given a reliable N-body code」，卡片注明这是陈述、本文没有检验。同一张卡片的 Grounds 把「floating-point precision, choice of code」列为模型网格之外的计算因素。
  - `PflammAltenburg2025:a-softrole`：softening 不影响蒸发是预期，没有给出换一个 softening 长度的 run。
  - `Kos2024:a-nbody-check`：只比了一个 cluster；N-body 的 likelihood 会给出相似的选星结果「是猜想，不是检验」。
  - `Wang2024:N_code`：Hermite 积分的人为漂移不显著，「陈述了，没有展示」。
  - `Arnold2025:n-code`：softening 下近距离交会和硬双星没有被分辨，论文没有检验这个选择的影响。
  - `Kroupa2024:i7`：三个 PeTar realisation 的平均不对称度一直为正（leading tail 更多），显著性很低。
  - `Jerabkova2021:i-m1-model`：softening 让能量均分变弱，质量损失比 Aarseth 代码略低。
- **噪声的例子**
  - `Kroupa2024:e2`：只是「suggests」「support」这类措辞。
  - `Jerabkova2021:n-mw-potential`：没有 bar 和旋臂；公式漏印了立方根。
  - `Boffin2022:end-tails-longer`：成员是候选，完备性难以量化。
  - `Dinnbier2022:n-sigma-mass`：假设位力平衡和 Plummer 轮廓。
  - `Roeser2019b:e_tails`：需要视向速度确认；样本的星等限制。
- **更窄的形式**：Qualifier 里匹配「not tested / stated, not / not shown / no run / by eye / conjecture, not / not quantified」一类措辞的，library 45 张，核心区 12 张。这 12 张里 7 张指向机会（`Arnold2025:n-code`、`Arnold2025:a-tail-morphology`、`Awad2025:i-nbody`、`Jadhav2025:n_caveats`、`Kos2024:a-nbody-check`、`PflammAltenburg2025:a-softrole`、`Wang2024:N_code`）；另 5 张是「凭肉眼比较」或与想法无关的未检验说法（`Roeser2019a:e_model`、`Roeser2019b:i_modelmatch`、`Weis2025:sim-suite`、`Awad2025:e-ngc1261`、`Dinnbier2022:e-mass`）。
- **能否机械找到**：Qualifier 段能。措辞过滤也是机械的，但这些措辞是读论文的 agent 的用词，没有规范保证，会漏掉换了说法的卡片（例如 `Jerabkova2021:i-m1-model` 没被这个过滤命中）。

### Rebuttal

- **计数**：核心区 40 张卡片有 Rebuttal 段；碰到核心区的 Rebuttal 边 23 条（3 条跨论文）。
- **抽样**：40 段全读；23 条边全部看了两端标题。
- **判断（Rebuttal 段）**：7 张指向机会，4 张边缘，29 张噪声。
- **判断（Rebuttal 边）**：23 条里 5 条指向机会。全库 12 条跨论文 Rebuttal 边里，0 条与数值处理有关，都是关于观测到的 tail 样本、不对称的方向，或结构是否为潮汐成因。
- **指向机会的例子**
  - `Arnold2025:a-tail-morphology`：本文的直接 N-body 模型给出又宽又散的 tail，Rebuttal 记下 Boldrini & Vitral (2021) 得到的是持续增长的窄臂。两个模拟结果冲突，对方是集合外论文。边：`Arnold2025:n-bv21` →Rebuttal→ `Arnold2025:a-tail-morphology`。
  - `Kroupa2022:a-method-valid`：无碰撞代码里粒子靠时变潮汐场和有限分辨率的人为加热离开，跨过 práh 的流量不对。边：`Kroupa2022:n-evaporation` →Rebuttal→ 它。
  - `Kroupa2024:n14` →Rebuttal→ `Kroupa2024:e2`：softening 不允许对真实蒸发率做现实的评估。
  - `Jadhav2025:n_caveats` →Rebuttal→ `Jadhav2025:e_baseline`：数值因素可能改变结果。
  - `Jerabkova2021:i-m1-model`：softened 积分器不处理强的近距离相互作用；论文回应说这些很罕见。
  - `MojtabaGhasemi2026:a-models`：每组参数只有一个 run，没有报告 run 之间的涨落。这一条标着「reader's note, not addressed in the paper」。
- **噪声的例子**
  - `Boffin2022:end-tails-longer`、`Roeser2019b:e_tails`：污染率和完备性。
  - `Awad2025:n-potential`：没有包含 bar。
  - `Wirth2024:n-imf-variation`、`Wirth2024:e-field`：IMF 是否变化的观测证据。
  - `Dinnbier2022:a-method`：β(t) 不是单射。
- **边缘**：`Jerabkova2021:e-modelling-needed`（「依赖模型的搜索会漏掉模型里没有的东西」）、`Jerabkova2021:i-ccp-method`、`Jadhav2025:e_methods`、`Awad2025:i-nbody`。
- **能否机械找到**：能，Rebuttal 段和 `Rebuttal` 标签的边。
- **观察**：全库有 32 张卡片带「reader's note / not in the paper」一类标注（核心区 6 张）。这些 Rebuttal 和 Qualifier 是读论文的 agent 加的，不是论文承认的。

### 被很多论证依赖的 Native Argument

- **计数**：核心区 94 张 Native Argument，出度分布为 1：58 张，2：20 张，3：9 张，4：4 张，5、6、17 各 1 张。出度 ≥3 的 16 张。
- **抽样**：16 张全看。
- **判断**：4 张指向机会，4 张边缘，8 张噪声。
- **指向机会的例子**
  - `Jadhav2025:n_sim`（出度 17）：PeTar 模型网格。它是本论文内 15 条论证的 Grounds，又是 `Jadhav2025:e_baseline` 的 Warrant。
  - `Jadhav2026:n-nbody-setup`（出度 4）：Nbody6 cluster library。
  - `Dinnbier2022:n-nbody-models`（出度 4）：NBODY6 参考模型，用来检验半解析近似。
  - `Roeser2019a:n_kharchenko`（出度 3）：原型 open cluster 的 N-body 模型。
- **噪声的例子**
  - `Jerabkova2021:n-prior-detections`（出度 6）：此前的观测只找到内侧 200 pc。
  - `Jerabkova2021:n-mw-potential`（出度 4）：银河势的两种参数化。
  - `Jadhav2025:n_tools`（出度 4）：标准坐标变换和 cluster 尺度。
  - `PflammAltenburg2025:n-field`（出度 3）：MOND 场论。
- **边缘**：`Oh2020:n-ernst-sim`、`Kroupa2022:n-evaporation`、`Arnold2025:n-bv21`、`Wang2024:N_g21`。
- **能否机械找到**：能，数出边。阈值是任意的。
- **观察**
  - 这个信号漏掉了大部分讲代码的 Native Argument。我判为指向机会的 23 张 Native Argument 里，19 张出度 ≤2。一篇论文通常让代码卡片只喂给一张「模型设置」卡片，再由那张卡片扇出：`Weis2025:n-phigpu`（出度 1）→ `Weis2025:sim-suite`（出度 11）；`Wirth2024:n-nbody6`（1）→ `Wirth2024:a-models`（6）；`MojtabaGhasemi2026:n-code`（1）→ `MojtabaGhasemi2026:a-models`（7）。
  - 改用传递后代数来排，排名被年代主导：2019 年的论文被后来的论文引用，所以它们的 Native Argument 后代最多。`Roeser2019a:n_ernst` 有 532 个后代，分布在 28 篇论文；同样靠前的 `Tang2019:n-orbit`（galpy 轨道，385 个后代）与想法无关。

### 互不引用的论文之间相互冲突的 End Argument

- **计数（机械）**：核心区有 End Argument 的论文 16 篇，其中 63 对互不连接，对应 146 个 End–End 卡片对。放宽到核心区加外环：26 篇，204 对互不连接，1047 个卡片对。
- **抽样**：读了附近全部 62 张 End Argument 的 Claim，在读的过程中找冲突。没有对 1047 个卡片对逐对判断。
- **判断**
  - 与数值处理有关的 End–End 直接冲突：0 对。
  - 与想法无关、但确实冲突的一对：`Kroupa2024:e1`（四个 cluster 的 tail 以 8.99σ 否定 Newton 的对称性）对 `Kos2024:e-morphology`（不对称常见，但没有偏向哪一侧）。Kroupa2024 与 Kos2024 之间没有连接。
  - 与想法有关的冲突有，但一方不是 End Argument：`Weis2025:end-selfgravity`（tail 恒星的自引力是逃逸后角动量变化的主要来源，最多占 70%）对 `Kos2024:a-sim-design` 的 Warrant、`Casamiquela2022:n_testparticle` 的 Warrant、`PflammAltenburg2023:n_testparticle` 的 Qualifier、`Gieles2021:A_setup` 的 Backing。Weis2025 与这四篇之间都没有连接。
- **能否机械找到**：互不连接的论文对和它们的 End Argument 可以机械列出。有没有冲突只能读两张卡片后判断。
- **观察**：把信号放宽成「End Argument 对任意卡片」能找到上面四对，但候选空间变成卡片数乘卡片数，机械列举就没有意义了。

### 对集合外论文的引用

- **计数（机械，近似）**：2721 条集合外 `Cites:` 行，按「第一作者姓氏加年份」归并成约 1125 篇不同的集合外文献；核心区卡片引了其中 326 篇。归并是近似的：`Cites:` 行是各论文参考文献表里的自由文本，没有共同的标识符，同一作者同年的 a、b 两篇会被并成一篇（例如 Wang 2020a 与 2020b）。
- **抽样**：按「引它的核心区论文数」排前 20 的集合外文献。
- **判断**：8 篇是数值方法或 tail 模拟的源头文献，12 篇是通用配料。
  - 方法源头：Aarseth 2003（8 篇论文引）、Aarseth 1999（8）、Ernst et al. 2011（8）、Küpper et al. 2010（8）、Baumgardt & Makino 2003（7）、Wang et al. 2020（7）、Küpper et al. 2008（5）、Dinnbier & Kroupa 2020（4）。
  - 通用配料：Bovy 2015（11）、Hurley et al. 2000 和 2002（各 10）、Kroupa 2001（10）、Banerjee et al. 2020（7）、Allen & Santillan 1991（5）等。
- **能否机械找到**：计数能，但要靠近似的文献归并。
- **观察**
  - 这个信号给出的是「该补读什么」，对应 map 里的失败 (c)（提案不新）。它本身不指向一个缺口。
  - 与想法最贴近的集合外文献各只被一篇论文引用，按次数排会沉底：Boldrini & Vitral 2021（只有 Arnold2025 引，出现在 5 张卡片上）、Arnold et al. 2022（NBODY6+P3T）、Dvořáková et al. 2024（Nbody6 cluster library，只有 Jadhav2026 引）、Moyano Loyola & Hurley 2013（只有 Kos2024 引）、Piatti & Carballo-Bello 2020（只有 Casamiquela2022 引）。

## 信号找不到的机会

下面五处都与样本想法相关。每一处写明它是什么、为什么七种信号找不到、我是怎么碰到的。是否成立都是判断。

### 1. 各论文怎么处理 tail 的清单

没有任何一张卡片陈述它。它是把 19 篇做了模拟的论文的代码卡片和「模型设置」卡片并排读出来的：

| 处理方式 | 论文与卡片 | 卡片上的记录 |
|---|---|---|
| 逃逸星移出，另行当作 tracer 积分 | `Gieles2021:A_setup`（NBODY6++GPU） | Grounds：「Escapers removed at 40 half-mass radii and integrated as tracers in the Galactic potential to build the tails.」 |
| 所有恒星留在同一次积分里 | `Arnold2025:n-code`（NBODY6+P3T，leapfrog 加 GPU tree，softened）；`Wang2024:A_setup`（PeTar）；`Weis2025:n-phigpu`（φ-GPU） | 「All stars, including unbound ones, stay in the simulation」；「No stars are removed during the simulation, so the tidal tails are followed」；「Pairwise forces between all stars born in the cluster」 |
| test particle，没有自引力 | `Kos2024:a-sim-design`；`Casamiquela2022:n_testparticle`；`PflammAltenburg2023:n_testparticle` | 无质量粒子在解析的 cluster 势加银河势里积分 |
| 只写了代码名，没记录逃逸星怎么处理 | Wirth2024（NBODY6）、Jadhav2026（Nbody6）、MojtabaGhasemi2026（NBODY7）、Dinnbier2022（NBODY6）、Jadhav2025、Boffin2022、Sharma2025、Kroupa2024 的 `i7`（PeTar）、Jerabkova2021（Huayno，softened）、Awad2025、Kroupa2022（PoR，无碰撞）、PflammAltenburg2025 和 Kroupa2024 的 `i8`（MLD，softened） | 无 |

在同一组初始条件上比较两种处理的卡片只有两处：`Kos2024:a-nbody-check`（test particle 对 AMUSE 里的 BHTree，一个 cluster），以及 `Jerabkova2021:i-m1-model` Grounds 里的一句「Several runs repeated with PhiGRAPE give comparable results」。

最后一行里至少有一篇是论文写了、卡片没记：`Kroupa2024/Kroupa2024.md` 写着 MLD 的计算里「All particles are kept in the calculation」，library 里没有卡片带这句话。

- **为什么信号找不到**：这是跨卡片汇总出来的「没有人做过」，不在任何一张卡片上。各条事实写在 Grounds 和 Backing 里，而七种信号都不看这两段。
- **怎么碰到的**：用想法里的词（代码名、tracer、removed、test particle）在卡片正文里搜，再读命中卡片的 Grounds；最后在各论文的 Markdown 里搜同样的说法。

### 2. tail 自引力与「逃逸后只受银河势」的冲突

`Weis2025:torque-decomp` 和 `Weis2025:end-selfgravity`：离 cluster 约 200 pc 以外，tail 恒星角动量的变化主要来自其他 tail 恒星的引力，典型恒星占 36%，最多 70%。`Weis2025:end-tail-shift`：这会移动 tail 的中心线并增加宽度，对实际搜索的影响「没有量化」。

另一边：
- `Kos2024:a-sim-design` 的 Warrant：恒星一旦离开，cluster 内部动力学与它之后的轨道无关。
- `Casamiquela2022:n_testparticle`：test particle 足以研究 debris 的取向和延伸。
- `Gieles2021:A_setup` 的 Backing：忽略 cluster 对 tail 恒星的力是合理的，它约为总力的 2×10⁻⁵。卡片没有提 tail 恒星之间的力。

Weis2025 与这三篇之间都没有连接。

- **为什么信号找不到**：冲突出在两张卡片的并置上。两边的卡片各自都带 Qualifier 或 Rebuttal，但写的是别的事（Weis2025 的是输出快照的间隔和场星；Gieles2021 的是黑洞比例和网格范围）。它也不是 End–End：一方是中间卡片的 Warrant 或 Backing。
- **怎么碰到的**：`Weis2025:torque-decomp` 因正文里的「time steps of the simulation」落进核心区；读完它顺着出边到 End Argument；再在全库搜 `test particle|tracer|massless`。

### 3. library 里已有一对用不同处理算同一个天体的论文

Gieles2021 用 NBODY6++GPU，逃逸星移出后当作 tracer 积分。Wang2024 用 PeTar，不移出任何恒星。两篇的模型都沿 Pal 5 的轨道演化，到约 11.5 Gyr 时位于 Pal 5 现在的位置；Wang2024 的两组模型直接沿用 Gieles2021 的 wBH-1 和 noBH-1。`Wang2024:A_setup` 的 Grounds 还记着：Gieles2021 的初始位置不能直接用，「because NBODY6 and galpy implement the Galactic potential differently」。

两篇之间有 6 条跨论文边，没有一条关于 tail 的处理；没有卡片比较两篇的 tail。按 map 的词汇，这属于「数据已在 library 某篇论文里，但没人做过这个分析」。

- **为什么信号找不到**：两处处理方式都写在 Grounds 里。两张设置卡片带 `(implicit)` Warrant 和 Qualifier，但内容是别的事。
- **怎么碰到的**：拿想法里的三种处理当清单，逐项搜卡片；`Gieles2021:A_setup` 只被 `tracer` 一词搜到。之后回到 `Gieles2021/Gieles2021.md` 的 Methods 段核对了原文。

### 4. 想法里的处理 1 对处理 2，library 里没有记录

做 NBODY6 或 NBODY7 的四篇（Wirth2024、Jadhav2026、MojtabaGhasemi2026、Dinnbier2022）的卡片都没有写逃逸星是继续和 cluster 成员一起积分，还是另行处理。我在这四篇的 Markdown 里搜 `tracer`、`removed from the simulation`、`integrated separately`、`kept in the calculation` 等说法，也没有命中。

- **为什么信号找不到**：缺的东西不带信号。
- **怎么碰到的**：同上，清单逐项搜，搜不到。
- **不能确定的**：这四篇实际用了哪种处理。转换后的论文正文没有说。

### 5. 孤立的论文

Arnold2025 与任何论文都没有连接。按卡片的记录，它是库里唯一用 NBODY6+P3T 的论文（NBODY6 的输入输出和恒星演化，leapfrog 加 GPU tree 算力），并且写明「所有恒星留在模拟里」。从任何别的论文出发沿边走，都到不了它。

- **为什么信号找不到**：卡片级信号能在它的卡片上命中（`Arnold2025:n-code` 的 Qualifier，`Arnold2025:a-tail-morphology` 的 Rebuttal），但前提是先到达它。以图上的邻近作为「附近」的定义会把它排除在外。
- **怎么碰到的**：词汇锚点（卡片正文里的 `NBODY6+P3T`、`leapfrog`、`tree code`）。

## 横向观察

- **命中率跟着锚点走。** 四种卡片级信号在核心区的命中率是 18% 到 24%，Warrant 写明的对照组是 14%。本次没有测量核心区之外的命中率。
- **与想法最贴近的几句话写在 Grounds 和 Backing 里。** `Gieles2021:A_setup` 的 tracer 处理、`Wang2024:A_setup` 的「No stars are removed」、`Jadhav2025:n_caveats` 的「choice of code」都在 Grounds；`Gieles2021:A_setup` 对忽略 cluster 力的辩护在 Backing。
- **卡片上的一部分内容是读论文的 agent 加的。** `(implicit)` 的 Warrant（664 张）、`(implicit)` 的 Qualifier（9 张）和 Rebuttal（4 张）、「reader's note / not in the paper」（32 张）。「stated, not tested」这类最有用的措辞也是它的用词。
- **「发表过的代码可靠」是一个重复出现的隐含 Warrant。** 按措辞搜到 10 张，分布在 10 篇论文；读下来核心区讲代码的 Native Argument 基本都是这一句式。
- **library 里也有约束验证怎么做的卡片，不只有机会。** `Weis2025:tail-robust`（tail 的密度和形状对初始化种子不敏感，15 个 run）；`PflammAltenburg2023:n_nbody`（稀疏的 tail 需要一个系综，而不是一次大的 N-body run）；`MojtabaGhasemi2026:a-models` 的 Rebuttal（每组参数一个 run）。这次没有系统地找这类卡片。

## 没能确定的

- **「附近」之外的命中率。** 660 张不在核心区和外环的卡片没有读，所以不知道信号在那里的命中率，也不知道那里有没有与想法相关的机会。
- **外环的 Warrant、Qualifier、Rebuttal。** 只读了外环的 Audit Note 和 End Argument 的 Claim。
- **这些机会在领域里是否是新的。** 这需要集合外的文献，例如 PeTar 的代码论文是否已经与 NBODY6 比过 tail。library 回答不了。
- **这些机会在领域上是否成立。** 我按卡片的文字判断，没有核对论文的图和公式，只对 `Gieles2021` 的一段回到了论文 Markdown。
- **判断的稳定性。** 单人单遍。「指向机会」与「边缘」的界线换一个人读会移动；各信号的命中率应读作「大约五分之一」，不应读到个位数。
- **End–End 冲突的完整列举。** 62 张 End Argument 的 Claim 读了，但 1047 个卡片对没有逐对判断。
- **集合外文献的精确计数。** 归并是近似的，1125 和 326 这两个数会随归并规则变化。
