
# p5-epi-shapesvg

Helper for basic shape operations for js, e.g. p5.js, including SVG support.

## Class Overview

### Point
Represents a 2D point with x and y coordinates.
- Methods: `copy()`, `set(x, y)`, `equals(otherPoint, epsilon)`, `distanceTo(otherPoint)`, `lerp(otherPoint, f)`, `translate(vec)`

### Line
Represents a line segment between two `Point` objects.
- Methods: `length()`, `midPt()`, `lerpPt(f)`, `lerpLine(otherLine, f)`, `segmentIntersection(otherLine)`


### Polygon
Represents one or more polylines (rings), which can be open or closed. Used for polygons, polylines, and collections of lines.
- Methods: `addPoint(pt)`, `addPtsArr(ptsArr, closePath)`, `closeLastPath()`, `merge(other)`, `optimize()`, `clipTo(otherPoly, inside, rotation)`, `clipLine(p1, p2, inside)`, `isPointIn(pt)`, `toSVG(prec)`, `drawShape()`
- Static Methods:
  - `Polygon.createNEdges(nEdges, radius, center, rotation)` — create a regular polygon
  - `Polygon.createStar(nEdges, radiusOuter, radiusInner, center, rotation)` — create a star shape
  - `Polygon.createArc(center, dim, startAngle, stopAngle, rotation)` — create an arc/ellipse segment
  - `Polygon.outerHull(...polys)` — returns the union/outer hull of multiple polygons


## Usage Example (ES Module)

```js
import Point from './src/Point.js';
import Line from './src/Line.js';
import Polygon from './src/Polygon.js';

// Create triangles
const tria1 = new Polygon([new Point(10, 50), new Point(50, 10), new Point(90, 50)], true);
const tria2 = new Polygon([new Point(10, 70), new Point(50, 30), new Point(90, 70)], true);
const tria3 = new Polygon([new Point(10, 20), new Point(90, 20), new Point(50, 60)], true);

// Compute the union (outer hull) of three triangles
const unionTriangles = Polygon.outerHull(tria1, tria2, tria3);
console.log('Union as SVG:', unionTriangles.toSVG());

// Clip a set of lines against a polygon
const multipleLinesPoly = new Polygon();
for (let y = 100; y <= 500; y += 10) {
  multipleLinesPoly.addPtsArr([new Point(100, y), new Point(500, y)]);
}
const hashedLines = multipleLinesPoly.clipTo(unionTriangles);
console.log('Clipped lines as SVG:', hashedLines.toSVG());
```

## Usage Example (OpenProcessing / CDN)

1. In OpenProcessing, go to **Sketch > Libraries > Add .js File** and paste URL:
   
   `https://cdn.jsdelivr.net/gh/epibyte/p5-epi-shapesvg@v0.0.7/dist/p5-epi-shapesvg.js`

2. Use the classes from the global `EpiShapeSvg` object:

```js
const { Point, Line, Polygon } = EpiShapeSvg;

// Create triangles
const tria1 = new Polygon([new Point(10, 50), new Point(50, 10), new Point(90, 50)], true);
const tria2 = new Polygon([new Point(10, 70), new Point(50, 30), new Point(90, 70)], true);
const tria3 = new Polygon([new Point(10, 20), new Point(90, 20), new Point(50, 60)], true);

// Compute the union (outer hull) of three triangles
const unionTriangles = Polygon.outerHull(tria1, tria2, tria3);
console.log('Union as SVG:', unionTriangles.toSVG());

// Clip a set of lines against a polygon
const multipleLinesPoly = new Polygon();
for (let y = 100; y <= 500; y += 10) {
  multipleLinesPoly.addPtsArr([new Point(100, y), new Point(500, y)]);
}
const hashedLines = multipleLinesPoly.clipTo(unionTriangles);
console.log('Clipped lines as SVG:', hashedLines.toSVG());
```

## Notes
- All classes are designed for use with p5.js and SVG workflows.
- `Polygon` can represent both polygons and polylines (open or closed).
- Use `clipTo()` for clipping polygons or polylines against other polygons.
- Use `merge()` and `optimize()` to combine and clean up multiple rings.
