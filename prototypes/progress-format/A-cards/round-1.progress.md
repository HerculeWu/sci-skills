# Progress · tail-treatment-compare · round 1

Canvas: `round-1.canvas` · started 2026-10-15 · written by the agent; the user may edit it, the file wins over memory.

## Verifications

### V1 · waiting
**on**: `sims/r1-v1-t1/status.json`, `sims/r1-v1-t2/status.json` (T1 and T2 runs; T3 done)
**design**: sha256:98f5e40e (at in progress, 2026-10-16)
**Decided**
- orbit: Hyades orbit, as on the card. — user, 2026-10-16: "Hyades orbit, keep B1."
- k = 10 seeds. — user, 2026-10-16
- snapshot cadence 1 Myr. — user, 2026-10-16
- threshold 2 standard errors. — user, 2026-10-16
- ✗ PHIDBL shift after REMOVE → keep as a stated limitation, no code change. — user, 2026-10-16: "Don't touch escape.F this round, write it down as a limitation." See `notes/phidbl.md`.
- ✗ storage → open
- ✗ DTMIN / RMIN convergence → open; the user will run it by hand ("I'll do the convergence myself, don't wait for it.")
**Results**
- T3: `sims/r1-v1-t3/report.json`, `analysis/out/v1_t3_asym.csv`
**Deviations**
- T3 seeds 7 and 9 crashed (PeTar, `sims/r1-v1-t3/report.json`); T3 has 8 seeds instead of 10. — user, 2026-10-29: "Go on with 8, no rerun."

### V2 · waiting
**on**: Needs — RTIDE has no field in the spec schema, the runner writes `RTIDE=0.0`; changing it means changing nbody-simops. Reported to the user 2026-10-16.

### V3 · waiting
**on**: user — k_V3, gas expulsion and the shared orbit (For the user to decide), asked 2026-10-16.

### V4 · waiting
**on**: V1 (T1 and T2 snapshots)
**design**: sha256:b17d79af (at in progress, 2026-10-22)
**Decided**
- ✗ convergent-point velocities → done: `analysis/v4_cp_velocity.py`, tested on V1 T3 snapshots.
**Results**
- (none yet)

### V5 · not started

## Conjectures

### C1 · held
**claim + criterion**: sha256:0f1d2428 (at result in, 2026-10-29)
**Result**: V1 T3, max seed-averaged |ε|√n in 10–175 pc after 200 Myr = 1.42 at 412 Myr (criterion: above 3 refutes). 8 seeds, see V1 Deviations. `analysis/out/v1_t3_asym.csv`, `figures/c1_t3_significance.pdf`
**User**: 2026-10-30: "C1 holds, 1.4 is well within Kroupa's 1.7."

### C2 · open

### C3 · open

### C4 · open

### C5 · open

### C6 · open

### C7 · open

### C8 · open

### C9 · open

### C10 · open

### C11 · open

### C12 · open

## Log

- 2026-10-15 · Record created from the canvas: V1–V5 not started, C1–C12 open. · Next: For-the-user items of V1. · Observed: V2's lever (RTIDE) cannot be written in a spec.
- 2026-10-16 · User decided V1's For-the-user items and PHIDBL. V1 spec written with `request-run` as three tasks, one per treatment, 10 seeds each; user gave go. V2 reported as blocked on nbody-simops; V3 items asked. · Next: V4 analysis code while V1 runs.
- 2026-10-22 · Aligned with the canvas: no change. V4 convergent-point code written and tested on T3 snapshots fetched by the user. · Next: wait for V1.
- 2026-10-29 · T3 done, 2 seeds crashed; user chose to go on with 8. C1 analysed and handed to the user with its criterion. · Next: user's judgement on C1.
- 2026-10-30 · C1 judged held by the user. · Next: wait for T1/T2. · Observed: T3 ε at 700 Myr leans positive in 6 of 8 seeds; not tied to any card this round.
