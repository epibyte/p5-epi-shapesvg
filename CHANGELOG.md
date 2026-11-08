# Changelog

## Unreleased

### Added
- `Polygon.createRectangle(pos, dim, rotation)` — create rectangles positioned by top-left corner; rotation applied about the center.
- `Polygon.densify(maxLen)`, `Polygon.sparsify(minLen)`, `Polygon.jitter(deviation, opts)` — utilities to resample and perturb polygon geometry.
- Unit tests for `createRectangle`, `densify`, `sparsify`, and `jitter`.
- `test/polygon-clip-tests.js` — clipping regression suite for single-ring `clipLine`/`clipTo` behavior and empty receiver/mask cases.
- Regression tests for the low-risk correctness fixes below.

### Changed
- `Polygon.getSkeleton()` marked as experimental/@deprecated and now emits a runtime warning. This method may be removed in a future release.
- `npm test` now exits with a non-zero status when tests fail; individual suite files also print their own summary.

### Fixed
- `Polygon.createArc()` now applies `rotation` about the arc center instead of the world origin.
- `Polygon.addPoint()` now creates a first ring on an empty polygon instead of throwing.
- `Polygon.isOverlapping()` now returns `false` when either polygon is empty.
- `Polygon.insertIntersectionPoint()` now compares squared distance against a squared tolerance (`EPSILON_SQ_DIST`) instead of a linear one.
- `Polygon.clipPts()` no longer double-rotates interpolated points, no longer emits a debug `console.log()`, and guards zero-length segments.
- `Polygon` distance and area tolerances are now named constants: `EPSILON_DIST`, `EPSILON_SQ_DIST`, and `EPSILON_AREA`.

### Notes
- Version bumped to `1.1.0` to reflect added features and documentation updates.
