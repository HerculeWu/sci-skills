# 怎么探索装不进 context 的 library

Research ticket [#2](https://github.com/HerculeWu/sci-skills/issues/2)，属于 map [#1](https://github.com/HerculeWu/sci-skills/issues/1)（`research-proposal` skill 的设计）。

本文只报事实和带代价的选项，不选方案。每一节先写**测量事实**（附产生它的命令或方法），我自己的判断单独放在标了「推论」的段落里。

## 0. 样本、单位、方法

- 样本：`/Users/wenjie/programm/astro/tidal_tails_numerical_compare/literatures/`，只读。测量日期 2026-10-13，文件的 mtime 是当天 16:34。仓库在 commit `954ead5`。
- 样本想法（用户原话）："I want to study how we treat the tidal tails in nbody simulation will influence the results of dynamics of tidal tails. Three treatment: integrate tidal tails seperatly (Nbody6), integrate particles in tidal tails together with cluster member (Nbody6), together with cluster member but with tree-code for tail-cluster interaction (PeTar)"
- 单位是**字符**：JavaScript 字符串的 `length`。`jq '[.nodes[]|select(.type=="text")|.text|length]|add' library.canvas` 给出同一个总数 1573067，所以这个样本里它等于 codepoint 数。
- **没有量 token**：本机没有 tokenizer（`python3 -c "import tiktoken"` 报 `ModuleNotFoundError`），也没有把样本发给任何 API。读者要换算时，自己取一个字符/token 的比值；卡片里有大量 LaTeX 和参考文献条目，比值多半低于普通英文散文。这句是推论，不是测量。
- 工具：Node v24.3.0，jq 1.7.1。测量脚本见[附录 A](#附录-a测量脚本)，本文所有表都能用它重跑。它写在样本目录之外，不向样本写任何东西。
- 一张卡片的解析规则（脚本里的 `cards`）：
  - identity card：id 以 `:paper` 结尾。其余 text card 是论证卡片（argument card）。
  - kind：卡片前 5 行里出现 `End Argument` 记为 End，出现 `Native Argument` 记为 Native，否则是中间论证。
  - Claim：从 Claim 标记（`### Claim` / `## Claim` / `**Claim:**`）之后，到下一个标题行或下一个 `**Grounds…**` 之类的标签、`Source:`、`Cites:` 之前。1163 张论证卡片全部抽到了非空的 Claim。
  - **claim line**：一张卡片压成一行，`- <key>:<id> [E|N] <标题> :: <Claim，换行压成空格>`。下文所有「claim line 视图」都是这个格式。

## 1. 样本的形状

测量事实（`node explore-measure.mjs <dir> graph`、`views`，以及 `jq` 对 `library.canvas` 的结构统计）：

| 量 | 值 |
|---|---|
| `library.canvas` | 2 160 752 字节，3724 行 |
| nodes | 1229 = 33 个 group + 1196 张 text card |
| text card | 33 张 identity card + **1163 张论证卡片** |
| 论证卡片的 kind | Native 516，End 142，中间论证 505 |
| edges | 2489 = 论文内 2037 + 跨论文 452 |
| 边的标签 | Grounds 1698，Warrant 400，Backing 283，Rebuttal 108 |
| 跨论文边的标签 | Grounds 407，Backing 22，Rebuttal 12，Warrant 11 |
| 正文字符 | 全部 text card 1 573 067（UTF-8 1 578 108 字节）；identity 23 074；论证卡片 1 549 993 |
| 一张论证卡片 | min 362，p25 958，中位 1228，p75 1584，p90 2044，max 4667，均值 1333 |
| 一条 Claim | min 24，中位 205，p90 333，max 813，均值 220；合计 255 761（占论证卡片正文的 16.5%） |
| `Cites:` 行 | 3082 行，260 689 字符（占 16.8%） |
| 含 `(implicit)` | 673 张 |
| 度（入+出） | 中位 4，p90 8，max 38；入度 max 17，出度 max 33 |
| 弱连通分量 | 5 个：1097、34（Awad2025）、26（Arnold2025）、5（Kroupa2023）、1（一张孤立卡片） |
| 环 | 1 个，4 张卡片，都在 Casamiquela2022 内（`a_atm`、`a_age`、`a_mean`、`a_abund`） |

和 map 的 Notes 对照：

- map 写「1196 张论证卡片」。1196 是 text card 的总数，其中 33 张是 identity card，论证卡片是 1163 张。
- map 写「83 张带 Audit Note」。83 是正文里出现 `Audit Note` 字样的 text card 数：71 张论证卡片 + 12 张 identity card。这 12 张 identity card 没有一张把它写成标题；读过的几张里，这个词出现在颜色图例里（如 "Red cards carry an Audit Note"），不是一条 Audit Note。71 张里有 41 张来自 link list 的 `notes`（41 条都落在论证卡片上），其余来自各篇论文自己的 canvas。
- 33 篇论文、2489 条边、452 条跨论文、673 张 `(implicit)`、约 157 万字符，都和测量一致。
- library 并不严格是 DAG：有上面那 1 个论文内的环。遍历要带 visited 集合。

跨论文的结构：

- 落在跨论文边上的卡片有 326 张：168 张作为被引的源，188 张作为引用方。
- 被引的源：End 178 条边，中间论证 236 条，Native 38 条。引用方：Native 334 条，中间论证 98 条，End 20 条。
- 有 link 的论文对：169 个有序对（共 1056 个可能），168 个无序对（共 528 个）。
- 被引最多的卡片：`Roeser2019a:e_tails` ×33，`Jerabkova2021:e-full-extent` ×16，`Tang2019:end-tails` ×16，`Meingast2019:e_tails` ×15。被引卡片的跨论文出度：中位 2，p90 5，max 33。
- 3 篇论文没有任何跨论文边（Awad2025、Arnold2025、Kroupa2023）；9 篇没有被集合内的论文引用；5 篇没有引用集合内的论文。

## 2. 每篇论文的大小分布

测量事实（`node explore-measure.mjs <dir> papers`；`.md` 的字节数用 `statSync` 另量）。「cites」是这篇论文引用集合内其他论文的 link 数，「cited」是被引用的 link 数。

| key | 卡片 | End | Native | 正文字符 | 裸 Claim 字符 | canvas 字节 | cites | cited |
|---|---|---|---|---|---|---|---|---|
| Kroupa2022 | 44 | 6 | 18 | 67083 | 13780 | 85400 | 27 | 29 |
| Gieles2021 | 34 | 4 | 11 | 66488 | 6550 | 81897 | 0 | 7 |
| Wang2024 | 45 | 6 | 18 | 62273 | 10312 | 83798 | 6 | 0 |
| Oh2020 | 52 | 4 | 24 | 61198 | 13749 | 78949 | 7 | 15 |
| Weis2025 | 40 | 5 | 14 | 60490 | 9004 | 84291 | 15 | 2 |
| Jadhav2025 | 47 | 6 | 18 | 60402 | 12344 | 76559 | 56 | 11 |
| Risbud2025 | 35 | 6 | 15 | 57607 | 7454 | 72970 | 52 | 21 |
| Dinnbier2022 | 35 | 2 | 15 | 57061 | 11257 | 69410 | 4 | 6 |
| Jerabkova2021 | 34 | 6 | 11 | 56183 | 11622 | 72395 | 22 | 79 |
| Sharma2025 | 46 | 5 | 21 | 55546 | 9409 | 75962 | 15 | 5 |
| Kroupa2024 | 33 | 4 | 20 | 55017 | 6788 | 66398 | 26 | 8 |
| Tarricq2022 | 44 | 5 | 19 | 54935 | 8304 | 74856 | 7 | 23 |
| Kos2024 | 36 | 4 | 13 | 53828 | 7143 | 69476 | 28 | 13 |
| Bhattacharya2022 | 42 | 6 | 18 | 52674 | 9346 | 74052 | 17 | 15 |
| Wirth2024 | 32 | 3 | 15 | 52047 | 8669 | 66867 | 2 | 5 |
| Awad2025 | 34 | 4 | 14 | 51857 | 8483 | 71553 | 0 | 0 |
| Ramezani2026 | 41 | 5 | 22 | 50668 | 7862 | 70392 | 41 | 0 |
| Zhang2020 | 48 | 4 | 22 | 49895 | 7487 | 73420 | 11 | 16 |
| Tang2019 | 40 | 4 | 18 | 48549 | 7415 | 71627 | 2 | 28 |
| Casamiquela2022 | 40 | 6 | 23 | 47958 | 7032 | 60181 | 14 | 0 |
| PflammAltenburg2025 | 40 | 5 | 20 | 45414 | 8230 | 60647 | 14 | 2 |
| Boffin2022 | 32 | 5 | 12 | 45111 | 7347 | 56654 | 15 | 25 |
| Sha2024 | 33 | 3 | 17 | 44549 | 5964 | 60466 | 7 | 1 |
| Casamiquela2020 | 34 | 5 | 12 | 43972 | 5625 | 63332 | 3 | 6 |
| Jadhav2026 | 40 | 6 | 20 | 43950 | 8148 | 62797 | 19 | 0 |
| MojtabaGhasemi2026 | 31 | 4 | 15 | 40371 | 7743 | 53420 | 13 | 0 |
| Arnold2025 | 26 | 3 | 12 | 39828 | 5407 | 52523 | 0 | 0 |
| Roeser2019b | 32 | 4 | 12 | 33371 | 6672 | 49635 | 9 | 35 |
| PflammAltenburg2023 | 25 | 4 | 13 | 28173 | 5309 | 39776 | 10 | 14 |
| Roeser2019a | 23 | 3 | 11 | 23295 | 4337 | 33567 | 0 | 55 |
| Meingast2019 | 23 | 2 | 12 | 21869 | 3621 | 29587 | 1 | 31 |
| Qin2025 | 17 | 2 | 9 | 14771 | 2747 | 21136 | 9 | 0 |
| Kroupa2023 | 5 | 1 | 2 | 3560 | 601 | 5475 | 0 | 0 |

| 每篇论文 | min | p25 | 中位 | p75 | p90 | max | 合计 |
|---|---|---|---|---|---|---|---|
| 论证卡片 | 5 | 32 | 35 | 41 | 46 | 52 | 1163 |
| End Argument | 1 | 4 | 4 | 5 | 6 | 6 | 142 |
| Native Argument | 2 | 12 | 15 | 19 | 22 | 24 | 516 |
| 卡片正文字符 | 3560 | 43950 | 50668 | 56183 | 61198 | 67083 | 1 549 993 |
| claim line 视图字符 | 953 | — | 10578 | — | 15334 | 17974 | 346 266 |
| identity card 字符 | 417 | 587 | 667 | 765 | 941 | 1086 | 23 074 |
| 论文内的边 | 5 | 54 | 61 | 78 | 86 | 101 | 2037 |
| per-paper canvas 字节 | 5475 | 56654 | 69410 | 74052 | 81897 | 85400 | 2 069 468 |
| 论文全文 `<Key>.md` 字节 | 1841 | 57413 | 78221 | 98943 | 116834 | 180637 | 2 554 497 |

去掉一篇只有 5 张卡片的 Kroupa2023，论文的大小很均匀：p25 到 max 是 4.4 万到 6.7 万字符。

## 3. 卡片格式在论文之间不统一

测量事实（逐篇统计标题行、Claim 标记、kind 标记、颜色；方法见附录 A 的解析规则，换成逐篇计数）。每篇论文由一个独立的 subagent 读，格式在一篇之内一致，篇与篇之间不同：

- Claim 的标记有三种：`## Claim`（19 篇，673 张）、`### Claim`（8 篇，310 张）、`**Claim:**`（6 篇，180 张）。
- kind 的标记至少九种写法：`**End Argument**`、`*End Argument*`、`**Type:** End Argument`、标题里的 `# E1 · End Argument`、`**Argument** (intermediate)`、`**Native Argument** · Audit Note` 等。按「前 5 行里出现 `End Argument`」判定，得到 142 张 End，全部是论文内没有出边的卡片；论文内没有出边的卡片共 150 张，另外 8 张没有 End 标记。
- 7 篇论文（Meingast2019、Ramezani2026、Risbud2025、Roeser2019a、Roeser2019b、Sha2024、Sharma2025）里，带 kind 的卡片的首行是 `N7 · Native Argument` 或 `A3` 这种编号，不含内容。只看标题行在这 7 篇上没有信息。
- 颜色不能用来判定 kind：论证卡片的颜色是 `4`×424、`5`×131、`1`×63、`6`×44、`3`×8、`2`×3、无色×490。identity card 的图例互相矛盾：Arnold2025 和 Risbud2025 写 End 是 cyan，Kos2024 写 End 是 purple，Weis2025 写 Native 是 cyan、End 是 green。
- 读过的 4 张 identity card（Arnold2025、Kos2024、Risbud2025、Weis2025）都是标题、作者、年份、DOI/arXiv/Bibcode 加一段图例；按正则 `End Arguments?\*\*|# End Arguments?|End Arguments?:` 数，33 张里只有 2 张（Arnold2025、MojtabaGhasemi2026）列出了本篇的 End Arguments。
- 1163 张论证卡片都有 `Source:` 行；764 张有 `Cites:` 行。

## 4. 紧凑视图的大小

测量事实（`node explore-measure.mjs <dir> views`；边列表和论文级的图另用一行脚本渲染后量 `length`）。

| 视图 | 卡片数 | 字符 | 占全文 |
|---|---|---|---|
| 全部 text card 的正文 | 1196 | 1 573 067 | 100% |
| 全部 identity card，正文 | 33 | 23 074 | 1.5% |
| 全部 identity card，只留首行（标题） | 33 | 3 179 | 0.2% |
| `library.links.json` 的 `papers` 渲染成 `- key: label (year)` | 33 | 1 373 | 0.1% |
| End Argument，正文 | 142 | 198 261 | 12.6% |
| End Argument，claim line | 142 | 49 682 | 3.2% |
| End Argument，只留标题行 | 142 | 11 975 | 0.8% |
| **identity card + End Argument，正文** | 175 | 221 335 | 14.1% |
| **identity card + End Argument（claim line）** | 175 | 72 756 | 4.6% |
| **所有论证卡片只留 Claim（claim line）** | 1163 | 346 298 | 22.0% |
| 同上，去掉标题（`- id :: claim`） | 1163 | 288 531 | 18.3% |
| 同上，裸 Claim | 1163 | 255 761 | 16.3% |
| 所有论证卡片只留标题行 | 1163 | 85 983 | 5.5% |
| 非 Native 的卡片，claim line | 647 | 198 382 | 12.6% |
| Native Argument，正文 | 516 | 683 820 | 43.5% |
| 带 `Audit Note` 字样的卡片，正文 | 83 | 141 670 | 9.0% |
| 全部边，一行一条 `from -Label-> to` | 2489 条 | 137 983 | — |
| 跨论文的边，同上 | 452 条 | 25 480 | — |
| 论文级的图，一行一对 `cited -> citing xN` | 169 对 | 5 089 | — |

一篇论文的 claim line 视图：min 953，中位 10 578，max 17 974 字符。

## 5. 一张卡片的 k 跳邻域

测量事实（`node explore-measure.mjs <dir> hops`）。邻域包含起点自己，沿论文内和跨论文的边都走。「both」不分方向；「up」只走向支撑它的卡片（逆着边）；「down」只走向用到它的卡片（顺着边）。统计对象是全部 1163 张论证卡片。

| 方向 | k | 卡片数 min / 中位 / p90 / max | 正文字符 min / 中位 / p90 / max | claim line 字符 min / 中位 / p90 / max | 论文数 中位 / max |
|---|---|---|---|---|---|
| both | 1 | 1 / 5 / 9 / 39 | 1033 / 6228 / 13841 / 72598 | 258 / 1397 / 2957 / 12303 | 1 / 22 |
| both | 2 | 1 / 18 / 44 / 203 | 1098 / 26449 / 70575 / 294493 | 378 / 5563 / 13529 / 56344 | 2 / 27 |
| both | 3 | 1 / 44 / 164 / 476 | 1098 / 65595 / 253832 / 647100 | 378 / 13721 / 50208 / 136264 | 7 / 29 |
| up | 1 | 1 / 3 / 6 / 18 | 362 / 3772 / 8789 / 27671 | 64 / 825 / 1895 / 5499 | 1 / 13 |
| up | 2 | 1 / 6 / 16 / 80 | 362 / 7912 / 22942 / 116721 | 64 / 1669 / 4879 / 21960 | 1 / 14 |
| up | 3 | 1 / 9 / 35 / 158 | 362 / 12937 / 50092 / 221904 | 64 / 2655 / 11353 / 45755 | 1 / 17 |
| down | 1 | 1 / 3 / 5 / 34 | 656 / 3465 / 7878 / 67423 | 128 / 758 / 1715 / 11197 | 1 / 22 |
| down | 2 | 1 / 5 / 16 / 97 | 656 / 7212 / 25309 / 163815 | 128 / 1584 / 4955 / 29947 | 1 / 27 |
| down | 3 | 1 / 9 / 33 / 169 | 656 / 11668 / 51784 / 263869 | 128 / 2588 / 9927 / 51080 | 2 / 27 |

只走论文内的边（both）：k=1 中位 4 张 / 5534 字符，k=2 中位 13 张 / 17 744 字符，k=3 中位 27 张 / 36 481 字符，max 48 张 / 66 488 字符（就是整篇论文）。

闭包（走到头）：

- 一张卡片的完整上游（它依赖的一切）：中位 15 张 / 20 935 字符，p75 171 张 / 213 513 字符，max 634 张 / 851 990 字符。
- 一张 End Argument 的完整上游（142 张）：卡片 min 5、中位 178、p90 511、max 634；正文中位 223 212、max 851 990 字符；claim line 中位 55 092、max 187 482 字符；跨 1 到 24 篇论文，中位 7 篇。
- 一张卡片的完整下游：中位 23 张 / 32 663 字符，max 534 张 / 723 105 字符。

几张样本卡片（`samples.mjs`，逻辑同 `hops`，起点换成指定 id）：

| 卡片 | kind | 入/出/跨 | k=1 卡片·字符 | k=2 卡片·字符 | k=3 卡片·字符·论文数 |
|---|---|---|---|---|---|
| `Kroupa2024:n11`（PeTar 是精确的 direct N-body 码） | Native | 0/1/0 | 2 · 3014 | 7 · 11627 | 29 · 44271 · 8 |
| `Wang2024:N_code`（PeTar，P³T） | Native | 0/1/0 | 2 · 3880 | 12 · 19057 | 34 · 53439 · 2 |
| `Kos2024:a-nbody-check`（简化模拟对照 collisional N-body） | 中间 | 1/1/0 | 3 · 4530 | 13 · 21946 | 34 · 55783 · 8 |
| `Gieles2021:A_setup`（escapers 移出后当 tracer 积分） | 中间 | 4/4/1 | 9 · 16665 | 30 · 56870 | 52 · 94727 · 3 |
| `Weis2025:end-selfgravity`（尾巴的自引力改变尾星角动量） | End | 5/1/1 | 7 · 10144 | 24 · 36500 | 90 · 139900 · 12 |
| `Jadhav2025:n_sim`（PeTar 模型网格） | Native | 0/17/1 | 18 · 23067 | 36 · 43555 | 57 · 76383 · 11 |
| `Roeser2019a:e_tails`（全库被引最多） | End | 5/33/33 | 39 · 72598 | 152 · 235536 | 428 · 604201 · 27 |

这 7 张的 k=1 / k=2 / k=3 正文字符：min 3014 / 11627 / 44271，中位 10144 / 36500 / 76383，max 72598 / 235536 / 604201。

第 8 节手工标出的 50 张相关卡片的邻域：k=1 卡片 2 / 5 / 19（min / 中位 / max），字符 2305 / 6614 / 30610；k=2 卡片 7 / 19 / 66，字符 10656 / 27844 / 105376；k=3 卡片 15 / 45 / 215，字符 17183 / 65210 / 346049。

## 6. 三种文件各提供什么

测量事实（`files` 段、`lines.mjs`、`diff.mjs`、`time jq …`；方法都是读文件后比较或计数）。

| | `library.canvas` | `library.links.json` | 每篇论文的 canvas |
|---|---|---|---|
| 大小 | 2 160 752 字节，3724 行 | 112 890 字节，5384 行（压成一行 87 198 字节） | 5475 到 85 400 字节，中位 69 410；33 个合计 2 069 468 字节、23 856 行 |
| 卡片正文 | 全部 1196 张 | 没有 | 本篇的全部 |
| 论文内的边 | 有（2037） | 没有 | 有 |
| 跨论文的边 | 有（452，`color: "6"`，id 是 `@link-<i>`） | 有（452 条 `links`，带 `from` / `to` / `label`） | 没有 |
| 跨论文的 Audit Note | 有，追加在卡片正文末尾 | 有（41 条 `notes`，共 27 205 字符，中位 586） | 没有 |
| 卡片 id | `<key>:<id>` | `{paper, card}` | 裸 `<id>` |
| 论文元数据 | group 的 `label`；identity card | `key`、`canvas` 路径、`label`、`year` | identity card |
| 布局字段 | `x` `y` `width` `height` `color` `fromSide` `toSide` | 没有 | 同 `library.canvas` |
| 谁写的 | `merge` 每次整张重写 | agent 手写，是连接判断的唯一来源 | `read-a-paper` 写，merge 不改它 |

补充事实：

- `library.canvas` 的字节里，JSON 编码后的卡片正文占 74.7%（1 613 034 字节）；全部边压成一行是 404 607 字节；去掉 `text` 的 nodes 是 122 361 字节。
- `library.canvas` 的卡片正文与对应的 per-paper canvas **逐字相同**的有 1155 张；不同的 41 张，全部是「per-paper 的正文 + 追加的 `## Audit Note` 段」，正好是 link list 的 41 条 `notes`。
- 用仓库里的 `merge()` 在内存中从 `library.links.json` 和 33 个 per-paper canvas 重建，得到的对象与磁盘上的 `library.canvas` 解析后**深度相等**（1229 nodes、2489 edges、0 个跨论文的环），连读 34 个文件在内耗时 47 ms。所以 `library.canvas` 完全可以由另外两者推出。
- 磁盘上的 `library.canvas` 与 `merge` 今天会写出的文本**不是逐字节相同**：磁盘上是一行一个 node 或 edge（`"nodes":[` 后每个对象占一行），而 `runMerge` 写的是 `JSON.stringify(canvas, null, "\t")`，每个字段占一行（2 299 104 字节）。内容相同，排版不同。
- 磁盘上这种一行一个对象的排版下，`grep -n` 能直接按行命中卡片，但一行就是整张卡片的 JSON：3724 行里 171 行超过 2000 字符，最长 4819。例如 `grep -ci petar library.canvas` 得到 19 行。per-paper canvas 的排版各不相同（23 856 行里 136 行超过 2000 字符）。
- 取一张卡片的耗时：`jq '.nodes[]|select(.id=="Gieles2021:A_setup")|.text' library.canvas` 0.038 s；同一张卡片从 per-paper canvas 取 0.007 s；Node 里 `JSON.parse` 整个 `library.canvas` 12.7 ms。取到的都是 2980 字节。
- 样本目录里还有不属于 library 的文件：每篇论文的全文 `<Key>.md`（卡片的 `Source:` 行指向它的章节和图表）、`<Key>.pdf`、`figures/`、`meta.json`（bibcode、标题、作者、`role`、`found_via`），以及顶层的 `README.md`（11 746 字节，`find-papers` 写的清单）。Kroupa2023 没有 `figures/`。

推论（我的判断）：

- 三个文件里没有一个能**不借助脚本**满足所有读取。`library.canvas` 什么都有，但放不进一次 Read；per-paper canvas 是唯一能整个读进 context 的带正文的文件（最大 85 KB，正文 6.7 万字符），但没有跨论文的边，也没有那 41 条 Audit Note；`library.links.json` 是唯一小到可以整个读的文件，它是跨论文结构的索引，没有任何正文。
- **有脚本时**，按需读取最省事的是 `library.canvas`：一个文件、13 ms 解析、id 已经是 proposal 要引用的 `<key>:<id>` 形式、Audit Note 已经在正文里。等价的做法是脚本读 `library.links.json` + per-paper canvas 再调 `merge()`，多 34 次读文件，换来不依赖一份可能过期的 `library.canvas`。
- **没有脚本时**（只用 `jq` 或 Read），per-paper canvas 更合适：它小，按裸 id 取卡片快，但读的人要自己到 `library.links.json` 里查这张卡片的跨论文边和 Audit Note。
- 按行号寻址 `library.canvas` 不可靠：行的排版取决于最后是谁写的文件（见上面第四条事实）。磁盘上这份排版和 `merge` 写出的不同，我推测是 Obsidian 打开后重存的，没有验证。

## 7. `library.mjs` 里能复用来做查询的函数

测量事实（读 `skills/build-argument-library/scripts/library.mjs` 全文；`reuse.mjs` 在样本上逐个调用导出的函数）。导出：`checkCanvas`、`checkLinkList`、`components`、`rankPapers`、`merge`、`run`、`USAGE`、`UsageError`、`InvalidInput`。

| 导出 | 做什么 | 对查询的用处 | 在样本上 |
|---|---|---|---|
| `merge(list, canvases)` | 纯函数，不读写文件。返回 `{ canvas, cycles }`：id 加了 `<key>:` 前缀的全部卡片、论文内的边、跨论文的边、追加好的 Audit Note | 不读 `library.canvas` 就得到整张 library 图 | 与磁盘上的 library 深度相等，47 ms |
| `checkCanvas(canvas)` | per-paper canvas 的问题列表：id、位置和大小、边的两端、identity card | 查询前确认输入可用；proposal canvas 也是 canvas，部分检查可直接用（它要求有 id 为 `paper` 的卡片，这一条对 proposal canvas 不适用） | 33 个 canvas 0 个问题 |
| `checkLinkList(list)` | link list 的结构问题 | 同上 | 0 个问题 |
| `components(nodes, edges)` | Tarjan 强连通分量，按逆拓扑序给出 | 查环；顺带得到卡片图的一个拓扑序 | 1196 张卡片 1193 个分量，找到第 1 节那个 4 张卡片的环，1 ms |
| `rankPapers(keys, edges)` | 论文的层：一篇论文在它引用的每篇论文之上 | 给论文排「谁是地基、谁在最上面」 | 13 层：第 0 层 5 篇，最顶层是 Jadhav2026、MojtabaGhasemi2026、Ramezani2026；Sharma2025 和 Jadhav2025 互相引用，同层 |
| `run(argv, io)`、`USAGE`、`UsageError`、`InvalidInput` | CLI 的约定：一次报出全部问题、`error: …` 到 stderr、退出码 0/1/2、可注入的 stdout/stderr | 新的子命令或兄弟脚本可以沿用同一套约定和测试写法 | `library.test.mjs` 有 21 个 `node:test` 用例 |

没有导出、但查询会想用的：`readJson`、`loadCanvas`（读文件并在每条问题前加路径）、常量 `LABELS` 和 `IDENTITY_ID`；`bounds`、`placeGroups`、`facingSides` 是布局用的，只有当 proposal canvas 由脚本排版时才相关。

**完全没有**的：解析卡片正文（标题、kind、Claim、各个 Toulmin 段、`Source:`、`Cites:`）；邻接表和「某张卡片的上游 / 下游」；k 跳邻域或闭包；按文字搜索；任何只读的 CLI 子命令（现在只有 `check` 和 `merge`，`merge` 会覆盖输出文件）。本文的测量脚本自己实现了这四样，共约 40 行（附录 A 的 `cards`、`up` / `down`、`hop`、`search`）。

## 8. 从样本想法出发，关键词能不能定位到相关卡片

### 8.1 每个词命中多少

测量事实（`node explore-measure.mjs <dir> search '<regex>' [text|claim|title]`，不分大小写；「正文」指整张卡片）。

| 词（正则） | 正文命中 | 论文数 | Claim 命中 | 标题命中 | 命中卡片的正文字符 | 命中卡片的 claim line 字符 |
|---|---|---|---|---|---|---|
| 用户写的词 | | | | | | |
| `tidal[\s-]+tails?` | 289 | 33 | 237 | 54 | 426 406 | 88 552 |
| `\btails?\b` | 601 | 33 | 472 | 223 | 852 685 | 186 900 |
| `\bn[\s-]?body` | 134 | 27 | 50 | 23 | 212 208 | 42 923 |
| `simulat` | 185 | 28 | 53 | 12 | 284 811 | 58 896 |
| `dynamic` | 189 | 30 | 74 | 17 | 279 307 | 60 378 |
| `nbody\s?-?6` | 12 | 9 | 8 | 4 | 22 098 | 3 802 |
| `petar` | 17 | 5 | 7 | 6 | 30 301 | 5 375 |
| `\btree\b` | 13 | 10 | 4 | 2 | 17 078 | 4 295 |
| `integrat` | 66 | 25 | 22 | 5 | 103 101 | 19 276 |
| `separate` | 65 | 27 | 17 | 3 | 97 176 | 19 098 |
| `cluster\s+members?` | 29 | 16 | 9 | 2 | 40 187 | 7 744 |
| `\btreat` | 38 | 17 | 4 | 0 | 55 187 | 11 790 |
| `interact` | 36 | 18 | 12 | 1 | 52 248 | 11 841 |
| 用户没写、领域里的近义词 | | | | | | |
| `escap` | 146 | 28 | 48 | 16 | 208 092 | 48 453 |
| `direct\s+n[\s-]?body` | 18 | 12 | 9 | 2 | 33 394 | 5 916 |
| `hermite` | 12 | 9 | 3 | 3 | 20 332 | 3 163 |
| `regulari[sz]` | 11 | 10 | 1 | 0 | 21 768 | 3 127 |
| `soften` | 16 | 7 | 6 | 3 | 29 459 | 5 136 |
| `time[\s-]?steps?` | 10 | 5 | 0 | 0 | 17 456 | 3 462 |
| `test[\s-]particles?\|streak[\s-]?line\|particle[\s-]spray\|restricted` | 19 | 11 | 5 | 3 | 27 644 | 5 498 |
| `tidal field\|galactic potential\|external potential\|galactic tide` | 134 | 29 | 38 | 13 | 209 823 | 43 542 |
| `epicycl` | 52 | 16 | 25 | 15 | 78 488 | 20 417 |

`\btree\b` 的 13 个命中逐条看过：4 张讲 tree code（`Arnold2025:n-code` 的 GPU tree code、`Arnold2025:n-bv21` 的 GOTHIC、`Kroupa2024:n11` 的 Barnes–Hut、`Wang2024:N_code` 的 P³T），7 张是 minimum spanning tree，1 张是 k-d tree，1 张是 HDBSCAN 的层次树。Claim 里命中的 4 张全部是 minimum spanning tree。

### 8.2 命中里有多少是相关的

这一小节依赖一个**手工标注的相关集合**，标注是我的判断，不是测量。测量的是各个查询与这个集合的交集。

- 相关的定义：一张卡片说明了库里某个模拟怎样积分星团和已经离开星团的恒星（代码、积分器、escapers 的处理、softening、test particle），或对比了两种这样的处理，或给出一个取决于这种处理的尾巴动力学结果。
- 得到的方法：把本研究跑过的所有查询的命中汇在一起（pooling），逐条读 claim line 和命中处的上下文后标注。共 **50 张，分布在 19 篇论文里**，id 列在[附录 B](#附录-b手工标注的相关集合)。
- 所以「召回」是相对这 50 张的 **pooled recall**，是真实召回的上界；真正相关而没有任何查询碰到的卡片不在分母里。
- 对宽查询里没标注的命中做了等距抽样（按 id 排序后每隔固定步长取一张）：`n-body|simulat*` 的 218 张未标注命中里抽 30 张，1 张相关（`PflammAltenburg2025:n-softening`，之后补进了集合），3 张两可；`tidal tail` 的 272 张未标注命中里抽 25 张，0 张相关。
- Q1、Q2、Q9、Q10 的命中我都逐条看过；其余宽查询的精度按「命中里属于这 50 张的比例」算，是下界。

测量事实（`search … <where> relevant-ids.txt`；`eval.mjs` 是同一逻辑加上 AND 和邻域扩展）：

| 查询 | 搜哪里 | 命中 | 论文 | 相关 | 精度 | pooled recall | 命中的正文字符 | claim line 字符 |
|---|---|---|---|---|---|---|---|---|
| Q1 用户写的代码名 `nbody6\|petar` | 正文 | 27 | 11 | 18 | 0.67 | 0.36 | 48 842 | 8 546 |
| Q1 | Claim | 15 | 9 | 11 | 0.73 | 0.22 | 27 615 | 4 514 |
| Q1 | 标题 | 10 | 8 | 10 | 1.00 | 0.20 | 19 380 | 2 829 |
| Q2 = Q1 + `tree` | 正文 | 37 | 16 | 19 | 0.51 | 0.38 | 60 693 | 11 968 |
| Q3 `tidal tail` | 正文 | 289 | 33 | 17 | 0.06 | 0.34 | 426 406 | 88 552 |
| Q4 `n-body` | 正文 | 134 | 27 | 31 | 0.23 | 0.62 | 212 208 | 42 923 |
| Q4 | 标题 | 23 | 17 | 19 | 0.83 | 0.38 | 38 235 | 7 684 |
| Q5 `simulat*` | 正文 | 185 | 28 | 27 | 0.15 | 0.54 | 284 811 | 58 896 |
| Q6 `n-body\|simulat*` | 正文 | 254 | 30 | 39 | 0.15 | 0.78 | 396 870 | 81 485 |
| Q6 | Claim | 91 | 22 | 24 | 0.26 | 0.48 | 142 002 | 29 604 |
| Q7 `integrat*` | 正文 | 66 | 25 | 23 | 0.35 | 0.46 | 103 101 | 19 276 |
| Q8 用户全部实词的 OR | 正文 | 660 | 33 | 47 | 0.07 | 0.94 | 951 340 | 202 687 |
| Q8 | Claim | 406 | 33 | 37 | 0.09 | 0.74 | 585 887 | 124 928 |
| Q9 用户没写的近义词 | 正文 | 52 | 18 | 27 | 0.52 | 0.54 | 85 241 | 16 335 |
| Q9 | Claim | 21 | 10 | 17 | 0.81 | 0.34 | 33 665 | 6 600 |
| Q10 = Q1 OR Q9 | 正文 | 71 | 22 | 38 | 0.54 | 0.76 | 118 077 | 22 670 |
| Q10 | Claim | 35 | 16 | 27 | 0.77 | 0.54 | 59 312 | 10 850 |
| Q11 `(n-body\|simulat*)` AND `tail` | 正文 | 184 | 28 | 25 | 0.14 | 0.50 | 292 737 | 60 826 |
| Q12 `(n-body\|simulat*)` AND `(code\|integrat*\|escap*)` | 正文 | 92 | 23 | 32 | 0.35 | 0.64 | 150 786 | 29 359 |
| Q1 的命中 + 它们的 1 跳邻域 | — | 130 | 19 | 23 | 0.18 | 0.46 | 205 310 | 42 274 |
| Q1 的命中 + 2 跳邻域 | — | 363 | 28 | 28 | 0.08 | 0.56 | 566 084 | 119 493 |

Q8 的正则是 `tidal[\s-]+tails?|\bn[\s-]?body|simulat|dynamic|nbody\s?-?6|petar|\btree\b|integrat|separate|cluster\s+members?|\btreat|interact`。Q9 的正则是 `escapers? (are |were )?(removed|kept|retained|integrated|followed)|as tracers|test[- ]particles?|self-gravit|P3T|particle[- ]tree|non-collisional|collisionless|massless|soften|hermite|regulari[sz]|direct summation`。

其他测量事实：

- 用户全部实词的 OR（Q8）命中 660 张，是论证卡片的 57%。它漏掉的 3 张相关卡片都在 Weis2025（`dl-direct`、`slow-encounters`、`end-tail-shift`），讲的是尾星角动量的变化。
- Q1 的 9 张不相关命中是把某个 PeTar 或 NBODY6 模型当参照物用的卡片（如 `Boffin2022:alt-ccp`、`Boffin2022:end-initial-mass`、`Sharma2025:n_wirth`、`Wang2024:A_cmd`），不是说明处理方式的卡片。
- Q1 的 18 张相关命中里，代码名出现在 Claim 里的有 11 张；另外 7 张只在 Grounds 或 Backing 里出现。
- 50 张相关卡片的 kind：Native 25，中间论证 22，End 3。
- 50 张里，两端都在集合内的边有 36 条，其中跨论文的只有 2 条；有跨论文边的相关卡片 10 张，没有的 40 张；没有任何上游卡片的 21 张。集合内部按边连成 21 组，最大的一组 9 张（Weis2025）。
- 含相关卡片的 19 篇论文，卡片正文合计 989 080 字符（694 张）；每篇里相关卡片占 1/34 到 9/40。50 张相关卡片自己的正文是 84 234 字符，claim line 是 16 064 字符。
- 与想法最贴近的内容在 Grounds 和 Backing 里，不在 Claim 里。两个读过全文的例子：
  - `Gieles2021:A_setup` 的 Claim 是「两组模型网格分离黑洞的作用」；它的 Grounds 写 "Escapers removed at 40 half-mass radii and integrated as tracers in the Galactic potential to build the tails"，Backing 写 "Neglecting the cluster's force on tail stars is justified: it is ~2×10⁻⁵ of the total force for stars that just left"。
  - `Jadhav2025:n_caveats` 的 Claim 讲模型网格之外的过程；它的 Grounds 写 "Computational: floating-point precision, choice of code"，Qualifier 写 "should be similar in any setup, given a reliable N-body code -- stated, not tested in this paper"。

推论（我的判断）：

- 关键词**能**定位到相关卡片，但用户的原话不够：库的主题词（`tidal tail`、`tail`、`dynamics`）几乎没有区分度，因为整个库都在讲它；有区分度的是代码名，而它只覆盖三分之一；另外三分之一到一半要靠用户没写的近义词（`test particle`、`tracers`、`self-gravity`、`softening`、`Hermite`、`collisionless`）。这些词是我读了前几轮命中之后才知道要搜的，也就是说搜索是迭代的。
- 只搜 Claim 更准但漏得多（Q10：0.77 / 0.54 对 0.54 / 0.76）。对这个想法，Claim 视图和 End Argument 视图会系统性地藏起相关内容：相关集合里 End 只有 3 张，一半是 Native，而且关键句在 Grounds / Backing 里。这个结论只对「方法类」的想法成立；一个关于科学结论的想法可能相反，本样本没有测。
- 沿图扩展对这个想法帮助很小：从 Q1 的命中走 1 跳，卡片数变成 4.8 倍，pooled recall 只从 0.36 到 0.46。原因在上面的事实里：相关卡片大多是各篇论文里的 Native「代码 / 设置」卡片，彼此之间几乎没有跨论文的边。

## 9. 探索方式与代价

这里只列选项和量到的代价，不选。字符数都是读进 context 的卡片文字，不含工具调用本身的开销。

| # | 做法 | 一次读入多少 | 在样本想法上量到的 | 量到的局限 |
|---|---|---|---|---|
| A | 整库读入 | 1 573 067 字符 | — | 放不进一个 context |
| B | 论文优先：先读 identity card，挑论文，再整篇读 per-paper canvas | identity card 23 074（只标题 3 179）；之后每篇正文 3 560 到 67 083，中位 50 668（文件 5 到 85 KB） | 含相关卡片的论文有 19 篇，合计 989 080 字符；每篇里相关的只有 1 到 9 张 | identity card 只有 2 张列了 End Arguments，读过的其余几张只有题目、书目信息和图例；per-paper canvas 没有跨论文的边和 41 条 Audit Note |
| C | End Argument 优先：identity card + 全部 End Argument | 正文 221 335；claim line 72 756 | 50 张相关卡片里 End 只有 3 张 | 7 篇论文的标题行是编号，标题视图在这些论文上无效 |
| D | Claim 索引：所有论证卡片的 claim line | 346 298（去标题 288 531；裸 Claim 255 761）；按论文分块时每块 953 到 17 974，中位 10 578 | Q1 的 18 张相关命中里 7 张的关键词不在 Claim 里 | 三种 Claim 标记，要宽容的解析；Grounds / Backing 里的内容看不到 |
| E | 关键词搜索，再读命中 | Q1：正文 48 842 或 claim line 8 546；Q10：118 077 或 22 670；Q6：396 870 或 81 485；Q8：951 340 或 202 687 | 精度 / pooled recall：Q1 0.67 / 0.36，Q10 0.54 / 0.76，Q6 0.15 / 0.78，Q8 0.07 / 0.94 | 好用的词要靠迭代得到；对原始文件 `grep` 返回的是整行 JSON（171 行超过 2000 字符） |
| F | 沿图走：从种子卡片取 k 跳邻域 | k=1 中位 6 228，p90 13 841，max 72 598；k=2 中位 26 449，p90 70 575，max 294 493；k=3 中位 65 595，p90 253 832，max 647 100。只走上游时 k=3 中位 12 937，max 221 904 | Q1 的命中 + 1 跳：130 张 / 205 310 字符，pooled recall 0.46；+ 2 跳：363 张 / 566 084 字符，0.56 | 遇到枢纽卡片会爆（`Roeser2019a:e_tails` 的 1 跳就是 39 张 / 72 598 字符）；一张 End Argument 的完整上游中位 223 212 字符，max 851 990；库里有 1 个环 |
| G | 每篇论文一个 subagent，带着想法读本篇的 canvas，交回相关卡片的 id | 33 个 context，每个 3 560 到 67 083 字符的卡片正文（文件最大 85 400 字节）；合计读 1 549 993 字符 | 没有量：交回内容的大小、判断质量、总耗时 | 每个 subagent 看不到别的论文，跨论文的联系要由上层再拼 |
| H | 先看跨论文的骨架 | 论文级的图 5 089 字符（169 对）；452 条跨论文的边 25 480 字符；`rankPapers` 给出 13 层 | 50 张相关卡片里只有 10 张碰到跨论文的边，集合内部的跨论文边只有 2 条 | 骨架只来自引用；互不引用的论文之间没有边 |

可以叠加的组合，代价按上表相加。例如：E（Q10，claim line 22 670 字符）筛出 71 张，再读其中相关的 38 张的正文；或 D 按论文分块交给 G。

## 10. 没量到的，和原因

- **token 数**：没有本地 tokenizer，也没有把样本发给外部 API。全文只有字符数。
- **真实召回**：只有 pooled recall。要真实召回，得把 1163 张卡片全部按相关性标一遍；我只标了各查询碰到并读过的卡片，加上两次等距抽样（共 55 张）。
- **语义检索**（embedding 相似度）：仓库和本机都没有现成的设施，没有试。
- **agent 实际会怎么走**：一个 agent 拿着某种视图能不能挑对卡片、要几轮，这是端到端的行为；按 `AGENTS.md`，端到端测试由用户在 mock 项目里做。本文量的是每种视图的大小和关键词的命中，不是 agent 的表现。
- **subagent 方案（G）的耗时和回传大小**：没有派 subagent。
- **别的想法**：只有一个样本想法，而且是方法类的。第 8 节关于 Claim 视图和图扩展的结论不能直接推到别的想法上。
- **磁盘上的 `library.canvas` 为什么和 `merge` 的输出排版不同**：只确认了内容相同，没有查是谁重写的。

## 11. 推论：map 上可能还没有的待决问题

以下都是我的判断，供后面的决定用，不是测量。

1. **卡片格式由谁来统一。** 第 3 节的事实是：Claim、kind、标题、颜色四样在论文之间都不一致。任何「只留 Claim」「只看 End Argument」的视图都要靠解析；要么查询脚本宽容地解析（本文的做法，三种 Claim 标记 + 前 5 行里找 kind），要么回到上游，在 `read-a-paper` 的 `canvas-output.md` 里把格式定死，已有的 canvas 重读或迁移。这会牵动另一个 skill。
2. **查询脚本读哪份数据、放在哪里。** `library.canvas` 与 `library.links.json` + per-paper canvas 内容等价（第 6 节）。脚本是加进 `library.mjs` 成为只读子命令，还是 `research-proposal` 自己带一份；proposal 引用的 `<key>:<id>` 以哪一份为准。map 的「Not yet specified」里有「skill 需要哪些脚本」，但没有这个具体的分叉。
3. **用户的原话和库的用词之间的差距怎么补。** 第 8 节：用户的词要么太宽（Q8，57% 的卡片），要么太窄（Q1，三分之一）。补上差距的近义词来自领域知识和前几轮命中。是 agent 自己迭代扩词，还是先向用户问清想法，还是先让 agent 读一个便宜的全库视图来学库的用词，这一步现在不在 map 上。
4. **探索的单位是 Claim 还是整张卡片。** 对样本想法，决定性的句子在 Grounds 和 Backing 里（`Gieles2021:A_setup` 的「忽略星团对尾星的力是合理的，约 2×10⁻⁵」正是三种处理方式之一的依据）。如果探索只在 Claim 层面进行，这类内容进不了 proposal。
5. **没有引用边的张力要不要在探索阶段找。** map 已经记下「互不引用的两篇论文即使结论冲突，也没有边」这个事实。样本里它有一个具体的例子：`Gieles2021:A_setup`（把 escapers 当 tracer 积分，忽略星团对它们的力）和 `Weis2025:end-selfgravity`（尾巴的自引力是改变尾星角动量的主导力）正好是样本想法要比较的两端，而这两篇论文之间没有 link，两张卡片之间没有有向路径（谁也不依赖谁），无向最短路径要 9 跳、中间穿过 4 篇别的论文（量法：在全图上做 BFS）。是否把「找出这种没有边的成对卡片」算作探索的职责，map 上还没有决定。
6. **library 不严格是 DAG。** 有 1 个论文内的 4 卡片环。proposal 的图如果要建在 library 之上并做「一个 Conjecture 定案后谁会倒」的传播，传播规则要说明遇到环怎么办。

## 附录 A：测量脚本

存成 `explore-measure.mjs`，放在样本目录之外。它只读 `library.canvas` 和 `library.links.json`（`papers` 子命令另外 `stat` 每篇论文的 canvas）。

```js
// usage: node explore-measure.mjs <library-dir> papers|views|hops|graph
//        node explore-measure.mjs <library-dir> search '<regex>' [text|claim|title] [relevant-ids.txt]
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
const [L, cmd, ...rest] = process.argv.slice(2);
const lib = JSON.parse(readFileSync(join(L, "library.canvas"), "utf-8"));
const list = JSON.parse(readFileSync(join(L, "library.links.json"), "utf-8"));

const CLAIM = /^(?:#{1,6}\s*Claim\s*$|\*\*Claim:?\*\*:?)/m;
const NEXT = /^(?:#{1,6}\s|\*\*(?:Grounds|Warrant|Backing|Qualifiers?|Rebuttals?|Source|Cites|Audit)[^*]*\*\*|Source:|Cites:)/m;
const cards = lib.nodes.filter((n) => n.type === "text").map((n) => {
  const [paper, ...r] = n.id.split(":");
  const lines = n.text.split("\n");
  const head = lines.slice(0, 5).join("\n");
  const m = CLAIM.exec(n.text);
  const after = m ? n.text.slice(m.index + m[0].length).replace(/^\s+/, "") : "";
  const end = after.search(NEXT);
  return { id: n.id, paper, identity: r.join(":") === "paper", text: n.text,
    title: lines[0].replace(/^#+\s*/, "").trim(),
    kind: /End Argument/.test(head) ? "End" : /Native Argument/.test(head) ? "Native" : "",
    claim: (end === -1 ? after : after.slice(0, end)).trim() };
});
const byId = new Map(cards.map((c) => [c.id, c]));
const args = cards.filter((c) => !c.identity);
const edges = lib.edges.map((e) => ({ from: e.fromNode, to: e.toNode, label: e.label, cross: e.fromNode.split(":")[0] !== e.toNode.split(":")[0] }));
const up = new Map(cards.map((c) => [c.id, []])), down = new Map(cards.map((c) => [c.id, []]));
for (const e of edges) { up.get(e.to).push(e.from); down.get(e.from).push(e.to); }

const line = (c) => `- ${c.id}${c.kind ? ` [${c.kind[0]}]` : ""} ${c.title} :: ${c.claim.replace(/\s*\n\s*/g, " ")}`;
const full = (cs) => cs.reduce((s, c) => s + c.text.length, 0);
const view = (cs) => cs.map(line).join("\n").length;
const stat = (xs) => { const s = [...xs].sort((a, b) => a - b); const at = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return `min=${s[0]} median=${at(0.5)} p90=${at(0.9)} max=${s.at(-1)} sum=${s.reduce((a, b) => a + b, 0)}`; };
function hop(start, k, dir = "both") {
  const seen = new Set([start]); let frontier = [start];
  for (let d = 0; d < k && frontier.length; d++) {
    const next = [];
    for (const id of frontier) for (const n of [...(dir !== "down" ? up.get(id) : []), ...(dir !== "up" ? down.get(id) : [])]) if (!seen.has(n)) { seen.add(n); next.push(n); }
    frontier = next;
  }
  return [...seen].map((id) => byId.get(id));
}

if (cmd === "papers") {
  const rows = list.papers.map((p) => { const cs = args.filter((c) => c.paper === p.key);
    return { key: p.key, cards: cs.length, End: cs.filter((c) => c.kind === "End").length, Native: cs.filter((c) => c.kind === "Native").length, chars: full(cs), claimView: view(cs), canvasBytes: statSync(join(L, p.canvas)).size }; });
  console.table(rows.sort((a, b) => b.chars - a.chars));
  for (const k of ["cards", "End", "Native", "chars", "claimView", "canvasBytes"]) console.log(k.padEnd(12), stat(rows.map((r) => r[k])));
}
if (cmd === "views") {
  const id = cards.filter((c) => c.identity), E = args.filter((c) => c.kind === "End");
  console.log("all text cards, full text      ", full(cards), cards.length);
  console.log("identity cards, full text      ", full(id), id.length);
  console.log("End Arguments, full text       ", full(E), E.length);
  console.log("End Arguments, claim lines     ", view(E));
  console.log("identity + End (claim lines)   ", full(id) + view(E));
  console.log("every argument card, claim line", view(args), args.length);
  console.log("every argument card, bare Claim", args.reduce((s, c) => s + c.claim.length, 0));
  console.log("empty Claims                   ", args.filter((c) => !c.claim).length);
}
if (cmd === "hops") for (const dir of ["both", "up", "down"]) for (const k of [1, 2, 3]) {
  const sets = args.map((c) => hop(c.id, k, dir));
  console.log(`${dir} k=${k} cards: ${stat(sets.map((s) => s.length))}\n${dir} k=${k} chars: ${stat(sets.map(full))}\n${dir} k=${k} claim lines: ${stat(sets.map(view))}`);
}
if (cmd === "graph") {
  const x = edges.filter((e) => e.cross);
  console.log("argument cards", args.length, "edges", edges.length, "cross-paper", x.length);
  console.log("cards on a cross-paper edge", new Set(x.flatMap((e) => [e.from, e.to])).size, "linked paper pairs", new Set(x.map((e) => `${e.from.split(":")[0]}>${e.to.split(":")[0]}`)).size);
  console.log("degree:", stat(args.map((c) => up.get(c.id).length + down.get(c.id).length)));
}
if (cmd === "search") {
  const re = new RegExp(rest[0], "i"), where = rest[1] ?? "text";
  const R = rest[2] ? new Set(readFileSync(rest[2], "utf-8").split(/\s+/).filter(Boolean)) : null;
  const hits = args.filter((c) => re.test(c[where]));
  console.log(`${hits.length} cards, ${new Set(hits.map((c) => c.paper)).size} papers, full ${full(hits)} chars, claim lines ${view(hits)} chars` + (R ? `, relevant ${hits.filter((c) => R.has(c.id)).length}/${R.size}` : ""));
  if (process.env.SHOW) for (const c of hits) console.log(line(c));
}
```

本文里没有收进这个脚本的测量，方法如下，都是几行的一次性脚本：

- 第 3 节：对每篇论文的卡片，数首行的 `#` 层级、Claim 标记的写法、前 5 行里 kind 那一行的写法、`color` 的值。
- 第 4 节的边列表和论文级的图：把 `edges` 渲染成 `from -Label-> to`、把 `links` 按 `from.paper -> to.paper` 计数后渲染，量 `length`。
- 第 5 节的闭包：`hop(id, Infinity, "up" | "down")`。
- 第 6 节：逐张比较 `library.canvas` 与 per-paper canvas 的 `text`；`import { merge }` 后比较 `JSON.stringify(JSON.parse(磁盘文件))` 与 `JSON.stringify(merge(list, canvases).canvas)`；按 `\n` 切行量每行长度。
- 第 7 节：`import * as mod from ".../library.mjs"`，打印 `Object.keys(mod)`，在样本上依次调用 `checkLinkList`、`checkCanvas`、`merge`、`rankPapers`、`components`。
- 第 8.2 节的 AND 查询：两个正则都命中才算。邻域扩展：对 Q1 的每个命中取 `hop(id, k)`，求并集，去掉 identity card。等距抽样：未标注的命中按 id 排序，取第 `floor(i × 总数 / n)` 张。

可以直接对 `library.canvas` 用的 `jq`：

```bash
jq '[.nodes[]|select(.type=="text")]|length' library.canvas                                   # 1196
jq '[.nodes[]|select(.type=="text")|.text|length]|add' library.canvas                         # 1573067
jq '[.edges[]|select((.fromNode|split(":")[0]) != (.toNode|split(":")[0]))]|length' library.canvas   # 452
jq -r '.nodes[]|select(.id=="Gieles2021:A_setup")|.text' library.canvas                       # 一张卡片的正文
jq -c '[.edges[]|select(.fromNode=="Gieles2021:A_setup" or .toNode=="Gieles2021:A_setup")|{f:.fromNode,t:.toNode,l:.label}]' library.canvas   # 它的邻边
```

## 附录 B：手工标注的相关集合

50 张，我的判断（定义见 8.2）。存成 `relevant-ids.txt` 后可作 `search` 的第四个参数。

```text
Arnold2025:n-code Arnold2025:a-sim-suite Arnold2025:n-bv21
Awad2025:i-nbody
Boffin2022:n-petar Boffin2022:sim-prediction
Casamiquela2022:n_testparticle Casamiquela2022:a_sim
Dinnbier2022:n-nbody-models Dinnbier2022:a-nbody-check Dinnbier2022:a-width-nbody-check
Gieles2021:A_setup Gieles2021:N_code
Jadhav2025:n_sim Jadhav2025:n_caveats Jadhav2025:e_baseline
Jadhav2026:n-nbody-setup
Jerabkova2021:n-nbody-tools Jerabkova2021:n-prior-nbody Jerabkova2021:i-m1-model
Kos2024:a-sim-design Kos2024:a-nbody-check
Kroupa2022:n-no-collisional
Kroupa2024:n11 Kroupa2024:i7 Kroupa2024:n14
MojtabaGhasemi2026:n-code
PflammAltenburg2023:n_testparticle PflammAltenburg2023:n_hermite PflammAltenburg2023:a_mc_setup PflammAltenburg2023:n_nbody
PflammAltenburg2025:n-hermite PflammAltenburg2025:n-collisionless PflammAltenburg2025:n-softening PflammAltenburg2025:a-softrole
Sharma2025:n_sim Sharma2025:a_nbody
Wang2024:N_code Wang2024:A_setup
Weis2025:n-phigpu Weis2025:sim-suite Weis2025:dl-direct Weis2025:torque-decomp Weis2025:slow-encounters Weis2025:dl-general Weis2025:end-selfgravity Weis2025:end-tail-shift Weis2025:field-stars
Wirth2024:n-nbody6 Wirth2024:a-models
```
