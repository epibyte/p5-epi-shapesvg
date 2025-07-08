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

const poly5edge = Polygon.createNEdges(5, 100, new Point(40, 60), Math.PI / 4);
console.log(poly5edge.toString());

const polyEmpty = new Polygon();
console.log(polyEmpty.toString());

const tria1 = new Polygon([new Point(10, 50), new Point(50, 10), new Point(90, 50)], true);
const tria2 = new Polygon([new Point(10, 70), new Point(50, 30), new Point(90, 70)], true);
const tria3 = new Polygon([new Point(10, 20), new Point(90, 20), new Point(50, 60)], true);
tria3.addPtsArr(tria1.pts[0]); // add tria1 points to tria3
console.log("tria1", tria1.toString());
const unionTriangles = Polygon.outerHull(tria1, tria2, tria3);
console.log("unionTriangles", unionTriangles.toSVG());

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
const clippedLinePoly = clipLinePoly.clipTo(clipBoundary2);
console.log('Clipped clippedLinePoly:', clippedLinePoly);
console.log('clippedLinePoly.toSVG():', clippedLinePoly.toSVG());

// Star, Box, merging
console.log('\nStar\n');

const starRad = 200;
const mbox = Polygon.createNEdges(4, starRad/2, new Point(starRad+100, starRad+100), Math.PI/4);
// mbox.drawShape();
const star = Polygon.createStar(5, starRad, starRad/4, new Point(starRad+100, starRad+100), 0.4);
// star.drawShape();

const outerStar = star.clipTo(mbox, false);
// outerStar.drawShape();
console.log("outerStar", outerStar.toSVG());

const outerBox = mbox.clipTo(star, false);
// outerBox.drawShape();
console.log("outerBox", outerBox.toSVG());

const mergedShapes = outerStar.merge(outerBox);
console.log("mergedShapes", mergedShapes.toSVG());
console.log("mergedShapes.optimize()", mergedShapes.optimize().toSVG());/*
mergedShapes
<polyline points="370.7,352.8 370.7,370.7 318.2,370.7 282.9,499.3 270.4,370.7 229.3,370.7 229.3,339.5 105.2,345.3 229.3,291.3 229.3,229.3 234.6,229.3 196.7,128.7 285.8,229.3 330.4,229.3 431.0,148.9 370.7,251.3 370.7,303.2 484.2,377.9 370.7,352.8" />
*/

const multipleLinesPoly = new Polygon();
for (let y = 100; y <= 500; y += 10) {
  multipleLinesPoly.addPtsArr([new Point(100, y), new Point(500, y)]);
}
console.log('Multiple Lines Polygon:', multipleLinesPoly.toSVG());

const hashedLines = multipleLinesPoly.clipTo(mergedShapes);
console.log('Hashed Lines:', hashedLines.toSVG());
console.log('Hashed Lines optimized:', hashedLines.optimize().toSVG());