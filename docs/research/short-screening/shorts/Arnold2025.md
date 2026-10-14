# Arnold2025 — Direct N-body simulations of NGC 6397 and its tidal tails
## Object
Globular cluster NGC 6397: structure, remnants, tidal tails; dark matter in GCs.
## Kind of work
Direct N-body simulation compared with observations.
## Data and methods
- Gaia DR3 members over 30x12 deg (PM track fitted to simulated tail stars, parallax, PARSEC isochrone); HST, Stetson photometry inside 450''.
- LOS velocities, HST/Gaia PM dispersions; HST/JWST mass functions.
- Orbit: RK4 back-integration in Bovy (2015) and Irrgang (2013) potentials.
- Modified NBODY6+P3T (leapfrog, GPU tree, softening, Hurley stellar evolution with run-up): 10 star-by-star runs, 4-8 Gyr, ICs scaled from Baumgardt & Hilker grid.
- Baumgardt & Makino (2003) mass-loss law to extrapolate history.
- Compared with STREAMFINDER candidates and GOTHIC runs of Boldrini & Vitral (2021).
## Quantities
Surface density to ~10 deg, velocity dispersion, mass functions vs radius; remnant fractions, mass in 0.05/0.26 pc; bound and initial mass, lifetime; tail position, width, counts.
## End Arguments
- e-no-dark: standard-IMF model fits; no dark subcluster/IMBH/DM needed; centre is white dwarfs.
- e-mass-history: 9.3e4 Msun now, 3.1e5 at birth, ~2/3 lost, 20 Gyr lifetime.
- e-no-dm-halo: Gaia tail overdensity matches DM-free model in place and number; DM halo unlikely.
