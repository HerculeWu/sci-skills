# Comparison table · tail-treatment

> PROTOTYPE sample: for the format only. A few rows filled, taken from research reports, not checked one by one.

Goal: tail 星在 N-body 模拟里的处理方式，如何影响 (a) tail 本身的结构和运动学，(b) 从 tail 推出的结论？
Library: `../astro/tidal_tails_numerical_compare/literatures/` (33 papers, Shorts in `shorts/`)

## Elements

| id | Element | Source | Added in |
|---|---|---|---|
| T | 三种处理方式（分开积分 / 一起积分 / 一起积分加 tree） | said by the user | round 1 |
| Q1 | epicyclic overdensity 的位置 | drawn from the library (`Kroupa2022:e-kuepper`) | round 1 |
| Q2 | tail 沿轨道的数密度剖面 | drawn from the library (`Weis2025:tail-robust`) | round 1 |
| Q3 | 逃逸后 tail 星的 ΔL_z | drawn from the library (`Weis2025:end-selfgravity`) | round 1 |
| K | constraints and warnings for this kind of run | fixed | round 1 |
| S | scatter or effect sizes usable as a yardstick | fixed | round 1 |

## Opening record

The scope of every "silent" is the papers listed here.

| Element | Papers opened (chosen from the Shorts) | Count | Round |
|---|---|---|---|
| T | Arnold2025, Awad2025, Boffin2022, Casamiquela2022, Dinnbier2022, Gieles2021, Jadhav2025, Jadhav2026, Jerabkova2021, Kos2024, Kroupa2022, Kroupa2024, MojtabaGhasemi2026, PflammAltenburg2023, PflammAltenburg2025, Sharma2025, Wang2024, Weis2025, Wirth2024 | 19 | 1 |
| … | … | … | … |

## Papers × elements

Stances: **established** / **assumed** / **disputed** / **silent** (full text checked) / **no card mentions it** (no full text) / — (does not apply)

| Paper | T: treatment | Q3: ΔL_z | K: constraints | S: yardstick |
|---|---|---|---|---|
| Gieles2021 | **established**: 逃逸星移出后作 tracer 积分（`A_setup` Grounds） | **assumed**: 忽略星团对 tail 星的力（`A_setup` Backing） | — | — |
| Weis2025 | **established**: φ-GPU，全部保留（`n-phigpu`） | **established**: 自引力最多占 70%（`end-selfgravity`） | tail 结构对种子不敏感（`tail-robust`） | 15 次实现的 1σ 带（`seed-scatter`） |
| Casamiquela2022 | **established**: test particle，无星–星引力（`n_testparticle`） | **assumed (reader's inference)**: 逃逸后路径只由轨道和银河势决定（`n_testparticle` Warrant） | — | — |
| Wirth2024 | **silent**: 只写 NBODY6，逃逸星怎么积分全文未提 | — | — | 32 个模型（`a-models`） |
| Kos2024 | **established**: 无质量粒子（`a-sim-design`） | **assumed**: 同上 | 与 BHTree 碰撞模拟一致（`a-nbody-check`） | 50 次重复（`a-nbody-check`） |

## Findings across papers

| id | Finding | Cards | On the canvas |
|---|---|---|---|
| D1 | Weis2025 的自引力结论与「忽略星–星引力」的做法冲突，两边互不引用 | `Weis2025:end-selfgravity`, `Kos2024:a-sim-design`, `Casamiquela2022:n_testparticle` | yes (discussion argument) |
| B1 | Pal 5 有两组现成模拟，分别对应处理 1 和 3 | `Gieles2021:A_setup`, `Wang2024:A_setup` | yes (benchmark) |

## Candidates

| Round | Verification group | Costly? | Conjectures | Status | Reason |
|---|---|---|---|---|---|
| 1 | V1：Pal 5 轨道，三种处理 × K 种子 | yes | C1, C2, C3 | chosen | |
| 1 | V0：比较已发表的 Pal 5 tail 图 | no | C0 | chosen | |
| 1 | V3：Hyades 类模型，处理 1 对 2 | yes | 在 Hyades 上重现 `Jerabkova2021:i-m1-model` | not chosen | user: 先做 Pal 5 |
| 1 | V4：test particle 对 N-body 的 overdensity 位置 | yes | … | ruled out | collaborator: Kos2024 已比较过 |

## Papers that may be worth adding to the library

Works outside the set, cited by the cards the chosen candidates move. Adding them is the user's choice.

| Cited on | Work (as on the `Cites:` line) |
|---|---|
| `Casamiquela2022:n_testparticle` | Montuori et al. 2007, ApJ, 659, 1212 |
| `PflammAltenburg2023:n_nbody` | Küpper et al. 2010 |
