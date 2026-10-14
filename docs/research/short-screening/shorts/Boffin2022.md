# Boffin2022 — A tale of caution: the tails of NGC 752 are much longer than claimed
## Object
Open cluster NGC 752 (1-2 Gyr, ~450 pc) and its tidal tails; re-analysis of Bhattacharya et al. 2021.
## Kind of work
Gaia observation guided by N-body simulation.
## Data and methods
- Gaia EDR3, 24 and 100 deg fields; Bailer-Jones photogeometric distances.
- PETAR N-body (SSE/BSE, GALPY MWPotential2014, Kroupa IMF, no primordial binaries), 5000 and 2500 Msun: tails in Gaia observables, survival, mass loss; orbit integrated back 1.75 Gyr for initial conditions.
- Convergent point (CP) velocities + DBSCAN (scikit-learn): members.
- Model-guided alternative compact CP (CCP) selection (Röser metric).
- Re-run of earlier PM/parallax cuts.
- Bayestar19 extinction, PARSEC isochrone CMD: single population.
- Photometric binary decomposition, 10^4 Monte Carlo: masses.
- Plummer fit; minimum spanning tree: mass segregation.
## Quantities
Tail extent/asymmetry, member counts, CP velocities, binary fraction, stellar masses, mass function, Plummer mass/scale, segregation ratio, initial mass.
## End Arguments
- end-method: finding open-cluster tails needs wide field, CP velocities, N-body models
- end-tails-longer: tails >260 pc, 640 vs 282 members, slightly asymmetric
- end-full-tails: models + Gaia (CCP) can trace kpc-long tails, 1041 candidates
- end-initial-mass: initial mass ~1000-3000 Msun, no YMC
- end-stellar-content: binaries must be counted; fraction 0.69, >=536 Msun, mass segregated
