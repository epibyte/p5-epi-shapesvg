# Changelog

## Unreleased

### Added
- `Polygon.createRectangle(pos, dim, rotation)` — create rectangles positioned by top-left corner; rotation applied about the center.
- `Polygon.densify(maxLen)`, `Polygon.sparsify(minLen)`, `Polygon.jitter(deviation, opts)` — utilities to resample and perturb polygon geometry.
- Unit tests for `createRectangle`, `densify`, `sparsify`, and `jitter`.

### Changed
- `Polygon.getSkeleton()` marked as experimental/@deprecated and now emits a runtime warning. This method may be removed in a future release.

### Notes
- Version bumped to `1.1.0` to reflect added features and documentation updates.
