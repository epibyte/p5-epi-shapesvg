import Point from '../src/Point.js';
import Line from '../src/Line.js';
import Polygon from '../src/Polygon.js';

const p1 = new Point(10, 20);
const p2 = new Point(30, 40);
const l1 = new Line(p1, p2);
const l1mp = l1.midPt();
const l1vec = new Point(1, 1);
const l1tp = l1mp.translate(l1vec);

const p3 = new Point(40, 10);
const p4 = new Point(10, 50);
const l2 = new Line(p3, p4);
const intersection = l1.segmentIntersection(l2);

console.log(p1.toString());
console.log(p2.toString());
console.log(l1.toString()); // Line(Point(10, 20) -> Point(30, 40))
console.log('Length:', l1.length());
console.log('Midpoint:', l1mp.toString(), l1mp);
console.log('isInSegmentArea():', l1mp.isInSegmentArea(l1));
console.log('vec:', l1vec.toString());
console.log('translate():', l1tp.toString());
console.log('isInSegmentArea():', l1tp.isInSegmentArea(l1));
console.log('Segment Intersection:', intersection); 

const poly5edge = Polygon.createFromNEdges(5, 100, new Point(40, 60), Math.PI / 4);
console.log(poly5edge.toString());

const polyEmpty = new Polygon();
console.log(polyEmpty.toString());

const tria1 = new Polygon([new Point(10, 50), new Point(50, 10), new Point(90, 50)], true);
const tria2 = new Polygon([new Point(10, 70), new Point(50, 30), new Point(90, 70)], true);
const tria3 = new Polygon([new Point(10, 20), new Point(90, 20), new Point(50, 60)], true);
tria3.addPtsArr(tria1.pts[0]); // add tria1 points to tria3
console.log(tria1.toString());

for (let x = 0; x<= 90; x+=10) {
  const pt = new Point(x, 40);
  console.log(`${pt} is in tria1:`, tria1.isPointIn(pt));
}

const boundaryPts = new Polygon([new Point(20, 0), new Point(100, 10), new Point(110, 80), new Point(10, 70)], true);
console.log('Boundary Polygon:', boundaryPts.toString(), boundaryPts.pts[0]);
// const clippedTria1 = tria1.clipPts(boundaryPts.pts[0]);
const clippedTria1 = boundaryPts.clipPts(tria1.pts[0]);
console.log('Clipped Triangle 1:', clippedTria1.toSVG());

console.log('\nclipLine\n');
const clipLine = new Line(new Point(0, 50), new Point(100, 50 ));
const clipBoundary = new Polygon([new Point(0, 90), new Point(25, 10), new Point(50, 80), new Point(75, 10), new Point(100, 90)], true);
const clippedLine = clipBoundary.clipLine(clipLine.pt1, clipLine.pt2);
console.log('Clipped Line:', clippedLine);
console.log('clippedLine.toSVG():', clipLine.toSVG());
console.log('pt2.toSVG():', clipLine.pt2.toSVG());

console.log('\nclipPoly\n');
const clipLinePoly = new Polygon([new Point(0, 50), new Point(50, 40), new Point(100, 50 )]);
const clipBoundary2 = new Polygon([new Point(0, 90), new Point(25, 10), new Point(50, 0), new Point(75, 10), new Point(100, 90)], true);
const clippedLinePoly = clipBoundary2.clipPoly(clipLinePoly);
console.log('Clipped clippedLinePoly:', clippedLinePoly);
console.log('clippedLinePoly.toSVG():', clippedLinePoly.toSVG());