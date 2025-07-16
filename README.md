# p5-epi-shapesvg

Helper for basic shape operations for js, e.g. p5.js, including SVG support.

## What Makes This Different

Unlike other polygon clipping libraries such as [clipper2-js](https://www.npmjs.com/package/clipper2-js) or [polygon-clipping](https://www.npmjs.com/package/polygon-clipping), this library preserves **outlines/paths** after clipping operations instead of returning filled polygons. This is particularly valuable for:

- **Plotter/Pen Drawing**: No multiple strokes on polygon edges - each line is drawn only once
- **SVG Generation**: Clean polylines without redundant overlapping paths
- **CAD/Technical Drawing**: Precise path-based operations for manufacturing
- **Artistic Applications**: Maintaining stroke-based artwork integrity

The `clipTo()` method returns a collection of line segments (paths) rather than solid polygon regions, making it ideal for stroke-based rendering and plotting applications.

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

### Polygon.clipLine(p1, p2, inside = true)

Clips a line segment against all rings of the polygon (multi-ring aware). Returns a new `Polygon` containing all inside (or outside) segments.

**Parameters:**
- `p1`, `p2`: Endpoints of the segment (Point)
- `inside`: If true, keeps inside segments; else, outside (default: true)

**Returns:**
- `Polygon` containing all clipped segment(s) from all rings

**Note:** This is robust for multi-ring polygons (with holes, islands, etc). For single-ring polygons, the behavior is unchanged.


## Usage Examples

### 1. ES Module Integration

```js
import Point from './src/Point.js';
import Line from './src/Line.js';
import Polygon from './src/Polygon.js';
```

### 2. OpenProcessing Integration

In OpenProcessing, go to **Sketch > Libraries > Add .js File** and paste URL:

`https://cdn.jsdelivr.net/gh/epibyte/p5-epi-shapesvg@v0.0.7/dist/p5-epi-shapesvg.js`

Then use the classes from the global object:

```js
const { Point, Line, Polygon } = EpiShapeSvg;
```

### 3. p5.js Web Editor Integration

In the p5.js Web Editor, add this line at the top of your sketch:

```js
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/gh/epibyte/p5-epi-shapesvg@v0.0.7/dist/p5-epi-shapesvg.js';
document.head.appendChild(script);

// Use after the script loads
const { Point, Line, Polygon } = EpiShapeSvg;
```

**Live Example**: [https://editor.p5js.org/epibyte/sketches/07wEBZmvE](https://editor.p5js.org/epibyte/sketches/07wEBZmvE)

### Example Code (works with all integrations)

```js
// Create triangles
const tria1 = new Polygon([new Point(10, 50), new Point(50, 10), new Point(90, 50)], true);
const tria2 = new Polygon([new Point(10, 70), new Point(50, 30), new Point(90, 70)], true);
const tria3 = new Polygon([new Point(10, 20), new Point(90, 20), new Point(50, 60)], true);

// Compute the union (outer hull) of three triangles
const unionTriangles = Polygon.outerHull(tria1, tria2, tria3);
console.log('Union as SVG:', unionTriangles.toSVG());

// Clip a set of lines against a polygon
const multipleLinesPoly = new Polygon();
for (let y = 3; y <= 100; y += 3) {
  multipleLinesPoly.addPtsArr([new Point(50, y), new Point(500, y)]);
}
const hashedLines = multipleLinesPoly.clipTo(unionTriangles);
console.log('Clipped lines as SVG:', hashedLines.toSVG());
```

## Testing

Run the comprehensive test suite to verify all functionality:

```bash
# Run all tests
node test/run-all-tests.js

# Or using npm
npm test
```

The test suite includes 62+ tests covering Point, Line, and Polygon classes with edge cases, mathematical accuracy, and geometric operations.

## Notes
- All classes are designed for use with p5.js and SVG workflows.
- `Polygon` can represent both polygons and polylines (open or closed).
- Use `clipTo()` for clipping polygons or polylines against other polygons.
- Use `merge()` and `optimize()` to combine and clean up multiple rings.
