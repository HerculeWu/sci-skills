# Sharma2025 — Tidal tails in open clusters: Morphology, binary fraction, dynamics, and rotation
## Object
Tidal tails of 5 open clusters, 60 Myr–4 Gyr, 0.4–1.3 kpc: BH 164, Alessi 2, NGC 2281, NGC 2354, M67; Praesepe as a test case.
## Kind of work
Observation (Gaia data analysis), with N-body models for comparison.
## Data and methods
- Gaia DR3 (ADQL, 10° fields): astrometry, photometry, RVs
- DBSCAN (scikit-learn): core members; RV + CMD (k-d tree) filter, then PCA + DBSCAN: tail stars
- McLuster + PeTar + BSE N-body in MWPotential2014, synthetic obs. with astropy: expected tail shape and proper motions
- galpy orbit integration in MWPotential2014: leading vs trailing tail
- van Leeuwen projection correction of proper motions
- PARSEC isochrones + robustgp ridge line: binary fraction
- KS tests on luminosity functions
- Residual velocity method (Hao+) + Plummer fits: 3D rotation, masses
## Quantities
Tail star counts, extents vs Jacobi radius, LF slopes, binary fractions (q>0.5), proper-motion patterns, rotation axes and v_phi, dynamical masses within r_J.
## End Arguments
- e_tails: tails in all 5 clusters, 100–200 stars, 40–100 pc, 1–4 r_J
- e_method: RV/CMD + PCA/DBSCAN on Gaia DR3 finds tails to ~1 kpc; rotation validates tails
- e_lf: tail and cluster LFs agree; tails lack massive stars
- e_bf: binary fraction generally higher in tails
- e_rot: first 3D rotation in M67 (into tails) and NGC 2281
