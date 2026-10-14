# Casamiquela2022 — Unravelling UBC 274: a disrupting open cluster
## Object
UBC 274, old (2.5 Gyr), distant (1.8 kpc) open cluster with a tidal tail; Ruprecht 147, Hyades, Praesepe as chemical comparison.
## Kind of work
Observation (Gaia astrometry, high-res spectroscopy) plus a test-particle simulation.
## Data and methods
- Gaia EDR3 within 50 pc to G=19; HDBSCAN membership, thresholds per G/b bin set on a mock cluster (Amasijo, isochrones, PyGaia) in a GOG/GUMS field
- Gaussian mixture fit of sky morphology
- Minimum-spanning-tree mass segregation ratio
- Backward orbit integration (500 Myr, Pouliasis+17 Model II potential), then 10,000 massless particles from a Plummer sphere: tidal stream shape, orbit radii (not N-body)
- MIKE spectra of 8 stars; iSpec/SPECTRUM/MARCS: RVs, parameters, line-by-line differential abundances vs Hyades
- Dereddened CMD vs PARSEC isochrones: age
## Quantities
Members; GMM ellipse (ecc. 0.93, tilt 10 deg); Lambda_MSR; v_r; Teff, logg; 18 abundances, [Fe/H]=-0.08; age; orbit R_GC 7.8-10.5 kpc; [Y/Mg].
## End Arguments
- e_disrupt: elongation is the inner S-shaped tidal tail of a disrupting cluster
- e_mseg: most massive stars are mass segregated (~1.5)
- e_homog: chemically homogeneous to 0.03 dex over ~35 pc of tail
- e_origin: probably born at larger Galactocentric radius
- e_sproc: s-process excess vs Ruprecht 147 from metallicity-dependent yields
- e_ymg: [Y/Mg] fits local age relation; similar enrichment history
