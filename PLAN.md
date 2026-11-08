# Plan: Stabilize clipping, ownership, and release hygiene

Status: Draft  
Last updated: 2026-11-08  
Scope: `p5-epi-shapesvg`  
Target release: `v0.1.0`  
Compatibility baseline: sketches pinned to `v0.0.21`

## Context

The library is small and appropriately structured: `Point`, `Line`, and `Polygon` in `src/`, a public `index.js`, a custom dependency-free test suite, and a manually built IIFE in `dist/`.

The main risk is not the three-class architecture. It is the clipping core:

- `Polygon.clipLine()` treats multiple mask rings as sequential filters, which is wrong for holes and unions.
- `clipTo()`, `merge()`, and `outerHull()` alias `Point` instances with their inputs.
- There are no automated tests for `clipTo()`.
- `outerHull()` has only a tautological test.
- `isOverlapping(new Polygon())` returns `true`.
- Epsilon handling is inconsistent, including a squared-distance comparison against a linear epsilon.
- `createArc()` rotates around the world origin instead of the arc center.
- `addPoint()` throws on an empty polygon.
- The test harness exits `0` even when tests fail.
- `dist/` and the package version are not aligned with git tags.
- The current CDN baseline for existing sketches is `v0.0.21`; the next release will be `v0.1.0`.

This plan prioritizes correctness and trustworthy tests over refactoring.

## Goal

Make the clipping API's semantics explicit and tested, remove obvious correctness traps, and make the release path reproducible enough that a future change cannot silently break the CDN artifact.

Success means:

- The supported multi-ring behavior is defined, implemented consistently, and covered by tests.
- Public results do not unexpectedly mutate their inputs.
- Known degenerate cases either work or are explicitly documented and tested.
- `npm test` fails the process when tests fail.
- README and CHANGELOG match the code.
- `dist/` is rebuilt and verified before release.
- The release is tagged `v0.1.0`, while `v0.0.21` remains untouched and resolvable.

## Principles

1. **Lock behavior with tests before changing algorithms.**
2. **Prefer small, isolated fixes over a geometry-engine rewrite.**
3. **Do not rename public APIs in this release.** Document misleading names instead.
4. **Do not add runtime dependencies.** Dev dependencies for build/CI are acceptable.
5. **Keep p5 integration as global calls.** Do not import p5.
6. **Benchmark before optimizing.** The current shapes are likely sketch-sized.
7. **Treat published tags as immutable.** Existing sketches must keep running against `v0.0.21`.

## Decisions to make first

### D1. Multi-ring mask semantics

Recommendation: support **even-odd** semantics for masks, matching the existing `isPointIn()` behavior.

- A point inside an odd number of rings is inside the mask.
- A hole is a nested ring; its interior is outside the mask.
- Two disjoint rings form a union, not an intersection.

Alternative: restrict `clipLine()` to a single mask ring, throw or warn for more, and update the README. This is lower risk but is a feature regression relative to current documentation.

### D2. Ownership of result points

Recommendation: **deep-copy points at public result boundaries** (`clipLine`, `clipTo`, `merge`, `outerHull`).

Alternative: document that results may share points and require callers to call `.copy()`. This is cheaper but preserves a sharp edge.

### D3. Versioning and tags

**Decision: release the completed work as `v0.1.0`.**

- Current compatibility baseline: `v0.0.21`.
- New release tag: `v0.1.0`.
- Set `package.json` to `0.1.0` in the release commit.
- Never move, delete, or recreate `v0.0.21`.
- Defer API removals and renames to a later release. `0.x` permits behavior changes, but they still need a CHANGELOG entry and migration notes.
- The npm registry currently has no published `p5-epi-shapesvg` package (checked 2026-11-08), so `0.1.0` is available if npm publishing is added later.
- If a fix is needed after `v0.1.0`, release `v0.1.1`; never retag `v0.1.0`.

### D4. Build/release tooling

The repo currently has no declared build dependencies. If `dist/` is release-critical, add:

- `devDependencies`: `rollup`, `@rollup/plugin-node-resolve`
- `build`: `rollup -c`
- A lockfile
- A CI step that builds and smoke-tests `dist/`

If CDN releases are infrequent and manual, keep the current flow but add a smoke test and a release checklist.

### D5. Experimental skeleton

Recommendation: keep `getSkeleton()` deprecated in `0.1.0`, move it to an optional module if bundle size matters, and remove it in a later release unless someone commits to maintaining it.

## Workstreams

### WS0 — Safety net

| ID | Task | Size | Depends on | Done when |
|---|---|---|---|---|
| P0-1 | Make the test harness fail the process | S | — | A deliberately failing assertion makes `npm test` exit non-zero, including when an individual suite runs directly |
| P0-2 | Add a clipping/boolean test file | M | — | `test/polygon-clip-tests.js` is imported by `run-all-tests.js` and its totals are included |
| P0-3 | Add regression tests for existing single-ring behavior | S | P0-1 | `clipLine` inside/outside/crossing/tangent cases and basic `clipTo` behavior are asserted |
| P0-4 | Add an ownership test | S | P0-2 | Mutating a `clipTo`/`merge`/`outerHull` result leaves the source polygon unchanged after the P0 ownership fix is made |
| P0-5 | Add a release checklist | S | — | Checklist covers test, build, dist smoke test, `v0.1.0` version/tag, and `v0.0.21` immutability verification |

Implementation notes:

- In `TestRunner.run()`, set `process.exitCode = 1` when `this.failed > 0`, guarded by `typeof process !== 'undefined'` for browser use.
- Keep the runner synchronous. Do not add async test support as part of this work.
- Make each suite call `runner.run()` at its end, then remove the duplicate `.run()` calls from `run-all-tests.js`; `run-all-tests.js` should only aggregate totals and set the final exit code.
- Prefer a separate `test/polygon-clip-tests.js` over growing `polygon-tests.js` further.

### WS1 — Define and fix clipping semantics

| ID | Task | Size | Depends on | Done when |
|---|---|---|---|---|
| P0-6 | Record the D1 decision in the README and JSDoc | S | D1 | Docs state whether multi-ring masks are even-odd or single-ring-only |
| P0-7 | Rewrite `clipLine()` to use one classification pass | L | D1, P0-2, P0-3 | Multi-ring holes, nested islands, and disjoint masks match `isPointIn()` |
| P0-8 | Add multi-ring tests | M | P0-7 | Donut, nested, disjoint-ring, and union cases pass for both `inside=true` and `inside=false` |
| P0-9 | Add degenerate clipping tests | M | P0-3 | Vertex crossings, tangencies, collinear/overlapping edges, and zero-length segments produce defined results |
| P0-10 | Recheck `clipTo`, `outerHull`, and `isOverlapping` against multi-ring masks | M | P0-7 | Boolean composition is correct for the new mask semantics, or limitations are documented and tested |

Recommended algorithm for P0-7:

1. Collect intersections between the segment and every ring of the mask.
2. Deduplicate by distance, using a real distance epsilon.
3. Sort intersections by distance from the segment start.
4. Build intervals between consecutive points.
5. Classify each interval midpoint with `this.isPointIn(mid)` (even-odd).
6. Keep intervals where `inside === isPointIn(mid)`.
7. Return 2-point rings and run `optimize()` once.

This replaces the current sequential per-ring filtering and makes holes, unions, and nested rings consistent with point-in-polygon behavior.

Edge-case policy to document:

- Points exactly on the boundary count as inside (current behavior).
- Tangency may produce zero-length or single-point intervals; drop zero-length results.
- Collinear overlap is unspecified unless explicitly supported; document the chosen behavior.

### WS2 — Ownership, empty inputs, and degenerate APIs

| ID | Task | Size | Depends on | Done when |
|---|---|---|---|---|
| P0-11 | Deep-copy points in public results | M | P0-4 | Mutating `clipLine`/`clipTo`/`merge`/`outerHull` results cannot change source polygons or their closure duplicates |
| P0-12 | Guard `isOverlapping()` for empty polygons | S | — | `a.isOverlapping(new Polygon())` and `new Polygon().isOverlapping(a)` both return `false` |
| P0-13 | Fix `outerHull()` duplicate-boundary behavior | M | P0-11 | `outerHull(p, p)` returns one clean ring, not two overlapping copies; touching and contained cases have tests |
| P0-14 | Define empty receiver/mask behavior | S | — | `clipTo(emptyMask)` and `clipLine` against an empty mask are documented and tested; `inside` semantics are explicit |
| P1-1 | Fix and centralize epsilon handling | M | P0-9 | `insertIntersectionPoint` uses a distance-safe comparison; named epsilon constants replace scattered literals |
| P1-2 | Fix `createArc()` rotation origin | S | — | Rotation is applied around the arc center, with a test using a non-origin center |
| P1-3 | Fix `addPoint()` on an empty polygon | S | — | It creates a first ring instead of throwing, and updates `bbox` |
| P1-4 | Clean up deprecated `clipPts()` | S | — | Debug `console.log` is gone; double rotation is fixed or the method is removed in a major release |
| P1-5 | Validate finite coordinates at the core boundary | M | — | NaN/Infinity cannot silently enter `Point` or `Polygon` from public constructors/setters, or the behavior is explicitly documented |

Implementation notes:

- For P0-11, copy at the boundary rather than copying repeatedly inside loops. `clipLine` should own its output points; `clipTo` can then merge without re-copying. `merge` must copy the incoming rings.
- For P0-13, define whether duplicate rings are removed by geometry, by input deduplication, or both. Do not silently remove legitimate overlapping rings without a test.
- For P1-1, decide whether each epsilon is a distance or area tolerance. At minimum:
  - `distanceSqTo(p) < eps * eps` for distance comparisons.
  - `Math.abs(area) > epsArea` for area comparisons.
- For P1-5, avoid a broad validation refactor. Validate at `Point.set()` and the `Polygon` ring-construction boundary.

### WS3 — API clarity and documentation

| ID | Task | Size | Depends on | Done when |
|---|---|---|---|---|
| P1-6 | Correct the README | M | P0-6, P0-7 | `createNEdge` spelling, test count, multi-ring status, and clipping semantics are accurate |
| P1-7 | Document misleading names | S | — | `merge()` is described as concatenation, `optimize()` as ring joining, and `outerHull()` as an approximate union |
| P1-8 | Document ownership and `bbox.midPoint` | S | P0-11 | README/JSDoc state whether results share points; `bbox.midPoint` is listed where `bbox` is described |
| P1-9 | Update CHANGELOG | S | P1-6 | Fixed/Changed entries are under the correct release heading |
| P1-10 | Update AGENTS.md | S | P1-8 | Agent instructions match the new commands, bbox fields, and test layout |

Specific corrections:

- README: `Polygon.createNEdges()` → `Polygon.createNEdge()`.
- README: remove the stale “67 tests” count; do not replace it with another brittle count.
- README: describe `clipTo` as “clip the receiver's paths against the mask”, not as a general boolean intersection.
- README: document that `inside=false` returns paths outside the mask.
- README: state the multi-ring policy from D1.
- README: document that `merge()` is concatenation, not union.
- README: document that `optimize()` only joins rings with matching endpoints.
- README: describe `outerHull()` as approximate boundary union, not a robust boolean engine.
- README/JSDoc: document aliasing until P0-11 lands, then document the copy behavior.
- JSDoc: `Polygon.toSVG()` says `prec=1` but the signature defaults to `2`.
- JSDoc: `bbox` includes `midPoint`.

### WS4 — Build, CI, and release

| ID | Task | Size | Depends on | Done when |
|---|---|---|---|---|
| P1-11 | Decide and implement the build tooling from D4 | M | D4 | A clean checkout can run the documented build command without guessing dependencies |
| P1-12 | Add a CI workflow | S | P0-1, P1-11 | CI runs tests and, if build tooling exists, verifies the build |
| P1-13 | Add a `dist/` smoke test | S | P1-11 | The bundle can be loaded and exposes `Point`, `Line`, and `Polygon` under `EpiShapeSvg` |
| P1-14 | Release as `v0.1.0` | S | D3 | `package.json` is `0.1.0`, CHANGELOG has a `0.1.0` section, and tag `v0.1.0` points at the release commit |
| P1-15 | Add release metadata if publishing to npm | S | D3 | `files`, `repository`, and `exports`/entry-point decisions are intentional |
| P1-16 | Verify `v0.0.21` is unchanged | S | P1-14 | Old tag commit/blob IDs match the pre-release record and its CDN URL still serves the old artifact |
| P2-1 | Add source maps or minification | S | P1-11 | Only if CDN bundle size/debuggability is an actual requirement |

Implementation notes:

- If `rollup` and `@rollup/plugin-node-resolve` are added as dev dependencies, commit the lockfile.
- A CI matrix is unnecessary; one Node LTS job is enough.
- The dist smoke test can run the IIFE in a `vm` context and assert that `EpiShapeSvg` contains the three constructors. It does not need a browser.
- If build tooling is not added, the release checklist must explicitly include `npx rollup -c` after installing the two packages, plus a manual dist smoke check.
- Package currently declares version `1.1.0` while the latest git tag is `v0.0.21`. In the `v0.1.0` release commit, set `package.json` to `0.1.0` so the package version and tag agree.
- The npm registry currently has no published package, so publishing `0.1.0` later will not collide with an existing version.
- `v0.0.21` is the compatibility baseline. Do not rewrite its `dist/` blob or move the tag.

## Release procedure: `v0.1.0`

### Compatibility guarantee for `v0.0.21`

Sketches that load:

```text
https://cdn.jsdelivr.net/gh/epibyte/p5-epi-shapesvg@v0.0.21/dist/p5-epi-shapesvg.js
```

stay on the commit that `v0.0.21` points to. New commits, a rebuilt `dist/`, and a new `v0.1.0` tag do not change that URL or its contents.

The only ways to break those sketches are:

- moving or recreating `v0.0.21` (`git tag -f`, force-pushing tags),
- deleting the tag or the repository,
- rewriting the `dist/p5-epi-shapesvg.js` blob inside the `v0.0.21` commit,
- deleting or renaming the GitHub repository without preserving redirects,
- replacing the same version on npm, if npm is used later.

Never:

- run `git tag -f v0.0.21`,
- delete and recreate `v0.0.21`,
- force-push a tag or a branch that rewrites `v0.0.21`,
- edit `dist/p5-epi-shapesvg.js` inside the old release commit,
- reuse the `v0.0.21` tag for new code.

### Pre-release record

Record these before making the release commit:

```bash
git rev-parse "v0.0.21^{commit}"
git rev-parse "v0.0.21:dist/p5-epi-shapesvg.js"
```

The second command returns the Git blob ID of the old bundle. Also download the current CDN file and record its SHA-256, because the CDN check is independent of Git:

```powershell
curl.exe -L -o old-v0.0.21.js "https://cdn.jsdelivr.net/gh/epibyte/p5-epi-shapesvg@v0.0.21/dist/p5-epi-shapesvg.js"
Get-FileHash old-v0.0.21.js -Algorithm SHA256
```

On macOS/Linux, use `sha256sum` instead. Keep these values with the release notes.

### Pre-release checklist

- [ ] Working tree is clean and `v0.0.21` exists locally and on `origin`.
- [ ] `npm test` passes, and a deliberately failing test exits non-zero.
- [ ] `package.json` version is `0.1.0`.
- [ ] `CHANGELOG.md` has a `0.1.0` section with the behavior changes.
- [ ] README CDN examples point to `v0.1.0`.
- [ ] README/AGENTS document the supported multi-ring behavior and ownership semantics.
- [ ] `dist/p5-epi-shapesvg.js` is built from the release commit.
- [ ] Dist smoke test loads the bundle and exposes `EpiShapeSvg.Point`, `EpiShapeSvg.Line`, and `EpiShapeSvg.Polygon`.
- [ ] Old tag commit and blob IDs are recorded.
- [ ] If publishing to npm, confirm the package name/version is available.

### Release steps

1. Create a release branch:

   ```bash
   git switch -c release/v0.1.0
   ```

2. Apply the version and documentation changes:

   - `package.json`: `"version": "0.1.0"`
   - `CHANGELOG.md`: move the relevant entries from `Unreleased` into `## [0.1.0] - YYYY-MM-DD`
   - `README.md`: point installation/CDN examples at `v0.1.0`
   - `AGENTS.md`: update commands, bbox fields, and test layout if they changed

3. Run tests and build:

   ```bash
   npm test
   npm run build          # or: npx rollup -c
   ```

4. Smoke-test the new artifact before committing. At minimum:

   - load `dist/p5-epi-shapesvg.js` in a `vm` context,
   - assert the `EpiShapeSvg` global exposes all three constructors,
   - run one clipping example through the bundled code.

5. Commit the release:

   ```bash
   git add -A
   git status --short
   git commit -m "Release v0.1.0"
   git tag -a v0.1.0 -m "v0.1.0"
   ```

6. Push the branch and the new tag, without force:

   ```bash
   git push origin release/v0.1.0
   git push origin v0.1.0
   ```

   Do not use `git push --force` or `git push --tags --force`.

7. If publishing to npm, publish `0.1.0` after the Git tag is verified. Do not unpublish old versions later. The npm registry currently has no published `p5-epi-shapesvg` package, so there is no `1.1.0` collision to resolve in this release.

### Post-release verification

- [ ] The `v0.0.21` commit ID and `dist` blob ID are unchanged from the pre-release record.
- [ ] The `v0.0.21` CDN URL still serves the old artifact and its SHA-256 matches the pre-release hash.
- [ ] The `v0.1.0` tag points at the release commit.
- [ ] The `v0.1.0` CDN URL serves the new artifact.
- [ ] The new bundle still exposes `EpiShapeSvg.Point`, `EpiShapeSvg.Line`, and `EpiShapeSvg.Polygon`.
- [ ] An existing sketch pinned to `@v0.0.21` still runs unchanged.
- [ ] A new sketch using `@v0.1.0` shows the intended behavior.

Useful checks:

```bash
git rev-parse "v0.0.21^{commit}"
git rev-parse "v0.0.21:dist/p5-epi-shapesvg.js"
git rev-parse "v0.1.0^{commit}"
git rev-parse "v0.1.0:dist/p5-epi-shapesvg.js"
```

```powershell
curl.exe -L -o new-v0.1.0.js "https://cdn.jsdelivr.net/gh/epibyte/p5-epi-shapesvg@v0.1.0/dist/p5-epi-shapesvg.js"
Get-FileHash new-v0.1.0.js -Algorithm SHA256
```

### Behavior changes in `v0.1.0`

These are intentional and must be listed in the CHANGELOG:

- Multi-ring clip masks use even-odd semantics instead of sequential per-ring filtering.
- Clipping and merging results no longer alias input `Point` instances.
- `createArc()` rotates around the arc center.
- `isOverlapping()` returns `false` for empty polygons.
- `addPoint()` works on an empty polygon.
- Epsilon comparisons are dimensionally correct.

Sketches pinned to `v0.0.21` are unaffected. Do not add permanent legacy-mode flags just to preserve the old clipping behavior; versioned tags are the compatibility mechanism. If a user needs the old behavior, they keep using `v0.0.21`.

### If something is wrong after tagging

- **Before pushing the tag:** fix the commit locally, delete the local tag, and recreate it.
- **After pushing the tag:** do not move `v0.1.0`. Fix forward with `v0.1.1`.
- **Never touch `v0.0.21`** as part of a fix.

### Tag protection

If GitHub rulesets or tag protection are available, protect tags matching `v*` from deletion and non-fast-forward updates. At minimum, document the no-retag rule in the release notes and keep the old GitHub release/assets intact.

## WS5 — Optional refactor and performance work

Do these only after the behavior is stable and tested.

| ID | Task | Size | Depends on | Done when |
|---|---|---|---|---|
| P2-2 | Extract clipping helpers | M | P0-7, P0-8 | Pure helpers move out of `Polygon` without changing the public API or test results |
| P2-3 | Move or remove `getSkeleton()` | S | D5 | Main bundle no longer carries experimental skeleton code unless intentionally retained |
| P2-4 | Benchmark clipping on large paths | M | P0-7 | A repeatable benchmark exists; optimization is justified by measured pain, not guesswork |
| P2-5 | Reduce repeated bbox/optimize work | M | P2-4 | Batching removes avoidable full scans without changing behavior |
| P2-6 | Plan 2.0 naming cleanup | S | D3 | A separate proposal covers `merge` → concat, `optimize` → merge-adjacent-rings, and `outerHull` → approximate union |

Do **not** split `Point` or `Line`. The maintainability cost is concentrated in `Polygon` and the clipping algorithm.

## Test matrix

Add these to `test/polygon-clip-tests.js` unless noted.

| Case | Operation | Expected |
|---|---|---|
| Line crosses single square | `clipLine(..., true/false)` | Inside/outside segments correct |
| Line fully inside | `clipLine(..., true)` | Original segment |
| Line fully outside | `clipLine(..., true)` | Empty |
| Line tangent to a vertex | `clipLine` | Defined result, no unpaired leftovers |
| Line collinear with an edge | `clipLine` | Documented behavior, no crashes |
| Zero-length line | `clipLine` | Empty or single point by policy |
| Square with hole | `clipLine` | Excludes hole interior, returns material only |
| Two disjoint mask rings | `clipLine` | Treats mask as union, not intersection |
| Nested rings | `clipLine` | Even-odd result matches `isPointIn` |
| Empty receiver | `clipTo` | Empty result |
| Empty mask | `clipTo` | Documented no-op or empty result, consistently |
| Overlapping squares | `clipTo` | Only receiver paths inside mask |
| Identical polygons | `outerHull` | One clean ring, no duplicate boundary |
| Touching polygons | `outerHull` | Union boundary without duplicate shared edge |
| Contained polygon | `outerHull` | Outer boundary only |
| Disjoint polygons | `outerHull` | Both rings preserved |
| Empty polygon overlap | `isOverlapping` | `false` |
| Result mutation | `clipTo`/`merge`/`outerHull` | Source unchanged |
| Arc with non-origin center | `createArc` | Rotation around center |
| Empty polygon point add | `addPoint` | First ring created |
| Non-finite inputs | Constructors/setters | Rejected or explicitly documented |

## Suggested execution order

### PR 1 — Safety net, no behavior change

- Fix the runner exit code.
- Make each suite report its own summary.
- Add `test/polygon-clip-tests.js` with currently correct single-ring and empty-input cases.
- Add a deliberately failing test in a temporary branch to prove the exit code works, then remove it.

### PR 2 — Low-risk correctness fixes

- `createArc` center rotation.
- `addPoint` empty guard.
- `isOverlapping` empty guard.
- `insertIntersectionPoint` epsilon fix.
- `clipPts` debug/double-rotation cleanup.
- Tests for each.

### PR 3 — Clipping semantics

- Record the D1 decision.
- Rewrite `clipLine` for the chosen multi-ring semantics.
- Add the multi-ring and degenerate test matrix.
- Recheck `clipTo`, `outerHull`, and `isOverlapping`.

### PR 4 — Ownership and union hardening

- Deep-copy public outputs.
- Fix `outerHull` duplicate/coincident-boundary behavior.
- Add mutation-isolation tests.
- Benchmark before considering bbox/optimize micro-optimizations.

### PR 5 — Docs and release

- README, JSDoc, CHANGELOG, AGENTS.
- Build tooling and CI if D4 says yes.
- Set `package.json` to `0.1.0`.
- Rebuild `dist/`, smoke-test it, and tag the release commit as `v0.1.0`.
- Verify that `v0.0.21` and its `dist` blob are unchanged.

## Definition of done

- [ ] `npm test` exits non-zero on failure and all suites are included.
- [ ] Multi-ring clip behavior is defined, implemented, and tested in both inside/outside modes.
- [ ] `clipTo` has automated tests for crossing, contained, disjoint, empty, and multi-ring cases.
- [ ] `outerHull` has geometric assertions, not `length >= 0`.
- [ ] Mutating a public result does not mutate its inputs.
- [ ] Empty polygons are safe for `isOverlapping`, `clipTo`, and `addPoint`.
- [ ] `createArc` rotates around its center.
- [ ] Epsilon comparisons are dimensionally correct.
- [ ] No debug `console.log` remains in library code.
- [ ] README, JSDoc, CHANGELOG, and AGENTS match the code.
- [ ] `dist/` is rebuilt and smoke-tested.
- [ ] `package.json`, CHANGELOG, and the `v0.1.0` tag agree.
- [ ] `v0.0.21` still resolves to its original commit and `dist` blob.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Rewriting `clipLine` regresses simple single-ring behavior | Land regression tests before the rewrite; compare old/new outputs for the existing suite |
| Even-odd semantics break users who relied on sequential ring filtering | Treat the current behavior as a bug, document the fix, release as `0.1.0`; pinned `v0.0.21` users are unaffected |
| Deep copying hurts performance | Copy only at public boundaries; benchmark large paths before optimizing further |
| `outerHull` fixes turn into a robust-union project | Limit scope to duplicate/coincident boundaries and documented approximate behavior |
| Adding build deps changes the project’s “dependency-free” character | Keep them as dev dependencies only; runtime remains dependency-free |
| Dist and source drift | CI build check or release checklist smoke test |
| `v0.0.21` is moved or deleted | Tag protection, annotated tags, no force-push, pre/post-release commit and blob comparison |
| `package.json` `1.1.0` conflicts with the `v0.1.0` tag | Set `package.json` to `0.1.0` in the release commit; the npm registry currently has no published package |
| Old CDN URL breaks because the repository is renamed/deleted | Keep the repository name and old tags; verify the old CDN URL after release |
| Plan becomes a large refactor | Enforce the non-goals below; defer WS5 until after release |

## Non-goals

- Building a clipper-class, fully robust polygon boolean engine.
- Full topology repair, self-intersection resolution, or winding-rule configuration.
- TypeScript migration or generated `.d.ts` files in this pass.
- Replacing p5 global drawing with an injected renderer.
- Renaming public APIs in this release.
- Removing `clipPts()` or `getSkeleton()` in `0.1.0`.
- Rewriting `Point`, `Line`, or the test runner beyond the exit-code fix.
