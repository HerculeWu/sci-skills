# Risbud2025 — Tidal tails of nearby open clusters: I. Mapping with Gaia DR3
## Object
Tidal tails of 21 open clusters <400 pc, >100 Myr (Hyades, Pleiades, Praesepe, Blanco 1, Ruprecht 147, Coma Ber, ...).
## Kind of work
Observation; no simulations run (N-body models only cited).
## Data and methods
Gaia DR3 (<500 pc, quality cuts) with Gaia RVs; Hunt & Reffert 2024 catalogue (members, ages); literature tidal radii. Bootstrapped convergent-point (CP) search; 5D phase-space neighbour counting vs Poisson background (Röser & Schilbach 2019); new self-compact CP (SCCP) velocity correction in place of N-body-based CCP; galpy + McMillan 2017 potential for L_Z–E membership check; gala for tail-aligned frames and reflex correction; astropy; PARSEC isochrone; luminosity-function fits; comparison with published tail samples.
## Quantities
Member lists, tail extents, star counts, contamination probability, CPs, tail tilt in X–Y, tail-aligned proper motions, RV vs phi1, L_Z, E, LF slopes.
## End Arguments
- e_tails: 19 of 21 clusters have tails (20–200 pc, 5 new); NGC 6475 halo
- e_method: CP (+SCCP) maps tails to ~100 pc within 400 pc
- e_inverted: 4 clusters' leading tails tilt to Galactic anti-centre, against theory
- e_pm: tail-aligned proper motions point along tails to leading tail
- e_rv: trailing tails have higher RVs than leading
- e_lf: tails and cluster share an LF consistent with canonical IMF
