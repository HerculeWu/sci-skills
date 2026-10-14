# How the sample project does round 1's Verifications

Research for issue #20 (map #17). Question: for each Verification V1–V5 of the sample's round 1, what is the project's documented way of doing it, where does that way stop, which steps need the author's go or a manual commitment, where would each **Needs ✗** item be resolved or recorded, and what has no documented way at all. Facts only; no design decisions for the map.

Sources (read only, as of 2026-10-14):
- `P:` = sample project `/Users/wenjie/programm/astro/tidal_tails_numerical_compare`
- `S:` = nbody-simops plugin `~/programm/astro/nbody-simops`
- Proposal: `P:proposals/tail-treatment-compare/round-1.canvas` (cards `## V1`…`## V5`), `P:proposals/tail-treatment-compare/table.md` (Candidates)

## State of the project

- `P:sims/` contains only `project.yaml`; no task has been requested yet. `P:analysis/` and `P:figures/` contain only `.gitkeep`. `P:notes/` contains only `README.md` ("The first entry should state the comparison the project is about and what would count as an answer"); no decision or question has been recorded.
- The project's way of getting a simulation (`P:AGENTS.md:16,20`): the science session writes `sims/<task>/spec.yaml` with the science layer only (skill `nbody-simops:request-run`), then tells the author to start or wake the simops session. "Writing a `spec.yaml` is a request, not a go."
- Results come back as `sims/<task>/report.json` plus the catalog (`P:AGENTS.md:16`). Where results are recorded (`P:AGENTS.md:22`): run facts in the task's `ledger.md` and the catalog, science conclusions in `notes/`.
- `P:analysis/` is defined as "scripts that read `report.json` and the catalog; figures go to `figures/`" (`P:AGENTS.md:12`). Python is `.venv` only (`P:AGENTS.md:6`). Its dependencies are duckdb, numpy, pyarrow, pyyaml and matplotlib (`P:pyproject.toml`); galpy and astropy are not installed.

### The simops pipeline and its gates (applies to V1–V3)

| Step | Who | Gate | Source |
|---|---|---|---|
| write `sims/<task>/spec.yaml`, science layer only | science session (`request-run`) | none; must ask the author for N, orbit, t_end, methods rather than invent | `S:skills/request-run/SKILL.md` steps 3–4 |
| derived + numerical layers, convergence proposal if needed | `sim-planner` (`plan-run`) | → `awaiting-confirm` | `S:skills/plan-run/SKILL.md`, `S:skills/simops-loop/SKILL.md` |
| confirm the plan | author/dispatcher sets `confirmed: true` in `status.json` | **author** | `S:schemas/status.schema.json:14` |
| deploy, build, preflight (prints the srun command) | `hpc-operator` | → `awaiting-go` | `S:skills/hpc/SKILL.md` |
| allocation | author, by hand; agents never `salloc`/`sbatch` | **manual commitment** | `P:sims/project.yaml:21-23`, `S:docs/marvin.md:21` |
| launch | `hpc-operator` | **author's `go: true`** ("per task" in `P:AGENTS.md:20`; "for this one run" in `S:docs/marvin.md:32` and `S:agents/hpc-operator.md:12`) | `S:schemas/status.schema.json:15` |
| status polling, repair within bounds | exporter → `hpc-operator` | rerun with changed physics/precision: **ask** | `S:docs/marvin.md:34` |
| ingest, QC, report data | `data-steward` | none | `S:skills/ingest`, `S:skills/qc` |
| `report.md` / `report.json`, `done` | exporter | none | `S:schemas/report.schema.json` |
| archive; delete remote data | `data-steward` | delete: **per-item confirmation** | `S:skills/archive/SKILL.md`, `S:docs/marvin.md:33` |

The pipeline stops at `report.json` + catalog. Nothing in simops does science analysis (`S:docs/design.md` §1: "不负责科学分析、作图、论文"); the science side picks up in `P:analysis/`.

## Verification × method

| | Documented way | Where it stops | Author go / manual commitment | No documented way |
|---|---|---|---|---|
| **V1** core ensemble T1/T2/T3, k seeds | One `request-run` task. The spec science layer can hold all of V1's cluster: `stellar_mass.imf`, `profile.plummer`, `binaries.fraction: 0`, `stellar_evolution`, `orbit.position_pc/velocity_kms`, `potential`, `t_end_myr`, `output_interval_myr`, `seeds`, `methods: [petar, nbody6_keep, nbody6_tail]` (`S:schemas/spec.schema.yaml`). The runner gives exactly V1's treatments: NBODY6 `KZ(23)=0`/`5`, `RTIDE=0.0` (automatic r_J), PeTar `--r-escape 1e30`, one McLuster table per realisation shared by all components (`S:tools/runner/run_comparison.sh:495,509,577`; `S:docs/rules.md` row "跨方法比较"). | At `report.json` + catalog. All quantities in V1's Design (ε windows, width, overdensities, M(<r_J), mean mass along the tail) are analysis, not simops. | `confirmed`, allocation (6 CPU per comparison, 16 CPU for 8 in parallel, 7-day wall; `P:sims/project.yaml:21-23`), `go`. | (1) How a k-seed × 3-method ensemble maps to tasks: `status.json` and `report.json` carry one `run_id` (`S:schemas/status.schema.json:16`, `S:schemas/report.schema.json:6`), and the `hpc` preflight builds one `run_comparison.sh` command (one realisation, `S:tools/runner/README.md`); multi-seed drivers exist only as fixed suites (validation, convergence, stress). (2) The analysis code for every Yield (empty `P:analysis/`). (3) Getting the catalog to the analysis side (see cross-cutting notes). |
| **V2** hand-off radius, RTIDE = k_h r_J,0 | `request-run` with `methods: [nbody6_tail]`, reusing V1's tables via `reuse_initial_conditions` (`S:schemas/spec.schema.yaml:41`). | Before planning: the variable that defines V2 cannot be expressed. | as V1 | (1) RTIDE has no field in the spec schema (science or numerical layer) and no runner variable; the runner writes `RTIDE=0.0` literally (`S:tools/runner/run_comparison.sh:509`). Changing that is a plugin change, which the project may not make (`P:AGENTS.md:21`). (2) `reuse_initial_conditions` takes one path, so reusing V1's k per-seed tables has no documented form. (3) "Start V2 only after C2 is decided" (card's For-the-user) has no place in the project. |
| **V3** 7500 M☉, same orbit | `request-run` as V1 with N ≈ 13000. For N > 4000 the plugin says: the planner proposes a convergence suite (`S:skills/plan-run/SKILL.md:14`); a driver scanning PeTar r_bin / nstep / θ exists (`S:tools/runner/run_validation_convergence.sh:245-260`); the result is written back to `S:docs/rules.md` (`S:docs/design.md` §3.4). Large N: "先跑一个短测再估" (`S:docs/dynamics-cheatsheet.md:56`). | As V1, after a convergence suite and a short timing test, each of which is itself a run. | as V1, plus `confirmed`/`go` for the convergence suite and the short test; the planner's free budget for proposing a suite is undecided (`S:docs/design.md:237`). | Gas expulsion: no spec field, runner records `MCLUSTER_GAS_MASS_MSUN=0` and McLuster gets no gas (`S:tools/runner/run_comparison.sh:710`; `S:tools/simdb/DOC.md:143` "no gas potential"). |
| **V4** observer-side re-analysis of V1/V2 | `P:analysis/` script reading the catalog with `.venv`, figures to `P:figures/` (`P:AGENTS.md:6,12`). | — (nothing exists yet) | none documented for analysis; it waits on V1 and V2 being `done`. | (1) The analysis code itself, including convergent-point velocities; no astropy/galpy in `.venv`. (2) T2 tail stars have no reliable epoch in the catalog (`state_time_myr` NULL, `epoch_status = source_epoch_lag_unresolved`; `S:tools/simdb/DOC.md:477-482`), which every T2 quantity inherits. |
| **V5** torque budget on T1/T3 (and V3) snapshots | Same as V4. | — | as V4; it waits on V1 and V3 (the card also uses V3's snapshots). | The analysis code. The catalog has positions, velocities, masses and IDs per snapshot (`S:tools/simdb/DOC.md:729-742`), no accelerations; V5's (r × a)_z must be computed in analysis. |

## Needs ✗ items: where each would be resolved or recorded

| Card | Needs ✗ | Resolved where (documented) | Recorded where | Gap |
|---|---|---|---|---|
| V1, V3 | NBODY6 DTMIN / RMIN with a mass spectrum | Listed under "需要收敛验证才能定的" in `S:docs/rules.md:21`. Route: planner's convergence proposal in `numerical.rationale` → dispatcher → suite run → new row in `S:docs/rules.md`. | spec `numerical.rationale`, then `S:docs/rules.md` (plugin, written by simops) | DTMIN and RMIN are literals in the runner (`S:tools/runner/run_comparison.sh:498`); the convergence driver does not scan them and generates equal-mass ICs by default (`run_validation_convergence.sh:22-24`). The suite cannot run without a plugin change. |
| V1 | PHIDBL shift after REMOVE in `escape.F` | The code is the author's fork, vendored in `P:codes/Nbody6PPGPU-beijing` and built on HPC only (`P:AGENTS.md:9`); versions are pinned as fork tags in `P:sims/project.yaml` `codes:` (`nbody6: tidaltiles/units-v1`) and listed in `S:docs/builds.md`. A fix would mean a new tag, deploy, and a short HPC test (`S:docs/builds.md`: branch heads "第一次用前在 HPC 编译并跑短测"). | the decision: `P:notes/` ("decisions", `P:AGENTS.md:11`); a stated limitation: nowhere specific | No documented procedure for changing fork code from the science project. |
| V1 | storage for 1 Myr snapshots × 3 treatments × k seeds | — | — | Nowhere. `P:sims/project.yaml` names `$WS`, the catalog, the archive remote and the local staging disk, with no size or quota; the spec's `numerical.resources` has `expected_wall_h` and `expected_max_rss_gb` only (`S:schemas/spec.schema.yaml:79-80`). The archive skill splits directories above 10 GB, nothing more. |
| V2 | large RTIDE changes only the hand-off (it also sets the energy zero M/RTIDE; the automatic value is fixed at initial mass) | Code reading of `P:codes/Nbody6PPGPU-beijing/src/Main/escape.F:32-40` (RESC2, ETID = ZMASS/RTIDE, RTIDE2). | `P:notes/` if anywhere | As for V2 above, RTIDE cannot reach a run through the documented path. |
| V3 | PeTar r_bin / θ convergence for N > 4000 | `S:docs/rules.md:20`; planner proposal; existing driver scans r_bin, nstep, θ at any `N`, with an optional `BASELINE_INITIAL_CONDITIONS` table. | `numerical.rationale`, then `S:docs/rules.md` | The driver never sets the realistic (IMF + SE) mode, so PeTar runs without BSE; whether that suffices for an IMF cluster is not documented. |
| V3 | gas expulsion in the NBODY6 and PeTar set-ups | — | — | Nowhere (no spec field, no runner option). |
| V4 | convergent-point velocities for model stars | write in `P:analysis/` | `P:analysis/`, results to `P:notes/` | no existing code |
| V5 | analysis code | write in `P:analysis/` | as above | no existing code |

## Cross-cutting notes

- **Catalog to analysis.** The catalog lives on the HPC: `$WS/data/tidal_tails_numerical_compare.duckdb` with Parquet under `$WS/data/parquet` (`P:sims/project.yaml:14-17`). The science session never sshes (`P:AGENTS.md:16`). `S:docs/marvin.md:12` lists "把结果 rsync 回本地" as a free action, but no skill or agent stage does it and no local destination is named; `archive` moves tarballs of raw run directories to `archive.local_staging` and the rclone remote, not the catalog. The documented path from `report.json` to a local `analysis/` script reading the catalog stops here.
- **Hand-off record.** V1 keeps `handoff.53`. The fork writes it (`P:codes/Nbody6PPGPU-beijing/src/Main/tail0.f:45-46`), while `S:docs/nbody6-params.md:55` says the hand-off events are in `run.log`. simdb does not ingest either: logs and diagnostics "are not ingested and remain in `raw_output`" (`S:tools/simdb/DOC.md` "Raw-file retention"), so the record is only in the raw run directory and its archive tarball.
- **Zero-age mass.** V1's "mean zero-age mass along the tail" needs initial masses. The Parquet schema has the current `mass_msun` and `particle_id` only (`S:tools/simdb/DOC.md:729-742`); the IC table stays in the run's `common/cluster.dat.10`. How particle IDs map to IC rows is not documented.
- **IMF + SE without binaries (V1, V3).** The runner couples Kroupa IMF and stellar evolution to `REALISTIC_STELLAR_POPULATION=1`, which also adds binary pairing flags and defaults the profile to King. `MCLUSTER_BINARY_FRACTION=0` and `MCLUSTER_PROFILE=0` are accepted (`S:tools/runner/run_comparison.sh:84-88,122-125,132-135`), but `S:docs/rules.md` has a row only for the realistic population with binaries. The case is unvalidated, not undocumented.
- **Snapshot cadence.** PeTar takes `-o` in Myr (powers of 2 are exact, `S:docs/rules.md` row "PeTar 输出间隔"); NBODY6 takes `DELTAT` in N-body units (`NBODY_OUTPUT_INTERVAL_NBODY`). The planner converts; the docs do not say how the two snapshot times are aligned across methods.
- **"Cheap" means "after the costly ones".** V4's and V5's ✓ Needs ("V1 and V2 snapshots", "V1 snapshots at 1 Myr") name outputs of V1–V3 that do not exist yet. In the project they could start only after those tasks reach `done`.
- **For-the-user decisions on the cards.** Orbit, k seeds, cadence and k_V3 have spec fields (science layer). The 2-standard-error threshold, PHIDBL fix-or-limit, the k_h values, the V2 ordering and gas expulsion have no field; the only project place for decisions is `P:notes/`.
- **Rebuild or reuse.** Re-use of the old `tidaltiles` batches was ruled out by the user (`table.md` Candidates). `P:AGENTS.md:3` says that data lives on Google Drive; `S:docs/lessons.md`, which it points to, does not mention it.
