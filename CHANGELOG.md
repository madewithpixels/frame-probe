# Changelog

## 1.0.0 — 4 November 2026

First release, generalised from the probe that found the Safari stutter in the madewithpixels hero.

- Runs only with `?probe` in the address; the documented inline loader means nothing is downloaded otherwise.
- Lists slow frames with page-code busy time and a context column; logs DOMContentLoaded, page load, GSAP
  `ScrollTrigger.refresh` (with duration) and faulty-terminal events.
- `frameProbe.mark()`, `frameProbe.context()`, `frameProbe.stop()`, `frameProbe.results`.
- Results box with Copy and Close; also printed to the console.
- Options: `?probe=<ms>` duration, `probe-threshold=<ms>`.
