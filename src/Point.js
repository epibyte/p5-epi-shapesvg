<<<<<<< HEAD
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

  rotate(angle, origin = null) {
    if (origin == null) origin = new Point();

    let dx = pt.x - origin.x;
		let dy = pt.y - origin.y;
		let rotatedX = origin.x + dx * cos(angle) - dy * sin(angle);
		let rotatedY = origin.y + dx * sin(angle) + dy * cos(angle);
		
    return new Point(rotatedX, rotatedY);
  }

  toString() {
    return `Point(${this.x}, ${this.y})`;
  }
=======
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

  rotate(angle, origin = null) {
    if (origin == null) origin = new Point();

    let dx = pt.x - origin.x;
		let dy = pt.y - origin.y;
		let rotatedX = origin.x + dx * cos(angle) - dy * sin(angle);
		let rotatedY = origin.y + dx * sin(angle) + dy * cos(angle);
		
    return new Point(rotatedX, rotatedY);
  }

  toString() {
    return `Point(${this.x}, ${this.y})`;
  }
>>>>>>> 9e5460e9f73f30f518f6642937292b69848cbcbb
}