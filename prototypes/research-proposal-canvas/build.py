"""PROTOTYPE, throwaway: renders one sample research-proposal round as two canvas layouts.

Wayfinder ticket #10 (proposal canvas card format). Not part of the skill.
Run: python3 build.py   -> writes proposals/tail-treatment/round-1-A.canvas and round-1-B.canvas
"""
import json
import math
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "proposals", "tail-treatment")

# Colours (Obsidian canvas presets): 1 red, 2 orange, 3 yellow, 4 green, 5 cyan, 6 purple.
GOAL, ESTABLISHED, COSTLY, CHEAP, CONJ, OUTLOOK, FLAG = "5", "4", "2", "3", "3", "6", "1"

# ---------------------------------------------------------------- content
# zone: lib | est | round | outlook | goal | note
cards = {}


def card(cid, zone, text, color=None, width=440):
    cards[cid] = {"zone": zone, "text": text.strip(), "color": color, "width": width}


card("note", "note", """
# PROTOTYPE · 第 1 轮 proposal 样张

只为看格式，不是真的 proposal。
- library 卡片的摘要取自样本 library 原文的开头，个别是 research 报告里的转述，**未逐条核实**。
- 数字、判据都是示意。

## 图例
- 青色：目标卡片
- 无色：library 卡片（只引用，内容以 library 为准）
- 绿色：proposal 自己的已站稳论证（动机、讨论、基准）
- 橙色：**昂贵**的 Verification（设计论证）
- 黄色：便宜的 Verification，以及所有 Conjecture
- 紫色：展望（非承诺）
- 红色：⚠ 例外（做不到浅），本轮没有

边的标签：`Grounds` `Warrant` `Backing` `Rebuttal`；
Conjecture 的出边写成「成立 → Backing」「不成立 → Grounds」。
""", None, 420)

card("G", "goal", """
# 目标 · 第 1 轮

**问题**：tail 星在 N-body 模拟里的处理方式，如何影响
(a) tail 本身的结构和运动学，(b) 从 tail 推出的结论？ — *用户说的；(a)(b) 两者都要，对齐时确认*

**研究对象**：一般意义上的星团 tidal tail — *用户说的*

**抓手**：三种处理 — *用户说的*
1. tail 星与星团分开积分（NBODY6）
2. tail 星与星团成员一起积分（NBODY6）
3. 一起积分，tail–星团相互作用用 tree（PeTar）

**要看的量** — *从 library 提*
- epicyclic overdensity 的位置（`Kroupa2022:e-kuepper`）
- tail 沿轨道的数密度剖面（`Weis2025:tail-robust`）
- 逃逸后 tail 星的 ΔL_z（`Weis2025:end-selfgravity`）

**新颖性只相对于 library 判断，未查 library 之外的文献。**

对齐于 2026-10-14 · 打开了 33 篇里的 19 篇（见 table.md）
""", GOAL, 520)

# library cards (compact references)
card("L_gieles_setup", "lib", """
`Gieles2021:A_setup` · 中间论证
两组逐星模型在 Pal 5 轨道上演化 11.5 Gyr（约 2×10⁵ 星）；逃逸星移出后作为 tracer 积分 *(Grounds 里写的)*
""")
card("L_gieles_code", "lib", """
`Gieles2021:N_code` · Native
NBODY6++GPU：直接求和、无软化、Hermite + KS 正规化
""")
card("L_wang_setup", "lib", """
`Wang2024:A_setup` · 中间论证
5 个 Pal 5 类模型（N₀ 2.1–3.5×10⁵），在 Pal 5 轨道上演化 12 Gyr；PeTar，不移除恒星
""")
card("L_kos_design", "lib", """
`Kos2024:a-sim-design` · 中间论证
无碰撞的简化模拟：一百万个无质量粒子在随轨道移动、逐渐缩小的 Plummer 势里
""")
card("L_kos_check", "lib", """
`Kos2024:a-nbody-check` · 中间论证
简化模拟与碰撞 N-body（AMUSE/BHTree，50 次）给出相同的 tail 结构和位置
""")
card("L_casa_tp", "lib", """
`Casamiquela2022:n_testparticle` · Native
没有星–星引力的 test particle 模拟足以研究 tail 的取向和伸长
Warrant：逃逸后路径只由星团轨道和银河势决定 **(读者推断)**
""")
card("L_weis_sg", "lib", """
`Weis2025:end-selfgravity` · End
逃逸后 L_z 不守恒：tail 星自身的引力是主要改变者，最多占逃逸后总变化的 70%
""")
card("L_weis_seed", "lib", """
`Weis2025:seed-scatter` · 中间论证
相同参数、不同随机种子：星团内的质量分布差别很大（15 次实现）
""")
card("L_weis_robust", "lib", """
`Weis2025:tail-robust` · 中间论证
tail 的一维数密度和形状对种子不敏感（15 次实现的 1σ 带）
""")
card("L_pa_nbody", "lib", """
`PflammAltenburg2023:n_nbody` · Native
稀疏的 tail 需要一组模拟，而不是一次大模拟，才能看出涨落
""")
card("L_jadhav_cav", "lib", """
`Jadhav2025:n_caveats` · Native
网格之外的物理和数值（含**代码选择**、轨道偏心率）都可能改变 tail 的性质
""")
card("L_kroupa_main", "lib", """
`Kroupa2022:e-main` · End
tail 的前后不对称检验引力定律：Newton 模型给出近乎对称的 tail
""")
card("L_kroupa_kuepper", "lib", """
`Kroupa2022:e-kuepper` · End
Küpper overdensity 的距离 *(转述自 research 报告，未核实)*
""")

# proposal's established arguments
card("M1", "est", """
## M1 · 动机
**Claim**：library 里的模拟论文对 tail 星的处理方式各不相同，而且多数没有写明。

**Grounds**
- 在打开的 19 篇模拟论文里，7 篇写明了处理方式：逃逸星作 tracer（Gieles2021）；全部保留（Arnold2025、Wang2024、Weis2025）；test particle（Kos2024、Casamiquela2022、PflammAltenburg2023）。
- 其余 12 篇只写了代码名。其中 4 篇 NBODY6/7 论文 **在打开的 N 篇里没有一篇写明** 逃逸星怎么积分（已核对全文）。
- 只有 `Kos2024:a-nbody-check` 在同一初始条件下比较过两种处理。

**Warrant**：处理方式若影响结果，跨论文比较 tail 结论时就会混进处理方式的差异。
""", ESTABLISHED, 480)
card("D1", "est", """
## D1 · 讨论：一处没有边的冲突
**Claim**：`Weis2025:end-selfgravity` 与以「忽略星–星引力」为前提的两种做法相冲突，两边互不引用。

**Grounds**：Weis2025 测得 tail 自引力最多占逃逸后 ΔL_z 的 70%；`Kos2024:a-sim-design` 用无质量粒子；`Casamiquela2022:n_testparticle` 的 Warrant 认为逃逸后路径只由轨道和银河势决定（读者推断）。

**Warrant**：若一种力占某个量变化的大部分，忽略它的模型对这个量的预测就不可靠。

**Qualifier**：Weis2025 只针对 Praesepe 一个模型。
""", ESTABLISHED, 480)
card("B1", "est", """
## B1 · 基准：Pal 5 有两组现成的模拟
**Claim**：`Gieles2021` 和 `Wang2024` 都在 Pal 5 轨道上演化了约 2×10⁵ 星的模型，且分别对应处理 1（逃逸星作 tracer）和处理 3（PeTar，全部保留），可作为对照。

**Rebuttal**：两组模型的 BH 和双星设置不同，它们之间的差异不能只归于处理方式。
""", ESTABLISHED, 480)

# verifications
card("V1", "est", """
## V1 · Verification · **昂贵**
**设计（论证）**：在 Pal 5 轨道上，用三种处理各跑 K 个种子的 Pal 5 类模型，初始条件取自 `Gieles2021:A_setup`。

**需要的东西**
- ✓ NBODY6++GPU fork `tidaltiles/units-v1`（sims/project.yaml）
- ✓ PeTar `tidaltiles/formal-5694bb2`（sims/project.yaml）
- ✗ allocation：需用户手动申请（sims/project.yaml 的 resource_notes）

**规模**：3 处理 × K 种子 × N 星 × T Gyr。
对照：项目写明一次比较约 6 CPU、墙钟上限 7 天（resource_notes）。Pal 5 规模的耗时项目里没有依据，**无法判断**能否在 7 天内完成。

**标尺**：同一处理下 K 个种子之间的散布 σ_seed，由设计里的 K 个种子产生（`Weis2025:seed-scatter`）。

**产出**：tail 沿轨道的数密度剖面；第一 overdensity 的位置；tail 星的 ΔL_z 分布。

**待用户决定**：N（Gieles2021 用约 2×10⁵，可参照）、积分时长 T、种子数 K
""", COSTLY, 500)
card("V0", "est", """
## V0 · Verification · 便宜
**设计**：读 `Gieles2021` 和 `Wang2024` 已发表的 Pal 5 tail 图，比较 tail 宽度。不跑模拟。
**需要的东西**：✓ 两篇全文（library 目录下的 .md）
**产出**：两组模型的 tail 宽度
""", CHEAP, 420)

# conjectures
card("C0", "round", """
## C0 · Conjecture（V0）
**Claim**：`Wang2024` 的 Pal 5 tail（处理 3）比 `Gieles2021` 的（处理 1）更宽，差异超过两篇各自给出的不确定度。
**Rebuttal（判据）**：差异小于两者不确定度之和则不成立。BH 与双星设置不同也会造成差异（见 B1）。
**若成立** → 作为 C2 的 Backing
""", CONJ, 440)
card("C1", "round", """
## C1 · Conjecture（V1）· 浅 · 基准
**Claim**：V1 中处理 1 的模型，其 tail 沿轨道的数密度剖面与 `Gieles2021` 的结果之差在 σ_seed 之内。
**Warrant**：同一轨道、同类初始条件、同一处理，结果应当一致（B1）。
**Rebuttal（判据）**：任一距离区间的偏差超过 2σ_seed 则不成立。
**效应大小**：不适用（这是重现）。

**若成立** → 作为 V1 设计的 Backing
**若不成立** → 设置与 Gieles2021 不一致，或差异本身值得追；先停下来查设置
""", CONJ, 460)
card("C2", "round", """
## C2 · Conjecture（V1）· 浅
**Claim**：三种处理下，第一 epicyclic overdensity 离星团的距离之差 Δx 超过 σ_seed。
**Warrant**：overdensity 的位置由逃逸星的 epicycle 运动决定（`Kroupa2022:e-kuepper`）。
**Qualifier**：Pal 5 轨道，演化到 T。
**Rebuttal（判据）**：Δx < 2σ_seed 则不成立。
**效应大小**：**未知**，library 里没有依据。

**若成立** → 处理方式影响 overdensity 位置（接 O1）
**若不成立** → 三种处理在这一点上一致，最便宜的处理够用（接 O2）
""", CONJ, 460)
card("C3", "round", """
## C3 · Conjecture（V1）· 浅 · 赌注
**Claim**：处理 1 下 tail 星的 ΔL_z 分布与处理 2 的差异超过 σ_seed。
**Warrant**：D1。
**效应大小**：预计可观：`Weis2025:end-selfgravity` 测得自引力最多占 70%。

**若成立** → 作为 `Gieles2021:A_setup` 的 Rebuttal（它把逃逸星当 tracer）
""", CONJ, 440)

# outlook
card("O1", "outlook", """
## O1 · 展望（非承诺）
若 C2 成立：tail 的前后不对称 q 是否也随处理而变？这会牵动 `Kroupa2022:e-main` 用 Newton 模型的 q 检验引力。
**缺**：C2 的结果
""", OUTLOOK, 420)
card("O2", "outlook", """
## O2 · 展望（非承诺）
若 C2 不成立：用处理 1 跑更大的参数网格（轨道、质量）。
**缺**：C2 的结果
""", OUTLOOK, 380)
card("O3", "outlook", """
## O3 · 展望 · 昂贵 Verification V2（非承诺）
在偏心轨道上重复 V1。`Jadhav2025:n_caveats` 说偏心率的影响大且难以估算。
**缺**：C2 的结果；allocation
""", OUTLOOK, 420)

# ---------------------------------------------------------------- edges (from -> to, label)
edges = [
    ("M1", "G", "Backing"),
    ("D1", "G", "Backing"),
    ("L_kos_check", "G", "Rebuttal"),
    ("L_jadhav_cav", "M1", "Grounds"),
    ("L_weis_sg", "D1", "Grounds"),
    ("L_kos_design", "D1", "Grounds"),
    ("L_casa_tp", "D1", "Grounds"),
    ("L_gieles_setup", "B1", "Grounds"),
    ("L_wang_setup", "B1", "Grounds"),
    ("B1", "V1", "Backing"),
    ("L_gieles_code", "V1", "Warrant"),
    ("L_weis_seed", "V1", "Backing"),
    ("L_pa_nbody", "V1", "Backing"),
    ("L_jadhav_cav", "V1", "Rebuttal"),
    ("B1", "V0", "Grounds"),
    ("V0", "C0", "Grounds"),
    ("V1", "C1", "Grounds"),
    ("B1", "C1", "Warrant"),
    ("V1", "C2", "Grounds"),
    ("L_kroupa_kuepper", "C2", "Warrant"),
    ("L_weis_robust", "C2", "Backing"),
    ("V1", "C3", "Grounds"),
    ("D1", "C3", "Warrant"),
    ("C0", "C2", "成立 → Backing"),
    ("C1", "V1", "成立 → Backing"),
    ("C2", "O1", "成立 → Grounds"),
    ("C2", "O2", "不成立 → Grounds"),
    ("C3", "L_gieles_setup", "成立 → Rebuttal"),
    ("L_kroupa_main", "O1", "Grounds"),
    ("C2", "O3", "成立 → Grounds"),
    ("L_jadhav_cav", "O3", "Grounds"),
]


# ---------------------------------------------------------------- layout helpers
def height(text, width):
    units = max(20, (width - 40) // 9)  # rough: a CJK char ~2 units, others ~1
    lines = 0
    for line in text.split("\n"):
        w = sum(2 if ord(ch) > 0x2E80 else 1 for ch in line)
        lines += max(1, math.ceil(w / units))
    return 40 + 26 * lines


def node(cid, x, y):
    c = cards[cid]
    n = {"id": cid, "type": "text", "text": c["text"], "x": x, "y": y,
         "width": c["width"], "height": height(c["text"], c["width"])}
    if c["color"]:
        n["color"] = c["color"]
    return n


def sides(a, b):
    ax, ay = a["x"] + a["width"] / 2, a["y"] + a["height"] / 2
    bx, by = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
    if abs(by - ay) > abs(bx - ax):
        return ("top", "bottom") if by < ay else ("bottom", "top")
    return ("left", "right") if bx < ax else ("right", "left")


def build_edges(nodes):
    by_id = {n["id"]: n for n in nodes}
    out = []
    for i, (f, t, label) in enumerate(edges):
        fs, ts = sides(by_id[f], by_id[t])
        e = {"id": f"e{i}", "fromNode": f, "fromSide": fs, "toNode": t, "toSide": ts, "label": label}
        if label.startswith(("成立", "不成立")):
            e["color"] = CONJ
        elif label == "Rebuttal":
            e["color"] = FLAG
        out.append(e)
    return out


def column(ids, x, y, gap=40):
    nodes = []
    for cid in ids:
        n = node(cid, x, y)
        nodes.append(n)
        y += n["height"] + gap
    return nodes, y


def row(ids, x, y, gap=40):
    nodes = []
    for cid in ids:
        n = node(cid, x, y)
        nodes.append(n)
        x += n["width"] + gap
    return nodes, x


def group(gid, label, members, color=None, pad=40):
    x0 = min(n["x"] for n in members) - pad
    y0 = min(n["y"] for n in members) - pad - 30
    x1 = max(n["x"] + n["width"] for n in members) + pad
    y1 = max(n["y"] + n["height"] for n in members) + pad
    g = {"id": gid, "type": "group", "label": label, "x": x0, "y": y0, "width": x1 - x0, "height": y1 - y0}
    if color:
        g["color"] = color
    return g


LIB = [k for k, v in cards.items() if v["zone"] == "lib"]


# ---------------------------------------------------------------- layout A: three zone groups side by side
def layout_a():
    nodes = []
    lib_a, _ = column(LIB[:7], 0, 0)
    lib_b, _ = column(LIB[7:], 480, 0)
    est, _ = column(["M1", "D1", "B1"], 980, 0)
    ver, _ = column(["V1", "V0"], 1520, 0)
    rnd, _ = column(["C1", "C2", "C3", "C0"], 2160, 0)
    out, _ = column(["O1", "O2", "O3"], 2780, 0)
    zone_est = lib_a + lib_b + est + ver
    nodes += zone_est + rnd + out
    goal = node("G", 1520, -900)
    note = node("note", 0, -900)
    nodes += [goal, note]
    groups = [
        group("z_est", "已站稳的：library 卡片 · proposal 自己的论证 · Verification 的设计", zone_est),
        group("z_round", "这一轮：Conjecture", rnd),
        group("z_out", "展望（非承诺）", out, OUTLOOK),
    ]
    return groups + nodes


# ---------------------------------------------------------------- layout B: bottom-up DAG, zones by colour only
def layout_b():
    nodes = []
    y_lib = 2000
    lib, _ = row(LIB, 0, y_lib)
    est, _ = row(["M1", "D1", "B1", "V0", "V1"], 300, 1150)
    rnd, _ = row(["C0", "C1", "C2", "C3"], 900, 450)
    out, _ = row(["O1", "O2", "O3"], 1300, -100)
    goal = node("G", 300, -900)
    note = node("note", -600, -900)
    nodes += lib + est + rnd + out + [goal, note]
    return nodes


def write(name, nodes):
    texts = [n for n in nodes if n["type"] == "text"]
    canvas = {"nodes": nodes, "edges": build_edges(texts)}
    ids = {n["id"] for n in nodes}
    for e in canvas["edges"]:
        assert e["fromNode"] in ids and e["toNode"] in ids, e
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(canvas, f, ensure_ascii=False, indent=1)
    print("wrote", path, len(nodes), "nodes", len(canvas["edges"]), "edges")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    write("round-1-A.canvas", layout_a())
    write("round-1-B.canvas", layout_b())
