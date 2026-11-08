import Point from './Point.js';
import Line from './Line.js';

// Linear distance tolerance shared by point deduplication.
const EPSILON_DIST = 1e-6;
// Squared form for comparisons against squared distances.
const EPSILON_SQ_DIST = EPSILON_DIST * EPSILON_DIST;
// Area tolerance for overlap checks (units²).
const EPSILON_AREA = 1e-9;

/**
 * Polygon: Represents one or more polylines (rings), which can be open or closed.
 * Used for polygons, polylines, and collections of lines.
 */
export default class Polygon {

  /**
   * @param {Point[]|Array<{x:number,y:number}>|Array<[number,number]>} [ptArr=[]] - Array of Point objects, {x,y} objects, or [x,y] arrays for the first ring
   * @param {boolean} [closePath=false] - Whether to close the first ring
   */
  constructor(ptArr = [], closePath = false) {
    // can be also multiple polygons
    this.pts = [];
    // Cached bounding box: { minX, minY, maxX, maxY, width, height } or null
    this.bbox = null;
    if (ptArr && ptArr.length) {
      this.addPtsArr(ptArr, closePath);
      // compute bbox after initial construction
      this.calcBBox();
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
    // Update bbox for the copy
    newPoly.calcBBox();
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
        // push a copy of the first point so the last element is not the same object
        ring.push(ring[0].copy());
      }
    }
    // Update bbox when closing path
    this.calcBBox();
    return this;
  }

  /**
   * Adds a Point to the last ring, creating a first ring when the polygon is empty.
   * @param {Point} pt
   * @returns {Polygon}
   */
  addPoint(pt) {
    pt = pt instanceof Point ? pt : new Point(pt);
    if (this.pts.length === 0) {
      this.pts.push([]);
    }
    this.pts[this.pts.length-1].push(pt);
    // update bbox
    this.calcBBox();
    return this;
  }

  /**
   * Adds an array of Points (or {x, y} objects, or [x, y] arrays) as a new ring.
   * All formats are automatically converted to Point instances.
   * @param {Array<Point|{x:number,y:number}|[number,number]>} ptsArr
   * @param {boolean} [closePath=false]
   * @returns {Polygon}
   */
  addPtsArr(ptsArr, closePath = false) {
    if (!Array.isArray(ptsArr)) {
      throw new Error('addPtsArr expects an array.');
    }
    // Convert all formats to Point instances - Point constructor handles the conversion
    const pts = ptsArr.map(pt => pt instanceof Point ? pt : new Point(pt));
    this.pts.push(pts);
    if (closePath && pts.length) {
      this.closeLastPath();
    }
    // update bbox after adding points
    this.calcBBox();
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
    center = center instanceof Point ? center : new Point(center);
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
    center = center instanceof Point ? center : new Point(center);
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
   * @param {number|null} [rotation=null] - Optional rotation (radians) applied about `center`
   * @returns {Polygon}
   */
  static createArc(center, dim, startAngle, stopAngle, rotation = null) {
    center = center instanceof Point ? center : new Point(center);
    dim = dim instanceof Point ? dim : new Point(dim);
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

      // Apply manual rotation if required (around the arc center)
      if (rotation) {
        pt = pt.rotate(rotation, center);
      }
      pts.push(pt);
    }
    
    return new Polygon(pts, false);
  }

  /**
   * Creates a rectangle positioned by the top-left corner `pos` with dimensions `dim` and optional
   * rotation applied about the rectangle center. Both `pos` and `dim` accept `Point`, `{x,y}` or `[x,y]`.
   * @param {Point|{x:number,y:number}|[number,number]} pos - top-left position
   * @param {Point|{x:number,y:number}|[number,number]} dim - width (x) and height (y)
   * @param {number} [rotation=0] - rotation in radians (applied around rectangle center)
   * @returns {Polygon}
   */
  static createRectangle(pos, dim, rotation = 0) {
    pos = pos instanceof Point ? pos : new Point(pos);
    dim = dim instanceof Point ? dim : new Point(dim);

    // Compute center for rotation
    const center = new Point(pos.x + dim.x / 2, pos.y + dim.y / 2);

    // Define corners starting from top-left, clockwise
    const pts = [
      new Point(pos.x, pos.y),
      new Point(pos.x + dim.x, pos.y),
      new Point(pos.x + dim.x, pos.y + dim.y),
      new Point(pos.x, pos.y + dim.y)
    ];

    if (rotation) {
      for (let i = 0; i < pts.length; i++) {
        pts[i] = pts[i].rotate(rotation, center);
      }
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
   * Inserts points along each polygon ring so that no segment is longer than `maxLen`.
   * Mutates the polygon in-place and returns `this`.
   * @param {number} maxLen - maximum allowed segment length (must be > 0)
   * @returns {Polygon}
   */
  densify(maxLen) {
    if (typeof maxLen !== 'number' || !(maxLen > 0)) {
      throw new Error('Polygon.densify(maxLen): maxLen must be a positive number');
    }

    const newPts = [];
    for (const ring of this.pts) {
      if (!ring || ring.length === 0) {
        newPts.push([]);
        continue;
      }

      if (ring.length < 2) {
        // nothing to subdivide
        newPts.push(ring.map(p => p.copy()));
        continue;
      }

      const closed = ring.length > 1 && ring[0].equals(ring[ring.length - 1]);
      const n = closed ? ring.length - 1 : ring.length - 1; // iterate pairs up to last

      const newRing = [];
      for (let i = 0; i < n; i++) {
        const a = ring[i];
        const b = ring[(i + 1) % ring.length];
        newRing.push(a.copy());

        const segLen = a.distanceTo(b);
        if (segLen > maxLen) {
          const numExtra = Math.ceil(segLen / maxLen) - 1;
          for (let k = 1; k <= numExtra; k++) {
            const t = k / (numExtra + 1);
            newRing.push(a.lerp(b, t));
          }
        }
      }

      // Add last point for open rings
      if (!closed) {
        newRing.push(ring[ring.length - 1].copy());
      } else {
        // close ring by repeating first point
        newRing.push(newRing[0].copy());
      }

      newPts.push(newRing);
    }

    this.pts = newPts;
    this.calcBBox();
    return this;
  }

  /**
   * Removes points in each ring that are closer together than `minLen`.
   * Ensures start and end points are preserved for open rings, and preserves closure for closed rings.
   * Mutates the polygon in-place and returns `this`.
   * @param {number} minLen - minimum allowed segment length (must be >= 0)
   * @returns {Polygon}
   */
  sparsify(minLen) {
    if (typeof minLen !== 'number' || minLen < 0) {
      throw new Error('Polygon.sparsify(minLen): minLen must be a non-negative number');
    }

    const newPts = [];

    for (const ring of this.pts) {
      if (!ring || ring.length === 0) {
        newPts.push([]);
        continue;
      }

      if (ring.length < 2) {
        newPts.push(ring.map(p => p.copy()));
        continue;
      }

      const closed = ring.length > 1 && ring[0].equals(ring[ring.length - 1]);

      if (closed) {
        // Work on base ring without duplicated closing point
        const base = ring.slice(0, ring.length - 1);
        const kept = [];
        kept.push(base[0].copy());
        let prev = base[0];
        for (let i = 1; i < base.length; i++) {
          const curr = base[i];
          if (prev.distanceTo(curr) >= minLen) {
            kept.push(curr.copy());
            prev = curr;
          }
        }

        // If too aggressive removal left <2 points, fall back to original base
        if (kept.length < 2) {
          const fallback = base.map(p => p.copy());
          if (fallback.length === 1) {
            // duplicate a second point halfway to next original point
            const next = base[1] || base[0];
            fallback.push(new Point((base[0].x + next.x) / 2, (base[0].y + next.y) / 2));
          }
          fallback.push(fallback[0].copy());
          newPts.push(fallback);
          continue;
        }

        // close ring
        kept.push(kept[0].copy());
        newPts.push(kept);
      } else {
        // open ring: always keep first and last
        const kept = [];
        kept.push(ring[0].copy());
        let prev = ring[0];
        for (let i = 1; i < ring.length - 1; i++) {
          const curr = ring[i];
          if (prev.distanceTo(curr) >= minLen) {
            kept.push(curr.copy());
            prev = curr;
          }
        }
        kept.push(ring[ring.length - 1].copy());
        newPts.push(kept);
      }
    }

    this.pts = newPts;
    this.calcBBox();
    return this;
  }

  /**
   * Slightly randomizes points in each ring by up to `deviation` units.
   * Mutates the polygon in-place and returns `this`.
   * @param {number} deviation - maximum deviation distance (>= 0)
   * @param {{preserveEndpoints?:boolean,seed?:number}} [opts={}] - options
   *    - preserveEndpoints: when true (default) keeps first and last points of open rings unchanged
   *    - seed: optional integer seed for deterministic jitter
   * @returns {Polygon}
   */
  jitter(deviation, opts = {}) {
    if (typeof deviation !== 'number' || deviation < 0) {
      throw new Error('Polygon.jitter(deviation): deviation must be a non-negative number');
    }

    const { preserveEndpoints = true, seed = null } = opts;

    // deterministic PRNG when seed provided (LCG)
    let rnd = Math.random;
    if (typeof seed === 'number') {
      let s = seed >>> 0;
      rnd = function() {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0x100000000;
      };
    }

    const newPts = [];
    for (const ring of this.pts) {
      if (!ring || ring.length === 0) {
        newPts.push([]);
        continue;
      }

      const closed = ring.length > 1 && ring[0].equals(ring[ring.length - 1]);
      const n = ring.length;
      const newRing = [];

      for (let i = 0; i < n; i++) {
        const orig = ring[i];
        const isFirst = i === 0;
        const isLast = i === n - 1;

        // preserve endpoints for open rings when requested
        const preserve = preserveEndpoints && !closed && (isFirst || isLast);

        let pt = orig.copy();
        if (!preserve && deviation > 0) {
          const theta = rnd() * Math.PI * 2;
          const r = rnd() * deviation;
          pt = new Point(pt.x + Math.cos(theta) * r, pt.y + Math.sin(theta) * r);
        }
        newRing.push(pt);
      }

      if (closed && newRing.length > 0) {
        // ensure closure by copying first to last
        newRing[newRing.length - 1] = newRing[0].copy();
      }

      newPts.push(newRing);
    }

    this.pts = newPts;
    this.calcBBox();
    return this;
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
      endShape();
    }
  }

  /**
   * (Deprecated) Clips a polyline (array of Points) against the polygon boundary. Use clipTo() instead.
   * @param {Point[]} ptsArr
   * @param {number|null} [rotation=null] - Rotation (radians) applied to the input points
   * @returns {Polygon}
   */
  clipPts(ptsArr, rotation = null) {
    const segmentPoly = new Polygon();

    // Rotate the input points once; interpolated points then live in the same space.
    const pts = ptsArr.map(p => {
      const pt = p instanceof Point ? p : new Point(p);
      return rotation ? pt.rotate(rotation) : pt;
    });

    let currentSegment = [];
    let segmentStarted = false;

    for (let i = 0; i < pts.length; i++) {
      const pt = pts[i];

      if (this.isPointIn(pt)) {
        if (!segmentStarted) {
          currentSegment = [];
          segmentStarted = true;

          // Look backwards to try to catch intersection point
          if (i > 0) {
            const qt = pts[i - 1];
            const len = Math.hypot(qt.x - pt.x, qt.y - pt.y);

            if (len > 0) {
              const df = 1 / len;

              for (let f = df; f < 1; f += df) {
                const interpPt = qt.lerp(pt, f);
                if (this.isPointIn(interpPt)) {
                  currentSegment.push(interpPt);
                  break;
                }
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
   * Inserts a point into an array if not already present (within `EPSILON_DIST`).
   * @param {Point[]} arr
   * @param {Point} newPt
   * @returns {boolean}
   */
  insertIntersectionPoint(arr, newPt) {
    for (const p of arr) {
      // Compare squared distance against a squared tolerance.
      if (p.distanceSqTo(newPt) < EPSILON_SQ_DIST) {
        return false;
      }
    }
    
    arr.push(newPt);
    return true;
  }

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
    // Update bbox after optimize
    this.calcBBox();
    return this;
  }

  /**
   * Compute signed area of a ring (array of Points). Positive for CCW.
   * @param {Point[]} ring
   * @returns {number}
   */
  signedRingArea(ring) {
    if (!ring || ring.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      area += a.x * b.y - b.x * a.y;
    }
    return area / 2;
  }

  /**
   * Returns true if this polygon and `other` have a real area overlap.
   * Touching at edges or vertices does NOT count as overlap.
   * Returns false when either polygon is empty.
   * @param {Polygon} other
   * @param {number} [epsilon=1e-9] - area tolerance (areas <= epsilon treated as zero)
   * @returns {boolean}
   */
  isOverlapping(other, epsilon = EPSILON_AREA) {
    if (!other || !(other instanceof Polygon)) return false;
    // An empty polygon has no area to overlap with anything.
    if (this.pts.length === 0 || other.pts.length === 0) return false;

    // Compute intersection regions from both sides (this clipped to other, and other clipped to this)
    const interA = this.clipTo(other, true);
    const interB = other.clipTo(this, true);

    let totalArea = 0;
    for (const ring of interA.pts) {
      if (!ring || ring.length < 3) continue;
      totalArea += Math.abs(this.signedRingArea(ring));
      if (totalArea > epsilon) return true;
    }
    for (const ring of interB.pts) {
      if (!ring || ring.length < 3) continue;
      totalArea += Math.abs(this.signedRingArea(ring));
      if (totalArea > epsilon) return true;
    }

    return false;
  }

  /**
   * Translate all points of the polygon by a vector.
   * @param {Point|{x:number,y:number}|[number,number]} vec - translation vector
   * @returns {Polygon}
   */
  translate(vec) {
    vec = vec instanceof Point ? vec : new Point(vec);
    for (const ring of this.pts) {
      for (let i = 0; i < ring.length; i++) {
        const p = ring[i];
        p.set(p.x + vec.x, p.y + vec.y);
      }
    }
    // update bbox after translation
    this.calcBBox();
    return this;
  }

  /**
   * Rotate all points of the polygon by angle (radians) around origin.
   * @param {number} angle - angle in radians
   * @param {Point|{x:number,y:number}|[number,number]|null} [origin=null] - rotation origin; defaults to (0,0)
   * @returns {Polygon}
   */
  rotate(angle, origin = null) {
    origin = origin == null ? new Point() : (origin instanceof Point ? origin : new Point(origin));
    for (let r = 0; r < this.pts.length; r++) {
      const ring = this.pts[r];
      for (let i = 0; i < ring.length; i++) {
        ring[i] = ring[i].rotate(angle, origin);
      }
    }
    // update bbox after rotation
    this.calcBBox();
    return this;
  }

  /**
   * Scale all points of the polygon around an origin.
   * Accepts a uniform scale factor (number) or a non-uniform scale as Point/{x,y}/[x,y].
   * @param {number|Point|{x:number,y:number}|[number,number]} s - scale factor or scale vector
   * @param {Point|{x:number,y:number}|[number,number]|null} [origin=null] - origin for scaling; defaults to (0,0)
   * @returns {Polygon}
   */
  scale(s, origin = null) {
    // Determine scale factors
    let sx, sy;
    if (typeof s === 'number') {
      sx = sy = s;
    } else if (s instanceof Point) {
      sx = s.x; sy = s.y;
    } else if (Array.isArray(s) && s.length >= 2) {
      sx = s[0]; sy = s[1];
    } else if (s && typeof s === 'object' && 'x' in s && 'y' in s) {
      sx = s.x; sy = s.y;
    } else {
      throw new Error('scale(): invalid scale parameter');
    }

    origin = origin == null ? new Point() : (origin instanceof Point ? origin : new Point(origin));

    // Apply scaling using Point.scale (keeps behavior consistent with Point API)
    for (let r = 0; r < this.pts.length; r++) {
      const ring = this.pts[r];
      for (let i = 0; i < ring.length; i++) {
        ring[i] = ring[i].scale(s, origin);
      }
    }

    // update bbox after scaling
    this.calcBBox();
    return this;
  }

  /**
   * Compute and store bounding box covering all rings
   * Sets `this.bbox` to an object: { minX, minY, maxX, maxY, width, height }
   * Returns the bbox object (or null if polygon has no points)
   * @returns {{minX:number,minY:number,maxX:number,maxY:number,width:number,height:number}|null}
   */
  createBBox() {
    if (!Array.isArray(this.pts) || this.pts.length === 0) {
      this.bbox = null;
      return null;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let found = false;
    for (const ring of this.pts) {
      if (!Array.isArray(ring)) continue;
      for (const p of ring) {
        if (!p) continue;
        found = true;
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
    }

    if (!found) {
      this.bbox = null;
      return null;
    }

    const bbox = {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
    // Add midpoint (center) of bbox for convenience
    bbox.midPoint = new Point((minX + maxX) / 2, (minY + maxY) / 2);

    this.bbox = bbox;
    return bbox;
  }

  /** Alias for backward compatibility */
  calcBBox() {
    return this.createBBox();
  }
  
  /**
   * Clips a line segment against all rings of the polygon (multi-ring aware, XOR logic).
   * For polygons with holes, alternates between inside/outside for each ring.
   * @param {Point} p1
   * @param {Point} p2
   * @param {boolean} [inside=true] - If true, keep inside segments; else, outside
   * @returns {Polygon}
   */
  clipLine(p1, p2, inside = true) {
    // Start with the full segment as the initial input
    let segments = [[p1, p2]];

    // For each ring, always use the 'inside' parameter (no XOR logic)
    for (let r = 0; r < this.pts.length; r++) {
      const ring = this.pts[r];
      if (!ring || ring.length < 2) {
        continue;
      }
      let newSegments = [];

      for (const [segStart, segEnd] of segments) {
        // Clip this segment against the current ring
        let intersectionPoints = [];
        const seg1 = new Line(segStart, segEnd);
        for (let i = 0; i < ring.length - 1; i++) {
          let j = (i + 1) % ring.length;
          let edgeStart = ring[i];
          let edgeEnd = ring[j];
          const seg2 = new Line(edgeStart, edgeEnd);
          let intersection = seg1.segmentIntersection(seg2);
          if (intersection) {
            this.insertIntersectionPoint(intersectionPoints, intersection);
          }
        }
        // Check if endpoints are inside the current ring
        let segStartInside = this.isPointInPtsArr(segStart, ring);
        let segEndInside = this.isPointInPtsArr(segEnd, ring);
        if (inside) {
          if (segStartInside) {
            this.insertIntersectionPoint(intersectionPoints, segStart);
          }
          if (segEndInside) {
            this.insertIntersectionPoint(intersectionPoints, segEnd);
          }
        } else {
          if (!segStartInside) {
            this.insertIntersectionPoint(intersectionPoints, segStart);
          }
          if (!segEndInside) {
            this.insertIntersectionPoint(intersectionPoints, segEnd);
          }
        }
        intersectionPoints.sort((a, b) => segStart.distanceSqTo(a) - segStart.distanceSqTo(b));
        for (let i = 0; i < intersectionPoints.length - 1; i += 2) {
          let start = intersectionPoints[i];
          let end = intersectionPoints[i + 1];
          newSegments.push([start, end]);
        }
      }
      segments = newSegments;
      if (segments.length === 0) {
        break; // No segments left to process
      }
    }

    // Collect all resulting segments into a Polygon
    const result = new Polygon();
    for (const [start, end] of segments) {
      result.addPtsArr([start, end]);
    }
    result.optimize();
    result.calcBBox();
    return result;
  }

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
    mergedPoly.calcBBox();
    return mergedPoly;
  }

  /**
   * Merges this polygon with another (concatenates rings).
   * @param {Polygon} other
   * @returns {Polygon}
   */
  merge(other, optimize = true) {
    this.pts = [...this.pts, ...other.pts];
    if (optimize) {
      this.optimize(); // Merge rings if last point of one equals first point of next
    }
    // Update bbox after merge
    this.calcBBox();
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
      union.merge(outer, false);
    }
    return union.optimize();
  }


  /**
   * Computes the straight skeleton of this polygon and returns it as a `Polygon` consisting
   * of 2-point rings where each ring represents one skeleton segment.
   *
   * WARNING: This method is experimental and not robust. It is **highly likely to be removed**
   * in a future release. Use at your own risk.
   *
   * @deprecated Experimental — may be removed in future releases.
   * @returns {Polygon}
   */
  getSkeleton() {
    // Runtime warning so callers are aware this API is unstable
    console.warn('Polygon.getSkeleton(): experimental and not robust — may be removed in a future release. Use at your own risk.');
    const skeletonPoly = new Polygon();
    if (!Array.isArray(this.pts) || this.pts.length === 0) return skeletonPoly;

    // Helper functions that use episvg Point objects
    const EPS = 1e-9;

    function computeBisector(vertex) {
      const a = vertex.prevVertex.position;
      const b = vertex.position;
      const c = vertex.nextVertex.position;

      const prevEdgeNorm = a.sub(b).normalize();
      const nextEdgeNorm = c.sub(b).normalize();

      const sum = prevEdgeNorm.add(nextEdgeNorm);
      if (sum.length() < EPS) {
        // nearly straight or reflex corner; choose a perpendicular to prevEdge
        return prevEdgeNorm.perp().normalize();
      }
      return sum.normalize();
    }

    function intersectRay(as, ad, bs, bd) {
      // Solve as + ad*u = bs + bd*v  for u,v >= 0
      const A11 = ad.x, A12 = -bd.x, A21 = ad.y, A22 = -bd.y;
      const det = A11 * A22 - A12 * A21;
      if (Math.abs(det) < EPS) return undefined;
      const rhs1 = bs.x - as.x, rhs2 = bs.y - as.y;
      const u = (rhs1 * A22 - rhs2 * A12) / det;
      const v = (A11 * rhs2 - A21 * rhs1) / det;
      if (u < 0 || v < 0) return undefined;
      return new Point(as.x + ad.x * u, as.y + ad.y * u);
    }

    function distToSegment(p, v, w) {
      const l2 = v.distanceSqTo(w);
      if (l2 === 0) return p.distanceTo(v);
      let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      const proj = new Point(v.x + (w.x - v.x) * t, v.y + (w.y - v.y) * t);
      return p.distanceTo(proj);
    }

    function findIntersection(vertex) {
      const prevISectVertex = vertex.prevVertex;
      const nextISectVertex = vertex.nextVertex;

      let intersectionPrev;
      let intersectionNext;

      const ipPrevPt = intersectRay(vertex.position, vertex.bisector, prevISectVertex.position, prevISectVertex.bisector);
      if (ipPrevPt !== undefined) {
        const intersectionPrevDistToEdge = distToSegment(ipPrevPt, vertex.position, vertex.nextVertex.position);
        intersectionPrev = { position: ipPrevPt, origins: [prevISectVertex, vertex], distanceToEdge: intersectionPrevDistToEdge };
      }

      const ipNextPt = intersectRay(vertex.position, vertex.bisector, nextISectVertex.position, nextISectVertex.bisector);
      if (ipNextPt !== undefined) {
        const intersectionNextDistToEdge = distToSegment(ipNextPt, vertex.position, vertex.nextVertex.position);
        intersectionNext = { position: ipNextPt, origins: [vertex, nextISectVertex], distanceToEdge: intersectionNextDistToEdge };
      }

      if (intersectionPrev === undefined) return intersectionNext;
      if (intersectionNext === undefined) return intersectionPrev;
      return (intersectionPrev.distanceToEdge < intersectionNext.distanceToEdge) ? intersectionPrev : intersectionNext;
    }

    for (const ring of this.pts) {
      if (!ring || ring.length < 3) continue;

      // Build vertices with linked-list style references
      const verts = ring.map(pt => ({ position: pt.copy(), active: true, bisector: undefined, prevVertex: undefined, nextVertex: undefined }));
      for (let i = 0; i < verts.length; i++) {
        const v = verts[i];
        v.prevVertex = verts[(i - 1 + verts.length) % verts.length];
        v.nextVertex = verts[(i + 1) % verts.length];
      }

      verts.forEach(v => v.bisector = computeBisector(v));

      // initialize queue of intersections
      let queue = verts.map(v => findIntersection(v)).filter(Boolean);
      queue.sort((a, b) => a.distanceToEdge - b.distanceToEdge);

      const skeletonSegments = [];

      while (queue.length > 0) {
        const intersection = queue.shift();
        const { origins } = intersection;
        const va = origins[0];
        const vb = origins[1];

        if (va.active === false && vb.active === false) continue;

        // Edge event
        if (va.prevVertex === vb.nextVertex) {
          skeletonSegments.push([va.position.copy(), intersection.position.copy()]);
          skeletonSegments.push([vb.position.copy(), intersection.position.copy()]);
          skeletonSegments.push([va.prevVertex.position.copy(), intersection.position.copy()]);

          va.active = false;
          vb.active = false;
          va.prevVertex.active = false;
          continue;
        }

        // Normal event
        skeletonSegments.push([va.position.copy(), intersection.position.copy()]);
        skeletonSegments.push([vb.position.copy(), intersection.position.copy()]);

        va.active = false;
        vb.active = false;

        // create and link new vertex
        const newVertex = { position: intersection.position.copy(), active: true, bisector: undefined, prevVertex: va.prevVertex, nextVertex: vb.nextVertex };
        newVertex.prevVertex.nextVertex = newVertex;
        newVertex.nextVertex.prevVertex = newVertex;
        newVertex.bisector = computeBisector(newVertex);

        // compute potential new intersection
        const newI = findIntersection(newVertex);
        if (newI !== undefined) {
          queue.push(newI);
          queue.sort((a, b) => a.distanceToEdge - b.distanceToEdge);
        }
      }

      // add skeleton segments as 2-point rings to skeletonPoly
      for (const [a, b] of skeletonSegments) {
        skeletonPoly.addPtsArr([a.copy(), b.copy()]);
      }
    }

    //skeletonPoly.optimize();
    skeletonPoly.calcBBox();
    return skeletonPoly;
  }
  // end getSkeleton()
  
}