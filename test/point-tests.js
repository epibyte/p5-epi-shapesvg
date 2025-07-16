import TestRunner from './test-runner.js';
import Point from '../src/Point.js';

const runner = new TestRunner();

runner.describe('Point', () => {
  
  runner.test('constructor with default values', () => {
    const p = new Point();
    runner.assertEqual(p.x, 0);
    runner.assertEqual(p.y, 0);
  });

  runner.test('constructor with x,y coordinates', () => {
    const p = new Point(10, 20);
    runner.assertEqual(p.x, 10);
    runner.assertEqual(p.y, 20);
  });

  runner.test('constructor with {x,y} object', () => {
    const p = new Point({x: 15, y: 25});
    runner.assertEqual(p.x, 15);
    runner.assertEqual(p.y, 25);
  });

  runner.test('constructor with [x,y] array', () => {
    const p = new Point([30, 40]);
    runner.assertEqual(p.x, 30);
    runner.assertEqual(p.y, 40);
  });

  runner.test('constructor with [x,y] array ignores extra elements', () => {
    const p = new Point([50, 60, 70, 80]);
    runner.assertEqual(p.x, 50);
    runner.assertEqual(p.y, 60);
  });

  runner.test('copy creates independent copy', () => {
    const p1 = new Point(5, 10);
    const p2 = p1.copy();
    runner.assertEqual(p2.x, 5);
    runner.assertEqual(p2.y, 10);
    
    // Modify original, copy should be unchanged
    p1.set(100, 200);
    runner.assertEqual(p2.x, 5);
    runner.assertEqual(p2.y, 10);
  });

  runner.test('set method updates coordinates', () => {
    const p = new Point();
    p.set(15, 25);
    runner.assertEqual(p.x, 15);
    runner.assertEqual(p.y, 25);
  });

  runner.test('equals with identical points', () => {
    const p1 = new Point(3, 4);
    const p2 = new Point(3, 4);
    runner.assertTrue(p1.equals(p2));
  });

  runner.test('equals with different points', () => {
    const p1 = new Point(3, 4);
    const p2 = new Point(5, 6);
    runner.assertFalse(p1.equals(p2));
  });

  runner.test('equals with epsilon tolerance', () => {
    const p1 = new Point(1.0000001, 2.0000001);
    const p2 = new Point(1.0000002, 2.0000002);
    runner.assertTrue(p1.equals(p2, 1e-5));
    runner.assertFalse(p1.equals(p2, 1e-8));
  });

  runner.test('distanceTo calculates correct distance', () => {
    const p1 = new Point(0, 0);
    const p2 = new Point(3, 4);
    runner.assertEqual(p1.distanceTo(p2), 5);
    
    const p3 = new Point(1, 1);
    const p4 = new Point(4, 5);
    runner.assertEqual(p3.distanceTo(p4), 5);
  });

  runner.test('distanceTo with same point', () => {
    const p1 = new Point(10, 20);
    const p2 = new Point(10, 20);
    runner.assertEqual(p1.distanceTo(p2), 0);
  });

  runner.test('distanceSqTo calculates squared distance', () => {
    const p1 = new Point(0, 0);
    const p2 = new Point(3, 4);
    runner.assertEqual(p1.distanceSqTo(p2), 25);
  });

  runner.test('lerp interpolation at endpoints', () => {
    const p1 = new Point(0, 0);
    const p2 = new Point(10, 20);
    
    const lerp0 = p1.lerp(p2, 0);
    runner.assertEqual(lerp0.x, 0);
    runner.assertEqual(lerp0.y, 0);
    
    const lerp1 = p1.lerp(p2, 1);
    runner.assertEqual(lerp1.x, 10);
    runner.assertEqual(lerp1.y, 20);
  });

  runner.test('lerp interpolation at midpoint', () => {
    const p1 = new Point(0, 0);
    const p2 = new Point(10, 20);
    const mid = p1.lerp(p2, 0.5);
    runner.assertEqual(mid.x, 5);
    runner.assertEqual(mid.y, 10);
  });

  runner.test('translate by vector', () => {
    const p = new Point(5, 10);
    const vec = new Point(2, 3);
    const translated = p.translate(vec);
    runner.assertEqual(translated.x, 7);
    runner.assertEqual(translated.y, 13);
    
    // Original should be unchanged
    runner.assertEqual(p.x, 5);
    runner.assertEqual(p.y, 10);
  });

  runner.test('scale by factor', () => {
    const p = new Point(4, 6);
    const scaled = p.scale(2);
    runner.assertEqual(scaled.x, 8);
    runner.assertEqual(scaled.y, 12);
    
    // Original should be unchanged
    runner.assertEqual(p.x, 4);
    runner.assertEqual(p.y, 6);
  });

  runner.test('rotate by 90 degrees around origin', () => {
    const p = new Point(1, 0);
    const rotated = p.rotate(Math.PI / 2);
    runner.assertAlmostEqual(rotated.x, 0, 1e-10);
    runner.assertAlmostEqual(rotated.y, 1, 1e-10);
  });

  runner.test('rotate by 180 degrees around origin', () => {
    const p = new Point(3, 4);
    const rotated = p.rotate(Math.PI);
    runner.assertAlmostEqual(rotated.x, -3, 1e-10);
    runner.assertAlmostEqual(rotated.y, -4, 1e-10);
  });

  runner.test('rotate around custom origin', () => {
    const p = new Point(2, 0);
    const origin = new Point(1, 0);
    const rotated = p.rotate(Math.PI / 2, origin);
    runner.assertAlmostEqual(rotated.x, 1, 1e-10);
    runner.assertAlmostEqual(rotated.y, 1, 1e-10);
  });

  runner.test('toString with default precision', () => {
    const p = new Point(3.14159, 2.71828);
    const str = p.toString();
    runner.assertEqual(str, 'Point(3.1, 2.7)');
  });

  runner.test('toString with custom precision', () => {
    const p = new Point(3.14159, 2.71828);
    const str = p.toString(3);
    runner.assertEqual(str, 'Point(3.142, 2.718)');
  });

  runner.test('toSVG generates correct SVG', () => {
    const p = new Point(10, 20);
    const svg = p.toSVG();
    runner.assertEqual(svg, '<circle cx="10.00" cy="20.00" r="2" />');
  });

  runner.test('toSVG with custom precision', () => {
    const p = new Point(3.14159, 2.71828);
    const svg = p.toSVG(3);
    runner.assertEqual(svg, '<circle cx="3.142" cy="2.718" r="2" />');
  });

});

export default runner;
