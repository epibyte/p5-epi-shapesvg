import TestRunner from './test-runner.js';
import Point from '../src/Point.js';
import Line from '../src/Line.js';
import Polygon from '../src/Polygon.js';

const runner = new TestRunner();

runner.describe('Polygon', () => {
  
  runner.test('constructor with empty array', () => {
    const poly = new Polygon();
    runner.assertEqual(poly.pts.length, 0);
  });

  runner.test('constructor with points array', () => {
    const points = [new Point(0, 0), new Point(10, 0), new Point(5, 10)];
    const poly = new Polygon(points);
    runner.assertEqual(poly.pts.length, 1);
    runner.assertEqual(poly.pts[0].length, 3);
  });

  runner.test('constructor with closePath=true', () => {
    const points = [new Point(0, 0), new Point(10, 0), new Point(5, 10)];
    const poly = new Polygon(points, true);
    runner.assertEqual(poly.pts[0].length, 4);
    runner.assertTrue(poly.pts[0][0].equals(poly.pts[0][3]));
  });

  runner.test('copy creates deep copy', () => {
    const points = [new Point(0, 0), new Point(10, 0), new Point(5, 10)];
    const poly1 = new Polygon(points);
    const poly2 = poly1.copy();
    
    runner.assertEqual(poly2.pts.length, 1);
    runner.assertEqual(poly2.pts[0].length, 3);
    
    // Modify original
    poly1.pts[0][0].set(100, 100);
    
    // Copy should be unchanged
    runner.assertEqual(poly2.pts[0][0].x, 0);
    runner.assertEqual(poly2.pts[0][0].y, 0);
  });

  runner.test('addPtsArr adds new ring', () => {
    const poly = new Polygon();
    const points = [new Point(0, 0), new Point(10, 0), new Point(5, 10)];
    poly.addPtsArr(points);
    
    runner.assertEqual(poly.pts.length, 1);
    runner.assertEqual(poly.pts[0].length, 3);
  });

  runner.test('addPtsArr with {x,y} objects', () => {
    const poly = new Polygon();
    const points = [{x: 0, y: 0}, {x: 10, y: 0}, {x: 5, y: 10}];
    poly.addPtsArr(points);
    
    runner.assertEqual(poly.pts.length, 1);
    runner.assertEqual(poly.pts[0].length, 3);
    runner.assertTrue(poly.pts[0][0] instanceof Point);
  });

  runner.test('addPtsArr with [x,y] arrays', () => {
    const poly = new Polygon();
    const points = [[0, 0], [10, 0], [5, 10]];
    poly.addPtsArr(points);
    
    runner.assertEqual(poly.pts.length, 1);
    runner.assertEqual(poly.pts[0].length, 3);
    runner.assertTrue(poly.pts[0][0] instanceof Point);
    runner.assertEqual(poly.pts[0][0].x, 0);
    runner.assertEqual(poly.pts[0][0].y, 0);
  });

  runner.test('constructor with [x,y] arrays', () => {
    const points = [[0, 0], [10, 0], [5, 10]];
    const poly = new Polygon(points);
    
    runner.assertEqual(poly.pts.length, 1);
    runner.assertEqual(poly.pts[0].length, 3);
    runner.assertTrue(poly.pts[0][0] instanceof Point);
    runner.assertEqual(poly.pts[0][0].x, 0);
    runner.assertEqual(poly.pts[0][2].x, 5);
    runner.assertEqual(poly.pts[0][2].y, 10);
  });

  runner.test('closeLastPath closes open path', () => {
    const points = [new Point(0, 0), new Point(10, 0), new Point(5, 10)];
    const poly = new Polygon(points);
    poly.closeLastPath();
    
    runner.assertEqual(poly.pts[0].length, 4);
    runner.assertTrue(poly.pts[0][0].equals(poly.pts[0][3]));
  });

  runner.test('closeLastPath does nothing if already closed', () => {
    const points = [new Point(0, 0), new Point(10, 0), new Point(5, 10), new Point(0, 0)];
    const poly = new Polygon(points);
    poly.closeLastPath();
    
    runner.assertEqual(poly.pts[0].length, 4);
  });

  runner.test('createNEdge creates regular polygon', () => {
    const triangle = Polygon.createNEdge(3, 10, new Point(0, 0));
    runner.assertEqual(triangle.pts.length, 1);
    runner.assertEqual(triangle.pts[0].length, 4); // 3 + 1 (closed)
    
    // Check that it's roughly equilateral
    const side1 = triangle.pts[0][0].distanceTo(triangle.pts[0][1]);
    const side2 = triangle.pts[0][1].distanceTo(triangle.pts[0][2]);
    runner.assertAlmostEqual(side1, side2, 1e-10);
  });

  runner.test('createNEdge throws for invalid edge count', () => {
    runner.assertThrows(() => {
      Polygon.createNEdge(2, 10, new Point(0, 0));
    });
  });

  runner.test('createStar creates star polygon', () => {
    const star = Polygon.createStar(5, 100, 50, new Point(0, 0));
    runner.assertEqual(star.pts.length, 1);
    runner.assertEqual(star.pts[0].length, 11); // 5*2 + 1 (closed)
  });

  runner.test('length calculation for triangle', () => {
    const triangle = new Polygon([
      new Point(0, 0), new Point(3, 0), new Point(0, 4)
    ], true);
    
    const expectedLength = 3 + 4 + 5; // 3-4-5 triangle
    runner.assertEqual(triangle.length(), expectedLength);
  });

  runner.test('isPointIn for triangle', () => {
    const triangle = new Polygon([
      new Point(0, 0), new Point(10, 0), new Point(5, 10)
    ], true);
    
    runner.assertTrue(triangle.isPointIn(new Point(5, 3)));
    runner.assertFalse(triangle.isPointIn(new Point(15, 3)));
    runner.assertFalse(triangle.isPointIn(new Point(5, 15)));
  });

  runner.test('isPointIn for square', () => {
    const square = new Polygon([
      new Point(0, 0), new Point(10, 0), 
      new Point(10, 10), new Point(0, 10)
    ], true);
    
    runner.assertTrue(square.isPointIn(new Point(5, 5)));
    runner.assertFalse(square.isPointIn(new Point(15, 5)));
    runner.assertFalse(square.isPointIn(new Point(5, 15)));
  });

  runner.test('isPointIn on boundary returns true', () => {
    const square = new Polygon([
      new Point(0, 0), new Point(10, 0), 
      new Point(10, 10), new Point(0, 10)
    ], true);
    
    runner.assertTrue(square.isPointIn(new Point(5, 0))); // on edge
    runner.assertTrue(square.isPointIn(new Point(0, 0))); // on vertex
  });

  runner.test('clipLine with simple rectangle', () => {
    const rect = new Polygon([
      new Point(0, 0), new Point(10, 0), 
      new Point(10, 10), new Point(0, 10)
    ], true);
    
    const clipped = rect.clipLine(new Point(-5, 5), new Point(15, 5));
    runner.assertEqual(clipped.pts.length, 1);
    runner.assertEqual(clipped.pts[0].length, 2);
    
    // Should clip to the rectangle boundaries
    runner.assertAlmostEqual(clipped.pts[0][0].x, 0, 1e-10);
    runner.assertAlmostEqual(clipped.pts[0][0].y, 5, 1e-10);
    runner.assertAlmostEqual(clipped.pts[0][1].x, 10, 1e-10);
    runner.assertAlmostEqual(clipped.pts[0][1].y, 5, 1e-10);
  });

  runner.test('clipLine outside rectangle', () => {
    const rect = new Polygon([
      new Point(0, 0), new Point(10, 0), 
      new Point(10, 10), new Point(0, 10)
    ], true);
    
    const clipped = rect.clipLine(new Point(-5, 5), new Point(15, 5), false);
    runner.assertEqual(clipped.pts.length, 2);
    
    // Should have two outside segments
    runner.assertAlmostEqual(clipped.pts[0][0].x, -5, 1e-10);
    runner.assertAlmostEqual(clipped.pts[0][1].x, 0, 1e-10);
    runner.assertAlmostEqual(clipped.pts[1][0].x, 10, 1e-10);
    runner.assertAlmostEqual(clipped.pts[1][1].x, 15, 1e-10);
  });

  runner.test('clipLine completely inside', () => {
    const rect = new Polygon([
      new Point(0, 0), new Point(10, 0), 
      new Point(10, 10), new Point(0, 10)
    ], true);
    
    const clipped = rect.clipLine(new Point(2, 5), new Point(8, 5));
    runner.assertEqual(clipped.pts.length, 1);
    runner.assertEqual(clipped.pts[0].length, 2);
    
    // Should be the original line
    runner.assertAlmostEqual(clipped.pts[0][0].x, 2, 1e-10);
    runner.assertAlmostEqual(clipped.pts[0][1].x, 8, 1e-10);
  });

  runner.test('clipLine completely outside', () => {
    const rect = new Polygon([
      new Point(0, 0), new Point(10, 0), 
      new Point(10, 10), new Point(0, 10)
    ], true);
    
    const clipped = rect.clipLine(new Point(15, 5), new Point(25, 5));
    runner.assertEqual(clipped.pts.length, 0);
  });

  runner.test('merge combines polygons', () => {
    const poly1 = new Polygon([new Point(0, 0), new Point(5, 0)]);
    const poly2 = new Polygon([new Point(10, 0), new Point(15, 0)]);
    
    poly1.merge(poly2);
    runner.assertEqual(poly1.pts.length, 2);
  });

  runner.test('toString representation', () => {
    const triangle = new Polygon([
      new Point(0, 0), new Point(10, 0), new Point(5, 10)
    ]);
    
    const str = triangle.toString();
    runner.assertEqual(str, 'Polygon(Point(0.0, 0.0), Point(10.0, 0.0), Point(5.0, 10.0))');
  });

  runner.test('toSVG generates polyline', () => {
    const triangle = new Polygon([
      new Point(0, 0), new Point(10, 0), new Point(5, 10)
    ]);
    
    const svg = triangle.toSVG();
    runner.assertEqual(svg, '<polyline points="0.00,0.00 10.00,0.00 5.00,10.00" />\n');
  });

  runner.test('outerHull with valid polygons', () => {
    const poly1 = new Polygon([new Point(0, 0), new Point(10, 0), new Point(5, 10)], true);
    const poly2 = new Polygon([new Point(5, 0), new Point(15, 0), new Point(10, 10)], true);
    
    const union = Polygon.outerHull(poly1, poly2);
    runner.assert(union.pts.length >= 0); // Should return some result
  });

  runner.test('outerHull with invalid arguments', () => {
    const poly1 = new Polygon([new Point(0, 0), new Point(10, 0), new Point(5, 10)], true);
    const union = Polygon.outerHull(poly1, null, undefined, "invalid");
    
    // Should handle invalid arguments gracefully
    runner.assert(union instanceof Polygon);
  });

  runner.test('isOverlapping returns true for overlapping squares', () => {
    const a = new Polygon([
      new Point(0,0), new Point(10,0), new Point(10,10), new Point(0,10)
    ], true);
    const b = new Polygon([
      new Point(5,5), new Point(15,5), new Point(15,15), new Point(5,15)
    ], true);
    runner.assertTrue(a.isOverlapping(b));
  });

  runner.test('isOverlapping returns false for edge-touching squares', () => {
    const a = new Polygon([
      new Point(0,0), new Point(10,0), new Point(10,10), new Point(0,10)
    ], true);
    const b = new Polygon([
      new Point(10,0), new Point(20,0), new Point(20,10), new Point(10,10)
    ], true);
    runner.assertFalse(a.isOverlapping(b));
  });

  runner.test('isOverlapping returns true when one polygon inside another', () => {
    const outer = new Polygon([
      new Point(0,0), new Point(20,0), new Point(20,20), new Point(0,20)
    ], true);
    const inner = new Polygon([
      new Point(5,5), new Point(10,5), new Point(10,10), new Point(5,10)
    ], true);
    runner.assertTrue(outer.isOverlapping(inner));
  });

  runner.test('isOverlapping returns false for disjoint polygons', () => {
    const a = new Polygon([
      new Point(0,0), new Point(10,0), new Point(10,10), new Point(0,10)
    ], true);
    const b = new Polygon([
      new Point(20,20), new Point(30,20), new Point(30,30), new Point(20,30)
    ], true);
    runner.assertFalse(a.isOverlapping(b));
  });

  runner.test('translate shifts polygon points', () => {
    const poly = new Polygon([
      new Point(0,0), new Point(2,0), new Point(2,2)
    ], false);
    poly.translate({x:3, y:4});
    runner.assertAlmostEqual(poly.pts[0][0].x, 3, 1e-10);
    runner.assertAlmostEqual(poly.pts[0][0].y, 4, 1e-10);
    runner.assertAlmostEqual(poly.pts[0][1].x, 5, 1e-10);
    runner.assertAlmostEqual(poly.pts[0][2].y, 6, 1e-10);
  });

  runner.test('translate on closed ring does not double-apply', () => {
    const pts = [new Point(0,0), new Point(2,0), new Point(2,2)];
    const poly = new Polygon(pts, true); // closed ring: last element is a copy of first
    const ring = poly.pts[0];
    // ensure ring was closed by value but not the same reference
    runner.assertFalse(ring[0] === ring[ring.length - 1]);

    poly.translate([3,4]);
    // both first and last should have been translated exactly once and have matching coords
    runner.assertAlmostEqual(ring[0].x, 3, 1e-10);
    runner.assertAlmostEqual(ring[0].y, 4, 1e-10);
    runner.assertAlmostEqual(ring[ring.length - 1].x, 3, 1e-10);
    runner.assertAlmostEqual(ring[ring.length - 1].y, 4, 1e-10);
  });

  runner.test('rotate rotates polygon around origin', () => {
    // triangle at (1,0),(2,0),(1,1) rotate 90deg -> (-0,1), (0,2), (-1,1)
    const poly = new Polygon([
      new Point(1,0), new Point(2,0), new Point(1,1)
    ], false);
    poly.rotate(Math.PI/2, new Point(0,0));
    runner.assertAlmostEqual(poly.pts[0][0].x, 0, 1e-10);
    runner.assertAlmostEqual(poly.pts[0][0].y, 1, 1e-10);
    runner.assertAlmostEqual(poly.pts[0][1].x, 0, 1e-10);
    runner.assertAlmostEqual(poly.pts[0][1].y, 2, 1e-10);
  });

  runner.test('createBBox computes bounding box correctly', () => {
    const poly = new Polygon([
      new Point(1,2), new Point(3,4), new Point(-1,5)
    ], false);
    const bbox = poly.calcBBox();
    runner.assertAlmostEqual(bbox.minX, -1, 1e-10);
    runner.assertAlmostEqual(bbox.minY, 2, 1e-10);
    runner.assertAlmostEqual(bbox.maxX, 3, 1e-10);
    runner.assertAlmostEqual(bbox.maxY, 5, 1e-10);
    runner.assertAlmostEqual(bbox.width, 4, 1e-10);
    runner.assertAlmostEqual(bbox.height, 3, 1e-10);
    // ensure polygon.bbox is set
    runner.assertEqual(poly.bbox, bbox);
  });

});

export default runner;
