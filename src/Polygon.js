import Point from './Point.js';

// Class Line: uses Point objects, when CLOSEd, last point has to be same as first point
export default class Polygon {
  constructor(ptArr = [], closePath = false) {
    // can be also multiple polygons
    this.pts = [[...ptArr]];
    if (closePath && ptArr.length) {
      this.pts[0].push(this.pts[0][0]); // ensure first point is same as last point
    }
    console.log(this.pts);
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

  addPoint(pt) {
    if (!(pt instanceof Point)) { throw new Error('addPoint expects a Point instance.'); }
    this.pts[this.pts.length-1].push(pt);
  }
  addPtsArr(ptsArr) {
    if (!Array.isArray(ptsArr) || !ptsArr.every(pt => pt instanceof Point)) {
      // throw new Error('addPtsArr expects an array of Point instances.');
    }
    this.pts.push([...ptsArr]);
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

  // Clip points array against a polygon (multiPoly) and return SVG string
  ___clipPts(ptsArr, rotation = null) {
    let segmentStarted = false;
    
    for (let i = 0; i < ptsArr.length; i++) {
      const pt = ptsArr[i];
      // let px = pt.x;
      // let py = pt.y;
      
      // Apply manual rotation if required
      if (rotation) {
        // const rotPt = getRotatedPt(pt, rotation);
        // px = rotPt.x;
        // py = rotPt.y;
        pt = pt.rotate(rotation);
      }
      
      // Check if the point is inside the polygon boundary
      if (this.isPointIn(pt)) {
        if (!segmentStarted) {
          beginShape();
          svgStr += `<polyline points="`;
          segmentStarted = true;
          if (i > 0) {
            const qt = ptsArr[i-1];
            const len = dist(qt.x, qt.y, pt.x, pt.y);
            const df = 1/len;
            for (let f = df; f < 1; f += df) {
              // let qx = lerp(qt.x, pt.x, f);
              // let qy = lerp(qt.y, pt.y, f);
              qt = qt.lerp(pt, f);
              if (rotation) {
                // const rotPt = getRotatedPt({x: qx, y: qy}, rotation);
                // qx = rotPt.x;
                // qy = rotPt.y;
                qt = qt.rotate(rotation);
              }
              if (this.isPointIn(qt)) {
                vertex(qt.x, qt.y);
                svgStr += `${nf(qt.x,0,3)},${nf(qt.y,0,3)} `;
                break;
              }
            }
          }
        }
        vertex(pt.x, pt.y);
        svgStr += `${nf(pt.x,0,3)},${nf(pt.y,0,3)} `;

      } else {

        if (segmentStarted) {
          endShape();
          svgStr += `" />\n`;
          segmentStarted = false;
        }
      }

    } // for pts
    
    if (segmentStarted) {
      endShape();
      svgStr += `" />\n`;
    }
  }

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
}