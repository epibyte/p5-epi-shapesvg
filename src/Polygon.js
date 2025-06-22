import Point from './Point.js';

// Class Line: uses Point objects
export default class Polygon {
  constructor(ptArr) {
    // can be also multiple polygons
    this.pts = [...ptArr];
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
    return new Polygon([pts]);
  }

  addPoint(pt) {
    if (!(pt instanceof Point)) { throw new Error('addPoint expects a Point instance.'); }
    this.pts[this.pts.length-1].push(pt);
  }

  length() {
    let totalLength = 0;
    for (let i = 0; i < this.pts.length; i++) {
      const ptArr = this.pts[i];
      if (ptArr.length < 2) continue; // skip if not enough points
      for (let j = 0; j < ptArr.length; j++) {
        const pt1 = ptArr[j];
        const pt2 = ptArr[(j + 1) % ptArr.length]; // wrap around to first point
        totalLength += pt1.distanceTo(pt2);
      }
    }
    return totalLength;
  }   

  toString() {
    return `Polygon(${this.pts.map(ptArr => ptArr.map(pt => pt.toString()).join(", ")).join(" | ")})`;
  }
}