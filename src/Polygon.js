import Point from './Point.js';
import Line from './Line.js';

// Class Line: uses Point objects, when CLOSEd, last point has to be same as first point
export default class Polygon {
  constructor(ptArr = [], closePath = false) {
    // can be also multiple polygons
    this.pts = [];
    if (ptArr && ptArr.length) {
      this.pts.push([...ptArr]);
      if (closePath) {
        this.closeLastPath()
      }
    }
  }
  closeLastPath() {
    if (this.pts.length) {
      this.pts[this.pts.length-1].push(this.pts[this.pts.length-1][0]); // ensure first point is same as last point
    }
  }
  addPoint(pt) {
    if (!(pt instanceof Point)) { throw new Error('addPoint expects a Point instance.'); }
    this.pts[this.pts.length-1].push(pt);
  }
  addPtsArr(ptsArr, closePath = false) {
    if (!Array.isArray(ptsArr) || !ptsArr.every(pt => pt instanceof Point)) {
      // throw new Error('addPtsArr expects an array of Point instances.');
    }
    this.pts.push([...ptsArr]);
    if (closePath && ptsArr.length) {
      this.closeLastPath();
    }
  }

  static createFromNEdges(nEdges, radius = 100, center = new Point(0, 0), rotation = 0) {
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
  
  static createFromArc(center, dim, startAngle, stopAngle, rotation = null) {
  	const l = 5;
    const u = TAU*(w+h)/4;
    const num = ~~((stop - start) / 0.01);
    const dlt_angle = (stop - start) / num; // min(HALF_PI, TAU/(u/l)); //
    const pts = [];
    for (let i = 0, angle = start; i <= num; i++, angle += dlt_angle) {
      if (i === num) angle = stop;
      
      // Compute point on the unrotated ellipse
      let pt = new Point(x + (w / 2) * cos(angle), y + (h / 2) * sin(angle));

      // Apply manual rotation if required
      if (rotation) {
        pt = pt.rotate(rotation);
      }
      pts.push(pt);
    }
    
    return new Polygon(pts, true);
  }


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

  toString() {
    return `Polygon(${this.pts.map(ptArr => ptArr.map(pt => pt.toString()).join(", ")).join(" | ")})`;
    // return `Polygon(${this.pts.map(pt => pt.toString()).join(", ")})`;
  }

  toSVG(stroke = "black", fill = "none", strokeWidth = 1) {
    const det = 3
    const nf = (value, leading, digits = 0) => Number(value).toFixed(digits);
    let svgStr = "";

    for (const ring of this.pts) {
      if (ring.length === 0) continue;

      const pointsStr = ring.map(pt => `${nf(pt.x, 0, det)},${nf(pt.y, 0, det)}`).join(" ");
      svgStr += `<polyline points="${pointsStr}" stroke="${stroke}" fill="${fill}" stroke-width="${strokeWidth}" />\n`;
    }

    return svgStr;
  }

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


  // Check if point is on segment (line) between two points
  isPointOnSegment(pt, pa, pb, epsilon = 1e-9) {
    // Check if point pt is on segment pa-pb
    const cross = (pt.x - pa.x) * (pb.y - pa.y) - (pt.y - pa.y) * (pb.x - pa.x);
    if (Math.abs(cross) > epsilon) return false;

    const minX = Math.min(pa.x, pb.x), maxX = Math.max(pa.x, pb.x);
    const minY = Math.min(pa.y, pb.y), maxY = Math.max(pa.y, pb.y);

    return (pt.x >= minX - epsilon && pt.x <= maxX + epsilon &&
            pt.y >= minY - epsilon && pt.y <= maxY + epsilon);
  }

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
      if (intersection) this.insertIntersectionPoint(intersectionPoints, intersection); // intersectionPoints.push(intersection);
    }

    // Check if endpoints are inside the polygon
    let p1Inside = this.isPointInPtsArr(p1, boundaryPts); // isPointInPolygon(p1.x, p1.y, boundaryPts);
    let p2Inside = this.isPointInPtsArr(p2, boundaryPts); // isPointInPolygon(p2.x, p2.y, boundaryPts);

    // Add the endpoints if they are inside/outside the polygon
    if (inside) {	
      if (p1Inside) this.insertIntersectionPoint(intersectionPoints, p1); // intersectionPoints.push(p1);
      if (p2Inside) this.insertIntersectionPoint(intersectionPoints, p2); // intersectionPoints.push(p2);
    } else {
      if (!p1Inside) this.insertIntersectionPoint(intersectionPoints, p1); // intersectionPoints.push(p1);
      if (!p2Inside) this.insertIntersectionPoint(intersectionPoints, p2); // intersectionPoints.push(p2);
    }
    // Sort intersection points by distance from p1
    // intersectionPoints.sort((a, b) => dist(p1.x, p1.y, a.x, a.y) - dist(p1.x, p1.y, b.x, b.y));
    intersectionPoints.sort((a, b) => p1.distanceToSq(a) - p1.distanceToSq(b));
    
    const debugMode = (intersectionPoints.length % 2 === 1);
    if (debugMode) {
      console.log(`${p1.x}, ${p1.y}, ${p2.x}, ${p2.y}`);
      console.log(boundaryPts);
      console.log(intersectionPoints);
    }
    
    // Draw all valid line segments inside the polygon
    // svgStr += `<g>\n`
    const segmentPoly = new Polygon();
    for (let i = 0; i < intersectionPoints.length - 1; i += 2) {
      let start = intersectionPoints[i];
      let end = intersectionPoints[i + 1];
      console.log(`Segment: ${i}, ${start} ${end}`);
      segmentPoly.addPtsArr([start, end]);
      // const dst = dist(start.x, start.y, end.x, end.y);
      // if (debugMode) {stroke("red")} else {stroke("silver")}
      // line(start.x, start.y, end.x, end.y);
      // svgStr += `<line x1="${nf(start.x,0,3)}" y1="${nf(start.y,0,3)}" x2="${nf(end.x,0,3)}" y2="${nf(end.y,0,3)}" />\n`;
      // if (debugMode) console.log(`.. ${nf(dst, 0, 3)}: <line x1="${nf(start.x,0,3)}" y1="${nf(start.y,0,3)}" x2="${nf(end.x,0,3)}" y2="${nf(end.y,0,3)}" />\n`);
    }

    // svgStr += `</g>\n`
    return segmentPoly;
  }
  insertIntersectionPoint(arr, newPt) {
    const epsilon = 1e-6;
    
    for (const p of arr) {
      // if (dist(p.x, p.y, newPt.x, newPt.y) < epsilon) {
      if (p.distanceToSq(newPt) < epsilon) {
        return false;
      }
    }
    
    arr.push(newPt);
    return true;
  }

  // Clip another polygon against this polygon, returning the merged result
  clipPoly(otherPoly, inside = true) {
    const mergedPoly = new Polygon();

    for (const ring of otherPoly.pts) {
      if (ring.length < 2) continue;
      for (let i = 0; i < ring.length - 1; i++) {
        const p1 = ring[i];
        const p2 = ring[i + 1];
        const segmentPoly = this.clipLine(p1, p2, inside);
        for (const segRing of segmentPoly.pts) {
          if (segRing.length > 0) {
            mergedPoly.addPtsArr(segRing);
          }
        }
      }
    }
    mergedPoly.optimizePoly(); // Merge rings if last point of one equals first point of next  
    return mergedPoly;
  }
  
  // Merge rings if last point of one equals first point of next
  optimizePoly() {
    if (this.pts.length < 2) return;

    let optimized = [];
    let current = [...this.pts[0]];

    for (let i = 1; i < this.pts.length; i++) {
      const prevRing = current;
      const nextRing = this.pts[i];
      if (
        prevRing.length > 0 &&
        nextRing.length > 0 &&
        prevRing[prevRing.length - 1].equals(nextRing[0])
      ) {
        // Merge: skip duplicate point
        current = current.concat(nextRing.slice(1));
      } else {
        optimized.push(current);
        current = [...nextRing];
      }
    }
    optimized.push(current);

    this.pts = optimized;
  }

}