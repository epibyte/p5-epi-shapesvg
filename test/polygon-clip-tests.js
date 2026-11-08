import TestRunner from './test-runner.js';
import Point from '../src/Point.js';
import Polygon from '../src/Polygon.js';

const runner = new TestRunner();

// Build a closed rectangular ring from x, y, width, height.
const rectangle = (x, y, width, height) => new Polygon([
  new Point(x, y),
  new Point(x + width, y),
  new Point(x + width, y + height),
  new Point(x, y + height)
], true);

// Assert a ring matches expected [x, y] pairs in order.
const assertRing = (ring, expected) => {
  runner.assertEqual(ring.length, expected.length,
    `Expected ring of ${expected.length} points, got ${ring.length}`);
  expected.forEach(([x, y], i) => {
    runner.assertAlmostEqual(ring[i].x, x, 1e-10, `Point ${i} x: expected ~${x}, got ${ring[i].x}`);
    runner.assertAlmostEqual(ring[i].y, y, 1e-10, `Point ${i} y: expected ~${y}, got ${ring[i].y}`);
  });
};

runner.describe('Polygon clipping', () => {

  // ---- clipLine: single ring, currently correct behavior ----

  runner.test('clipLine crossing a single ring keeps the inside segment', () => {
    const rect = rectangle(0, 0, 10, 10);
    const clipped = rect.clipLine(new Point(-5, 5), new Point(15, 5));

    runner.assertEqual(clipped.pts.length, 1);
    assertRing(clipped.pts[0], [[0, 5], [10, 5]]);
  });

  runner.test('clipLine fully inside a single ring returns the original segment', () => {
    const rect = rectangle(0, 0, 10, 10);
    const clipped = rect.clipLine(new Point(2, 5), new Point(8, 5));

    runner.assertEqual(clipped.pts.length, 1);
    assertRing(clipped.pts[0], [[2, 5], [8, 5]]);
  });

  runner.test('clipLine fully outside a single ring returns no segments', () => {
    const rect = rectangle(0, 0, 10, 10);
    const clipped = rect.clipLine(new Point(15, 5), new Point(25, 5));

    runner.assertEqual(clipped.pts.length, 0);
  });

  runner.test('clipLine outside mode keeps the segments outside the ring', () => {
    const rect = rectangle(0, 0, 10, 10);
    const clipped = rect.clipLine(new Point(-5, 5), new Point(15, 5), false);

    runner.assertEqual(clipped.pts.length, 2);
    assertRing(clipped.pts[0], [[-5, 5], [0, 5]]);
    assertRing(clipped.pts[1], [[10, 5], [15, 5]]);
  });

  // ---- clipTo: basic behavior ----

  runner.test('clipTo keeps only the receiver path inside the mask', () => {
    const a = rectangle(0, 0, 10, 10);
    const b = rectangle(5, 5, 10, 10);
    const clipped = a.clipTo(b);

    runner.assertEqual(clipped.pts.length, 1);
    assertRing(clipped.pts[0], [[10, 5], [10, 10], [5, 10]]);
  });

  runner.test('clipTo with inside=false excludes the masked region', () => {
    const a = rectangle(0, 0, 10, 10);
    const b = rectangle(5, 5, 10, 10);
    const clipped = a.clipTo(b, false);

    runner.assertEqual(clipped.pts.length, 1);
    assertRing(clipped.pts[0], [[5, 10], [0, 10], [0, 0], [10, 0], [10, 5]]);
  });

  runner.test('clipTo clips a line path against a rectangle', () => {
    const line = new Polygon([new Point(2, 5), new Point(8, 5)]);
    const rect = rectangle(0, 0, 10, 10);
    const clipped = line.clipTo(rect);

    runner.assertEqual(clipped.pts.length, 1);
    assertRing(clipped.pts[0], [[2, 5], [8, 5]]);
  });

  runner.test('clipTo returns a contained receiver ring unchanged', () => {
    const outer = rectangle(0, 0, 10, 10);
    const inner = rectangle(2, 2, 6, 6);
    const clipped = inner.clipTo(outer);

    runner.assertEqual(clipped.pts.length, 1);
    assertRing(clipped.pts[0], [[2, 8], [2, 2], [8, 2], [8, 8], [2, 8]]);
  });

  runner.test('clipTo returns no paths when the receiver surrounds the mask', () => {
    // clipTo clips the receiver's paths; it is not a boolean intersection.
    const big = rectangle(-5, -5, 20, 20);
    const mask = rectangle(0, 0, 10, 10);

    runner.assertEqual(big.clipTo(mask).pts.length, 0);
  });

  runner.test('clipTo returns no paths for a disjoint mask', () => {
    const a = rectangle(0, 0, 10, 10);
    const far = rectangle(20, 20, 5, 5);

    runner.assertEqual(a.clipTo(far).pts.length, 0);
  });

  // ---- Empty receiver / mask cases (current behavior) ----

  runner.test('clipTo on an empty receiver returns an empty polygon', () => {
    const empty = new Polygon();
    const mask = rectangle(0, 0, 10, 10);
    const clipped = empty.clipTo(mask);

    runner.assertEqual(clipped.pts.length, 0);
  });

  runner.test('clipTo with an empty mask is a no-op', () => {
    // Current behavior: an empty mask leaves the receiver unchanged.
    const a = rectangle(0, 0, 10, 10);
    const clipped = a.clipTo(new Polygon());

    runner.assertEqual(clipped.pts.length, 1);
    assertRing(clipped.pts[0], [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]);
  });

  runner.test('clipLine against an empty polygon returns the original segment', () => {
    // Current behavior: with no mask rings there is nothing to clip against.
    const empty = new Polygon();
    const clipped = empty.clipLine(new Point(0, 0), new Point(10, 10));

    runner.assertEqual(clipped.pts.length, 1);
    assertRing(clipped.pts[0], [[0, 0], [10, 10]]);
  });

});

runner.run();

export default runner;
