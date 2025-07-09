import Point from './Point.js';

/**
 * Class Line: represents a line segment between two Point objects
 */
export default class Line {
  /**
   * @param {Point} pt1 - Start point
   * @param {Point} pt2 - End point
   */
  constructor(pt1, pt2) {
    if (!(pt1 instanceof Point) || !(pt2 instanceof Point)) {
      throw new Error('Line constructor expects Point instances.');
    }
    this.pt1 = pt1;
    this.pt2 = pt2;
  }

  /**
   * Returns the length of the line segment.
   * @returns {number}
   */
  length() {
    return this.pt1.distanceTo(this.pt2);
  }

  /**
   * Returns the midpoint of the line segment.
   * @returns {Point}
   */
  midPt() {
    return this.lerpPt(0.5);
  }

  /**
   * Returns a point interpolated along the line segment.
   * @param {number} f - Interpolation factor (0..1)
   * @returns {Point}
   */
  lerpPt(f) {
    return this.pt1.lerp(this.pt2, f);
  }

  /**
   * Returns a new line interpolated between this and another line.
   * @param {Line} otherLine
   * @param {number} f - Interpolation factor (0..1)
   * @returns {Line}
   */
  lerpLine(otherLine, f) {
    return new Line(
      this.pt1.lerp(otherLine.pt1, f),
      this.pt2.lerp(otherLine.pt2, f)
    );
  }

  /**
   * Returns the intersection point of this line segment with another, or null if no intersection.
   * @param {Line} otherLine
   * @returns {Point|null}
   */
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

  /**
   * Returns a string representation of the line.
   * @param {number} [prec=1] - Decimal precision
   * @returns {string}
   */
  toString(prec = 1) {
    return `Line(${this.pt1.toString(prec)} -> ${this.pt2.toString(prec)})`;
  }

  /**
   * Returns an SVG line string for the line segment.
   * @param {number} [prec=2] - Decimal precision
   * @returns {string}
   */
  toSVG(prec = 2) {
    return `<line x1="${this.pt1.x.toFixed(prec)}" y1="${this.pt1.y.toFixed(prec)}" x2="${this.pt2.x.toFixed(prec)}" y2="${this.pt2.y.toFixed(prec)}" />`;
  }

  /**
   * Draws the line using p5.js line().
   */
  drawShape() {
    line(this.pt1.x, this.pt1.y, this.pt2.x, this.pt2.y);
  }
}