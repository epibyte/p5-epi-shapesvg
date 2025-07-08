import Point from './Point.js';

// Class Line: uses Point objects
export default class Line {
  constructor(pt1, pt2) {
    if (!(pt1 instanceof Point) || !(pt2 instanceof Point)) {
      throw new Error('Line constructor expects Point instances.');
    }
    this.pt1 = pt1;
    this.pt2 = pt2;
  }

  length() {
    return this.pt1.distanceTo(this.pt2);
  }

  midPt() {
    return this.lerpPt(0.5);
  }
  lerpPt(f) {
    return this.pt1.lerp(this.pt2, f);
  }
  lerpLine(otherLine, f) {
    return new Line(
      this.pt1.lerp(otherLine.pt1, f),
      this.pt2.lerp(otherLine.pt2, f)
    );
  }

  // Line segment intersection algorithm
  segmentIntersection(otherLine) {
    const epsilon = 1e-6;

    let p1 = this.pt1;
    let p2 = this.pt2;
    let p3 = otherLine.pt1;
    let p4 = otherLine.pt2;

    let a1 = p2.y - p1.y;
    let b1 = p1.x - p2.x;
    let c1 = a1 * p1.x + b1 * p1.y;

    let a2 = p4.y - p3.y;
    let b2 = p3.x - p4.x;
    let c2 = a2 * p3.x + b2 * p3.y;

    let denominator = a1 * b2 - a2 * b1;

    // Handle parallel lines with epsilon tolerance
    if (Math.abs(denominator) < epsilon) {
      return null;
    }

    const intersectPt = new Point(
      (b2 * c1 - b1 * c2) / denominator,
      (a1 * c2 - a2 * c1) / denominator
    );

    // Check if the intersection point is within both segments
    if (intersectPt.isInSegmentArea(this) &&
        intersectPt.isInSegmentArea(otherLine)) {
      return intersectPt;
    }

    return null;
  }

  toString() {
    return `Line(${this.pt1.toString()} -> ${this.pt2.toString()})`;
  }

  toSVG() {
    const det = 3;
    const nf = (value, leading, digits = 0) => Number(value).toFixed(digits);
    return `<line x1="${nf(this.pt1.x, 0, det)}" y1="${nf(this.pt1.y, 0, det)}" x2="${nf(this.pt2.x, 0, det)}" y2="${nf(this.pt2.y, 0, det)}" />`;
  }

  drawShape() {
    line(this.pt1.x, this.pt1.y, this.pt2.x, this.pt2.y);
  }
}