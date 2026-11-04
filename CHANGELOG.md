# Changelog

## 1.0.1 — 4 November 2026

- Generic for everyone: removed the built-in hooks for one specific animation library. Use
  `frameProbe.mark()` and `frameProbe.context()` for anything site-specific.
- README rewritten for any site; no npm needed to use it.

## 1.0.0 — 4 November 2026

First release.

- Runs only with `?probe` in the address; the documented inline loader means nothing is downloaded otherwise.
- Lists slow frames with page-code busy time and a context column; logs DOMContentLoaded, page load, GSAP
  `ScrollTrigger.refresh` (with duration).
- `frameProbe.mark()`, `frameProbe.context()`, `frameProbe.stop()`, `frameProbe.results`.
- Results box with Copy and Close; also printed to the console.
- Options: `?probe=<ms>` duration, `probe-threshold=<ms>`.
