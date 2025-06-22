// Class Point: represents a 2D point
export default class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static new(x = 0, y = 0) {
    return new Point(x, y);
  }
  
  distanceTo(otherPoint) {
    const dx = this.x - otherPoint.x;
    const dy = this.y - otherPoint.y;
    return Math.sqrt(dx * dx + dy * dy);
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

  rotate(angle, origin = null) {
    if (origin == null) origin = new Point();

    let dx = this.x - origin.x;
    let dy = this.y - origin.y;
    let rotatedX = origin.x + dx * Math.cos(angle) - dy * Math.sin(angle);
    let rotatedY = origin.y + dx * Math.sin(angle) + dy * Math.cos(angle);

    return new Point(rotatedX, rotatedY);
  }

  // Check if a point is (just) in area
  isOnSegmentArea(seg) {
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
}