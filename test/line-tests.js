import TestRunner from './test-runner.js';
import Point from '../src/Point.js';
import Line from '../src/Line.js';

const runner = new TestRunner();

runner.describe('Line', () => {
  
  runner.test('constructor creates line with two points', () => {
    const p1 = new Point(0, 0);
    const p2 = new Point(10, 10);
    const line = new Line(p1, p2);
    runner.assertEqual(line.pt1, p1);
    runner.assertEqual(line.pt2, p2);
  });

  runner.test('length calculation for horizontal line', () => {
    const line = new Line(new Point(0, 0), new Point(10, 0));
    runner.assertEqual(line.length(), 10);
  });

  runner.test('length calculation for vertical line', () => {
    const line = new Line(new Point(0, 0), new Point(0, 5));
    runner.assertEqual(line.length(), 5);
  });

  runner.test('length calculation for diagonal line', () => {
    const line = new Line(new Point(0, 0), new Point(3, 4));
    runner.assertEqual(line.length(), 5);
  });

  runner.test('length of zero-length line', () => {
    const line = new Line(new Point(5, 5), new Point(5, 5));
    runner.assertEqual(line.length(), 0);
  });

  runner.test('midpoint calculation', () => {
    const line = new Line(new Point(0, 0), new Point(10, 20));
    const mid = line.midPt();
    runner.assertEqual(mid.x, 5);
    runner.assertEqual(mid.y, 10);
  });

  runner.test('lerpPt at endpoints', () => {
    const line = new Line(new Point(0, 0), new Point(10, 20));
    
    const start = line.lerpPt(0);
    runner.assertEqual(start.x, 0);
    runner.assertEqual(start.y, 0);
    
    const end = line.lerpPt(1);
    runner.assertEqual(end.x, 10);
    runner.assertEqual(end.y, 20);
  });

  runner.test('lerpPt at quarter points', () => {
    const line = new Line(new Point(0, 0), new Point(8, 12));
    
    const quarter = line.lerpPt(0.25);
    runner.assertEqual(quarter.x, 2);
    runner.assertEqual(quarter.y, 3);
    
    const threeQuarter = line.lerpPt(0.75);
    runner.assertEqual(threeQuarter.x, 6);
    runner.assertEqual(threeQuarter.y, 9);
  });

  runner.test('segmentIntersection with crossing lines', () => {
    const line1 = new Line(new Point(0, 0), new Point(10, 10));
    const line2 = new Line(new Point(0, 10), new Point(10, 0));
    const intersection = line1.segmentIntersection(line2);
    
    runner.assertNotNull(intersection);
    runner.assertEqual(intersection.x, 5);
    runner.assertEqual(intersection.y, 5);
  });

  runner.test('segmentIntersection with parallel lines', () => {
    const line1 = new Line(new Point(0, 0), new Point(10, 0));
    const line2 = new Line(new Point(0, 5), new Point(10, 5));
    const intersection = line1.segmentIntersection(line2);
    
    runner.assertNull(intersection);
  });

  runner.test('segmentIntersection with non-intersecting segments', () => {
    const line1 = new Line(new Point(0, 0), new Point(5, 5));
    const line2 = new Line(new Point(10, 0), new Point(15, 5));
    const intersection = line1.segmentIntersection(line2);
    
    runner.assertNull(intersection);
  });

  runner.test('segmentIntersection with touching endpoints', () => {
    const line1 = new Line(new Point(0, 0), new Point(5, 5));
    const line2 = new Line(new Point(5, 5), new Point(10, 0));
    const intersection = line1.segmentIntersection(line2);
    
    runner.assertNotNull(intersection);
    runner.assertEqual(intersection.x, 5);
    runner.assertEqual(intersection.y, 5);
  });

  runner.test('segmentIntersection with overlapping segments', () => {
    const line1 = new Line(new Point(0, 0), new Point(10, 0));
    const line2 = new Line(new Point(5, 0), new Point(15, 0));
    const intersection = line1.segmentIntersection(line2);
    
    // Overlapping collinear segments are treated as parallel, so returns null
    runner.assertNull(intersection);
  });

  runner.test('lerpLine interpolation', () => {
    const line1 = new Line(new Point(0, 0), new Point(10, 0));
    const line2 = new Line(new Point(0, 10), new Point(10, 10));
    
    const interpolated = line1.lerpLine(line2, 0.5);
    runner.assertEqual(interpolated.pt1.x, 0);
    runner.assertEqual(interpolated.pt1.y, 5);
    runner.assertEqual(interpolated.pt2.x, 10);
    runner.assertEqual(interpolated.pt2.y, 5);
  });

  runner.test('toString representation', () => {
    const line = new Line(new Point(1, 2), new Point(3, 4));
    const str = line.toString();
    runner.assertEqual(str, 'Line(Point(1.0, 2.0) -> Point(3.0, 4.0))');
  });

  runner.test('toString with custom precision', () => {
    const line = new Line(new Point(1.234, 2.567), new Point(3.891, 4.123));
    const str = line.toString(2);
    runner.assertEqual(str, 'Line(Point(1.23, 2.57) -> Point(3.89, 4.12))');
  });

  runner.test('toSVG generates correct SVG', () => {
    const line = new Line(new Point(10, 20), new Point(30, 40));
    const svg = line.toSVG();
    runner.assertEqual(svg, '<line x1="10.00" y1="20.00" x2="30.00" y2="40.00" />');
  });

});

export default runner;
