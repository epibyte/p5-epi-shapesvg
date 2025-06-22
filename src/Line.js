<<<<<<< HEAD
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

  toString() {
    return `Line(${this.pt1.toString()} -> ${this.pt2.toString()})`;
  }
=======
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

  toString() {
    return `Line(${this.pt1.toString()} -> ${this.pt2.toString()})`;
  }
>>>>>>> 9e5460e9f73f30f518f6642937292b69848cbcbb
}