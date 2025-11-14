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
Represents a 2D point with x and y coordinates. The constructor accepts multiple formats:
- `new Point(x, y)` - Standard x, y coordinates
- `new Point({x, y})` - Object with x and y properties
- `new Point([x, y])` - Array with x and y values

- Methods: `copy()`, `set(x, y)`, `equals(otherPoint, epsilon)`, `distanceTo(otherPoint)`, `lerp(otherPoint, f)`, `translate(vec)`

### Line
Represents a line segment between two `Point` objects.
- Methods: `length()`, `midPt()`, `lerpPt(f)`, `lerpLine(otherLine, f)`, `segmentIntersection(otherLine)`


### Polygon
Represents one or more polylines (rings), which can be open or closed. Used for polygons, polylines, and collections of lines.

**Instance Methods:**
- `addPoint(pt)` — add a point to the last ring
- `addPtsArr(ptsArr, closePath)` — add an array of points as a new ring
- `closeLastPath()` — close the last ring if open
- `copy()` — create a deep copy of the polygon
- `merge(other, optimize)` — merge another polygon's rings
- `optimize(epsilon)` — merge adjacent rings (last point of one equals first point of next)
- `clipTo(otherPoly, inside)` — clip this polygon against another (inside or outside)
- `clipLine(p1, p2, inside)` — clip a line segment against the polygon
- `isPointIn(pt)` — test if a point is inside the polygon
- `isOverlapping(other, epsilon)` — test if this polygon has a real area overlap with another (edge/vertex touching does NOT count as overlap)
- `length()` — compute total length of all rings
- `toSVG(prec)` — get SVG polyline string representation
- `toString(prec)` — get string representation
- `drawShape()` — draw using p5.js (requires p5.js in scope)
 - `translate(vec)` — translate the entire polygon by `vec` (`Point`, `{x,y}` or `[x,y]`)
 - `rotate(angle, origin)` — rotate the entire polygon by `angle` (radians) around `origin` (defaults to `(0,0)`)
 - `calcBBox()` — compute and cache polygon bounding box in `polygon.bbox` as `{minX,minY,maxX,maxY,width,height}`; called automatically when polygon is created or mutated

**Static Methods:**
- `Polygon.createNEdges(nEdges, radius, center, rotation)` — create a regular polygon. `center` can be a `Point`, `{x, y}` object, or `[x, y]` array.
- `Polygon.createStar(nEdges, radiusOuter, radiusInner, center, rotation)` — create a star shape. `center` can be a `Point`, `{x, y}` object, or `[x, y]` array.
- `Polygon.createArc(center, dim, startAngle, stopAngle, rotation)` — create an arc/ellipse segment. Both `center` and `dim` can be a `Point`, `{x, y}` object, or `[x, y]` array. Returns an open path by default.
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
// Create triangles - showing different Point constructor formats
const tria1 = new Polygon([new Point(10, 50), new Point(50, 10), new Point(90, 50)], true);
const tria2 = new Polygon([new Point({x: 10, y: 70}), new Point({x: 50, y: 30}), new Point({x: 90, y: 70})], true);
const tria3 = new Polygon([new Point([10, 20]), new Point([90, 20]), new Point([50, 60])], true);

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

The test suite includes 67 tests covering Point, Line, and Polygon classes with edge cases, mathematical accuracy, and geometric operations.

## Notes
- All classes are designed for use with p5.js and SVG workflows.
- `Polygon` can represent both polygons and polylines (open or closed).
- Use `clipTo()` for clipping polygons or polylines against other polygons.
- Use `merge()` and `optimize()` to combine and clean up multiple rings.
