// Class Point: represents a 2D point
export default class Point {
  constructor(x = 0, y = 0) {
    this.set(x, y);
  }

  copy() {
    return new Point(this.x, this.y);
  }
  
  set(x, y) {
    this.x = x;
    this.y = y;
  }
  
  equals(otherPoint, epsilon = 1e-6) {
    return Math.abs(this.x - otherPoint.x) < epsilon && Math.abs(this.y - otherPoint.y) < epsilon;
  }

  distanceToSq(otherPoint) {
    const dx = this.x - otherPoint.x;
    const dy = this.y - otherPoint.y;
    return dx * dx + dy * dy;
  }
  distanceTo(otherPoint) {
    return Math.sqrt(this.distanceToSq(otherPoint));
  }

  lerp(otherPoint, f) {
    return new Point(
      this.x + (otherPoint.x - this.x) * f,
      this.y + (otherPoint.y - this.y) * f
    );
  }

  translate(vec) {
    return new Point(this.x + vec.x, this.y + vec.y);
  }

  scale(scl) {
	  return new Point(this.x * scl, this.y * scl);
  }

  rotate(angle, origin = null) {
    if (origin == null) origin = new Point();

    let dx = this.x - origin.x;
    let dy = this.y - origin.y;
    let rotatedX = origin.x + dx * Math.cos(angle) - dy * Math.sin(angle);
    let rotatedY = origin.y + dx * Math.sin(angle) + dy * Math.cos(angle);

    return new Point(rotatedX, rotatedY);
  }

  // Check if a point is (just) in area
  isInSegmentArea(seg) {
    const epsilon = 1e-6; // small tolerance for floating-point errors
    const p1 = seg.pt1;
    const p2 = seg.pt2;
    return (
      this.x >= Math.min(p1.x, p2.x) - epsilon &&
      this.x <= Math.max(p1.x, p2.x) + epsilon &&
      this.y >= Math.min(p1.y, p2.y) - epsilon &&
      this.y <= Math.max(p1.y, p2.y) + epsilon
    );
  }

  toString() {
    return `Point(${this.x}, ${this.y})`;
  }

  toSVG() {
    const det = 3;
    const nf = (value, leading, digits = 0) => Number(value).toFixed(digits);
    return `<circle cx="${nf(this.x, 0, det)}" cy="${nf(this.y, 0, det)}" r="2" />`;
  }

  drawShape() {
    ellipse(this.x, this.y, 5, 5);
  }
}