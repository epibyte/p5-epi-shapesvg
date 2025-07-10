import Point from './Point.js';
import Line from './Line.js';

// Class Line: uses Point objects, when CLOSEd, last point has to be same as first point
/**
 * Polygon: Represents one or more polylines (rings), which can be open or closed.
 * Used for polygons, polylines, and collections of lines.
 */
export default class Polygon {
  /**
   * @param {Point[]} [ptArr=[]] - Array of Point objects for the first ring
   * @param {boolean} [closePath=false] - Whether to close the first ring
   */
  constructor(ptArr = [], closePath = false) {
    // can be also multiple polygons
    this.pts = [];
    if (ptArr && ptArr.length) {
      this.pts.push([...ptArr]);
      if (closePath) {
        this.closeLastPath();
      }
    }
  }

  /**
   * Returns a deep copy of this Polygon (all rings and Points are cloned).
   * @returns {Polygon}
   */
  copy() {
    const newPoly = new Polygon();
    for (const ring of this.pts) {
      // Deep copy each Point in the ring
      newPoly.pts.push(ring.map(pt => pt.copy()));
    }
    return newPoly;
  }

  /**
   * Closes the last ring if not already closed (last point equals first point).
   * @returns {Polygon}
   */
  closeLastPath() {
    if (this.pts.length) {
      const ring = this.pts[this.pts.length - 1];
      if (ring.length > 1 && !ring[ring.length - 1].equals(ring[0])) {
        ring.push(ring[0]);
      }
    }
    return this;
  }

  /**
   * Adds a Point to the last ring.
   * @param {Point} pt
   * @returns {Polygon}
   */
  addPoint(pt) {
    if (!(pt instanceof Point)) { throw new Error('addPoint expects a Point instance.'); }
    this.pts[this.pts.length-1].push(pt);
    return this;
  }

  /**
   * Adds an array of Points (or {x, y} objects) as a new ring.
   * Converts {x, y} objects to Point if needed.
   * @param {Array<Point|{x:number,y:number}>} ptsArr
   * @param {boolean} [closePath=false]
   * @returns {Polygon}
   */
  addPtsArr(ptsArr, closePath = false) {
    if (!Array.isArray(ptsArr)) {
      throw new Error('addPtsArr expects an array.');
    }
    // Convert {x, y} objects to Point if needed
    const pts = ptsArr.map(pt => (pt instanceof Point ? pt : new Point(pt.x, pt.y)));
    this.pts.push(pts);
    if (closePath && pts.length) {
      this.closeLastPath();
    }
    return this;
  }

  /**
   * Creates a regular polygon with n edges.
   * @param {number} nEdges
   * @param {number} [radius=100]
   * @param {Point} [center=new Point(0,0)]
   * @param {number} [rotation=0]
   * @returns {Polygon}
   */
  static createNEdge(nEdges, radius = 100, center = new Point(0, 0), rotation = 0) {
    const pts = [];
    if (nEdges < 3) {
      throw new Error('Polygon must have at least 3 edges.');
    }
    const angleStep = (Math.PI * 2) / nEdges;
    for (let i = 0; i < nEdges; i++) {
      const angle = i * angleStep + rotation;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      pts.push(new Point(x, y));
    }

    return new Polygon(pts, true);
  }

  /**
   * Creates a star-shaped polygon.
   * @param {number} nEdges
   * @param {number} [radiusOuter=100]
   * @param {number} [radiusInner=50]
   * @param {Point} [center=new Point(0,0)]
   * @param {number} [rotation=0]
   * @returns {Polygon}
   */
  static createStar(nEdges, radiusOuter = 100, radiusInner = 50, center = new Point(0, 0), rotation = 0) {
    const pts = [];
    if (nEdges < 3) {
      throw new Error('Polygon must have at least 3 edges.');
    }
    const angleStep = (Math.PI * 2) / nEdges / 2;
    const radii = [radiusOuter, radiusInner];
    for (let i = 0; i < nEdges * 2; i++) {
      const angle = i * angleStep + rotation;
      const radius = radii[i % 2];
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      pts.push(new Point(x, y));
    }

    return new Polygon(pts, true);
  }
  
  /**
   * Creates an arc or ellipse segment as a polygon.
   * @param {Point} center - Center of the arc
   * @param {Point} dim - Width (x) and height (y) of the ellipse
   * @param {number} startAngle - Start angle (radians)
   * @param {number} stopAngle - Stop angle (radians)
   * @param {number|null} [rotation=null] - Optional rotation (radians)
   * @returns {Polygon}
   */
  static createArc(center, dim, startAngle, stopAngle, rotation = null) {
    const len = 4;
    const cir = 2 * Math.PI * (dim.x + dim.y) / 2; // approximation
    const num = Math.max(3, ~~(cir / len * (stopAngle - startAngle) / (2 * Math.PI)));
    const dlt_angle = (stopAngle - startAngle) / num; // min(HALF_PI, TAU/(u/l)); //
    const pts = [];
    for (let i = 0, angle = startAngle; i <= num; i++, angle += dlt_angle) {
      if (i === num) angle = stopAngle;

      // Compute point on the unrotated ellipse
      let pt = new Point(
        center.x + (dim.x / 2) * Math.cos(angle),
        center.y + (dim.y / 2) * Math.sin(angle)
      );

      // Apply manual rotation if required
      if (rotation) {
        pt = pt.rotate(rotation);
      }
      pts.push(pt);
    }
    
    return new Polygon(pts, true);
  }

  /**
   * Returns the total length of all rings in the polygon.
   * @returns {number}
   */
  length() {
    let totalLength = 0;
    for (let i = 0; i < this.pts.length; i++) {
      const ptArr = this.pts[i];
      if (ptArr.length < 2) continue; // skip if not enough points
      for (let j = 0; j < ptArr.length - 1; j++) {
        const pt1 = ptArr[j];
        const pt2 = ptArr[j + 1]; // ptArr[(j + 1) % ptArr.length]; // wrap around to first point
        totalLength += pt1.distanceTo(pt2);
      }
    }
    return totalLength;
  }   

  /**
   * Returns a string representation of the polygon.
   * @param {number} [prec=1] - Decimal precision
   * @returns {string}
   */
  toString(prec = 1) {
    return `Polygon(${this.pts.map(ptArr => ptArr.map(pt => pt.toString(prec)).join(", ")).join(" | ")})`;
  }

  /**
   * Returns an SVG polyline string for all rings.
   * @param {number} [prec=1] - Decimal precision
   * @returns {string}
   */
  toSVG(prec = 2) { // stroke = "black", fill = "none", strokeWidth = 1
    let svgStr = "";
    for (const ring of this.pts) {
      if (ring.length === 0) continue;
      const pointsStr = ring.map(pt => `${pt.x.toFixed(prec)},${pt.y.toFixed(prec)}`).join(" ");
      svgStr += `<polyline points="${pointsStr}" />\n`; // stroke="${stroke}" fill="${fill}" stroke-width="${strokeWidth}"
    }

    return svgStr;
  }

  /**
   * Draws the polygon using p5.js beginShape()/vertex()/endShape().
   */
  drawShape() {
    for (const ring of this.pts) {
      if (ring.length === 0) continue;

      beginShape();
      for (const pt of ring) {
        vertex(pt.x, pt.y);
      }
      endShape(CLOSE);
    }
  }

  // Clip points against the polygon boundary
  // deprecated: use clipTo() instead
  /**
   * (Deprecated) Clips a polyline (array of Points) against the polygon boundary.
   * @param {Point[]} ptsArr
   * @param {number|null} [rotation=null]
   * @returns {Polygon}
   */
  clipPts(ptsArr, rotation = null) {
    const segmentPoly = new Polygon();
    let currentSegment = [];
    let segmentStarted = false;

    for (let i = 0; i < ptsArr.length; i++) {
      let pt = ptsArr[i];

      // Apply rotation if required
      if (rotation) {
        pt = pt.rotate(rotation);
      }

      if (this.isPointIn(pt)) {
        if (!segmentStarted) {
          currentSegment = [];
          segmentStarted = true;

          // Look backwards to try to catch intersection point
          if (i > 0) {
            let qt = ptsArr[i - 1];
            if (rotation) qt = qt.rotate(rotation);

            const len = Math.hypot(qt.x - pt.x, qt.y - pt.y);
            const df = 1 / len;

            for (let f = df; f < 1; f += df) {
              let interpPt = qt.lerp(pt, f);
              if (rotation) interpPt = interpPt.rotate(rotation);

              if (this.isPointIn(interpPt)) {
                currentSegment.push(interpPt);
                break;
              }
            }
          }
        }

        currentSegment.push(pt);

      } else {
        if (segmentStarted) {
          segmentPoly.addPtsArr(currentSegment);
          currentSegment = [];
          segmentStarted = false;
        }
      }
    }

    // Finish any open segment
    if (segmentStarted) {
      console.log("Adding final segment:", currentSegment);
      segmentPoly.addPtsArr(currentSegment);
    }

    return segmentPoly;
  }

  /**
   * Checks if a point is on the segment between two points.
   * @param {Point} pt
   * @param {Point} pa
   * @param {Point} pb
   * @param {number} [epsilon=1e-9]
   * @returns {boolean}
   */
  isPointOnSegment(pt, pa, pb, epsilon = 1e-9) {
    // Check if point pt is on segment pa-pb
    const cross = (pt.x - pa.x) * (pb.y - pa.y) - (pt.y - pa.y) * (pb.x - pa.x);
    if (Math.abs(cross) > epsilon) return false;

    const minX = Math.min(pa.x, pb.x), maxX = Math.max(pa.x, pb.x);
    const minY = Math.min(pa.y, pb.y), maxY = Math.max(pa.y, pb.y);

    return (pt.x >= minX - epsilon && pt.x <= maxX + epsilon &&
            pt.y >= minY - epsilon && pt.y <= maxY + epsilon);
  }

  /**
   * Checks if a point is inside a ring (array of Points) using ray casting.
   * @param {Point} pt
   * @param {Point[]} ptsArr
   * @returns {boolean}
   */
  isPointInPtsArr(pt, ptsArr) {
    let isInside = false;

    for (let i = 0, j = ptsArr.length - 1; i < ptsArr.length; j = i++) {
      const pa = ptsArr[i];
      const pb = ptsArr[j];

      // Check if point is on edge
      if (this.isPointOnSegment(pt, pa, pb)) {
        return true;
      }

      // Ray casting
      const intersect = ((pa.y > pt.y) !== (pb.y > pt.y)) &&
        (pt.x < (pb.x - pa.x) * (pt.y - pa.y) / ((pb.y - pa.y) || 1e-12) + pa.x);
      if (intersect) isInside = !isInside;
    }

    return isInside;
  }


  // calls isPointInPolygon() for each polygon and inverts result (XOR/DIFFERENCE)
  /**
   * Checks if a point is inside the polygon (handles multiple rings, XOR logic).
   * @param {Point} pt
   * @returns {boolean}
   */
  isPointIn(pt) {
    let isInside = false;

    if (Array.isArray(this.pts)) {
      for (const ptsArr of this.pts) {
        if (this.isPointInPtsArr(pt, ptsArr)) isInside = !isInside;
      }
    } else {
      throw new Error('Polygon.isPointIn(): this.pts has to be an array');
      // return this.isPointInPolygon(pt, this.pts);
    }
    
    return isInside;
  }

  /**
   * Clips a line segment against the polygon boundary (first ring).
   * @param {Point} p1
   * @param {Point} p2
   * @param {boolean} [inside=true] - If true, keep inside segments; else, outside
   * @returns {Polygon}
   */
  clipLine(p1, p2, inside = true) {
    let intersectionPoints = [];

    // Check intersections with all polygon edges
    const boundaryPts = this.pts[0]; // Assuming the first ring is the boundary
    const seg1 = new Line(p1, p2);
    for (let i = 0; i < boundaryPts.length - 1; i++) {
      let j = (i + 1) % boundaryPts.length;  // next vertex, wrapping around
      let edgeStart = boundaryPts[i];
      let edgeEnd = boundaryPts[j];
      const seg2 = new Line(edgeStart, edgeEnd);
      let intersection = seg1.segmentIntersection(seg2);
      if (intersection) this.insertIntersectionPoint(intersectionPoints, intersection);
    }

    // Check if endpoints are inside the polygon
    let p1Inside = this.isPointInPtsArr(p1, boundaryPts);
    let p2Inside = this.isPointInPtsArr(p2, boundaryPts);

    // Add the endpoints if they are inside/outside the polygon
    if (inside) {	
      if (p1Inside) this.insertIntersectionPoint(intersectionPoints, p1);
      if (p2Inside) this.insertIntersectionPoint(intersectionPoints, p2);
    } else {
      if (!p1Inside) this.insertIntersectionPoint(intersectionPoints, p1);
      if (!p2Inside) this.insertIntersectionPoint(intersectionPoints, p2);
    }
    // Sort intersection points by distance from p1
    intersectionPoints.sort((a, b) => p1.distanceSqTo(a) - p1.distanceSqTo(b));

    // ToDo: check issue, but only in debug mode
    const debugMode = (intersectionPoints.length % 2 === 1) && false;
    if (debugMode) { 
      console.log("Debug Mode: Odd number of intersection points detected."); 
      console.log(`${p1.x}, ${p1.y}, ${p2.x}, ${p2.y}`);
      console.log(boundaryPts);
      console.log(intersectionPoints);
    }
    
    // Collect segments from intersection points
    const segmentPoly = new Polygon();
    for (let i = 0; i < intersectionPoints.length - 1; i += 2) {
      let start = intersectionPoints[i];
      let end = intersectionPoints[i + 1];
      segmentPoly.addPtsArr([start, end]);
    }

    return segmentPoly;
  }
  /**
   * Inserts a point into an array if not already present (within epsilon).
   * @param {Point[]} arr
   * @param {Point} newPt
   * @returns {boolean}
   */
  insertIntersectionPoint(arr, newPt) {
    const epsilon = 1e-6;
    
    for (const p of arr) {
      // if (dist(p.x, p.y, newPt.x, newPt.y) < epsilon) {
      if (p.distanceSqTo(newPt) < epsilon) {
        return false;
      }
    }
    
    arr.push(newPt);
    return true;
  }

  // Merge rings if last point of one equals first point of next
  /**
   * Merges rings if last point of one equals first point of next (within epsilon).
   * @param {number} [epsilon=1e-6]
   * @returns {Polygon}
   */
  optimize(epsilon = 1e-6) {
    let rings = this.pts.map(r => [...r]);
    let merged = [];
    let used = new Array(rings.length).fill(false);
  
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < rings.length; i++) {
        if (used[i] || rings[i].length === 0) continue;
        for (let j = 0; j < rings.length; j++) {
          if (i === j || used[j] || rings[j].length === 0) continue;
  
          if (rings[i][rings[i].length - 1].equals(rings[j][0], epsilon)) {
            rings[i] = rings[i].concat(rings[j].slice(1));
            used[j] = true;
            changed = true;
            break;
          }
          if (rings[j][rings[j].length - 1].equals(rings[i][0], epsilon)) {
            rings[j] = rings[j].concat(rings[i].slice(1));
            used[i] = true;
            changed = true;
            break;
          }
        }
      }
    }
  
    for (let i = 0; i < rings.length; i++) {
      if (!used[i] && rings[i].length > 0) {
        merged.push(rings[i]);
      }
    }
  
    this.pts = merged;
    return this;
  }
  
  // Clip this polygon against another polygon, returning the merged result
  /**
   * Clips this polygon against another polygon, returning the merged result.
   * If otherPoly is null/empty, returns a copy of this polygon.
   * @param {Polygon} otherPoly
   * @param {boolean} [inside=true] - If true, keep inside segments; else, outside
   * @returns {Polygon}
   */
  clipTo(otherPoly, inside = true) {
    // If otherPoly is null/undefined or has no rings, return a copy of this polygon
    if (!otherPoly || !Array.isArray(otherPoly.pts) || otherPoly.pts.length === 0) {
      return this.copy();
    }

    const mergedPoly = new Polygon();
    for (const ring of this.pts) {
      if (ring.length < 2) continue;
      for (let i = 0; i < ring.length - 1; i++) {
        const p1 = ring[i];
        const p2 = ring[i + 1];
        const segmentPoly = otherPoly.clipLine(p1, p2, inside);
        for (const segRing of segmentPoly.pts) {
          if (segRing.length > 0) {
            mergedPoly.addPtsArr(segRing);
          }
        }
      }
    }
    mergedPoly.optimize(); // Merge rings if last point of one equals first point of next  
    return mergedPoly;
  }

  // Merge this polygon with another, 
  /**
   * Merges this polygon with another (concatenates rings).
   * @param {Polygon} other
   * @returns {Polygon}
   */
  merge(other) {
    this.pts = [...this.pts, ...other.pts];
    this.optimize(); // Merge rings if last point of one equals first point of next
    return this;
  }
  
  /**
   * Returns the outer hull (union) of multiple polygons using repeated clipTo(..., false).
   * Skips arguments that are not Polygon instances or have no rings/points.
   * @param {...Polygon} polys - Any number of Polygon instances.
   * @returns {Polygon} - The union polygon.
   */
  static outerHull(...polys) {
    // Filter out invalid arguments
    const validPolys = polys.filter(
      poly => poly instanceof Polygon && Array.isArray(poly.pts) && poly.pts.length > 0 && poly.pts.some(ring => Array.isArray(ring) && ring.length > 0)
    );
    if (validPolys.length === 0) return new Polygon();

    const outers = validPolys.map((poly, i) => {
      let result = poly;
      for (let j = 0; j < validPolys.length; j++) {
        if (i !== j) {
          result = result.clipTo(validPolys[j], false);
        }
      }
      return result;
    });

    // Merge all outer segments and optimize
    let union = new Polygon();
    for (const outer of outers) {
      union.merge(outer);
    }
    return union.optimize();
  }
}