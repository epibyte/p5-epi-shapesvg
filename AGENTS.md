# AGENTS.md

Dependency-free ESM geometry library (`Point`, `Line`, `Polygon`) for p5.js and SVG.

## Core design constraint
`Polygon.clipTo()` returns **line paths/segments**, not filled polygons. This is the library's differentiator (plotter/SVG/CAD use). Do not "fix" clipping to match `clipper2-js` or `polygon-clipping` semantics.

## Layout
- `index.js` — public ESM entry; re-exports `src/Point.js`, `src/Line.js`, `src/Polygon.js`. Relative imports include `.js`.
- `src/Polygon.js` — one large class; `poly.pts` is an array of rings (`Point[]`), each ring may be open or closed.
- `poly.bbox` is a cached `{minX,minY,maxX,maxY,width,height}`. Mutating methods must call `this.calcBBox()`; add it to any new mutator or the cache goes stale.
- `drawShape()` in all classes calls p5 globals (`beginShape`, `vertex`, `ellipse`, `line`) without importing p5. Keep p5 optional; do not add it as a dependency.
- `dist/p5-epi-shapesvg.js` is the committed IIFE bundle (global `EpiShapeSvg`) used by jsDelivr/OpenProcessing. Rebuild it after public-API changes.

## Commands
- `npm test` — run all suites (`node test/run-all-tests.js`).
- `npm run test:point` / `test:line` / `test:polygon` — one suite.
- No lint, formatter, typecheck, CI workflow, or lockfile exists; `package.json` declares no dependencies. Do not invent commands for them.
- Build: `npx rollup -c` (per `rollup.config.mjs`). Rollup and `@rollup/plugin-node-resolve` are not declared in `package.json`, so install them first; there is no npm `build` script.
- `CHANGELOG.md` uses an `Unreleased` section; current package version is `1.1.0`. CDN URLs are pinned to git tags.

## Testing gotchas
- The runner is custom, dependency-free, and synchronous: `describe()`/`test()` execute immediately on import. Keep tests synchronous; async functions are not awaited.
- **`npm test` exits 0 even when tests fail** (no `process.exitCode`). Always inspect the final `Failed: 0` / absence of `✗` lines; a green shell exit is not proof.
- Suite files (`point-tests.js`, etc.) export the runner but never call `.run()`, so running one prints cases without a summary.
- To add a suite, import it in `test/run-all-tests.js` and add its `.passed`/`.failed` to the overall totals.
- Tests import `src/` directly; `dist/` is not covered.
- `test/test.js` + `test/index.html` are a manual browser playground, not part of `npm test`.

## API and docs traps
- README says `Polygon.createNEdges()`; the real method is `Polygon.createNEdge()`. Trust `src/Polygon.js` over README prose when they disagree.
- README's test count is stale; use actual test output.
- Mutation is asymmetric: `Point.translate/rotate/scale` return new `Point`s, while `Polygon.translate/rotate/scale/densify/sparsify/jitter/optimize/merge` mutate and return `this`. `clipTo`/`outerHull` return new polygons.
- `createRectangle(pos, dim, rotation)` treats `pos` as top-left and rotates about the rectangle center; `rotate(angle, origin)` defaults to `(0,0)`.
- `getSkeleton()` is experimental, emits `console.warn()`, and may be removed; don't build new features on it.
- `clipPts()` is deprecated; use `clipTo()`.
