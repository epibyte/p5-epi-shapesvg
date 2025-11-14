// Class Point: represents a 2D point
/**
 * Class Point: represents a 2D point
 */
export default class Point {
  /**
   * @param {number|{x:number,y:number}|[number,number]} [x=0] - X coordinate, {x,y} object, or [x,y] array
   * @param {number} [y=0] - Y coordinate (ignored if first parameter is object or array)
   */
  constructor(x = 0, y = 0) {
    // Handle different input formats
    if (Array.isArray(x) && x.length >= 2) {
      // [x, y] array format
      this.set(x[0], x[1]);
    } else if (x && typeof x === 'object' && 'x' in x && 'y' in x) {
      // {x, y} object format
      this.set(x.x, x.y);
    } else {
      // Standard x, y parameters
      this.set(x, y);
    }
  }

  /**
   * Returns a copy of this point.
   * @returns {Point}
   */
  copy() {
    return new Point(this.x, this.y);
  }
  
  /**
   * Sets the x and y coordinates of the point.
   * @param {number} x
   * @param {number} y
   * @returns {Point}
   */
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }
  
  /**
   * Checks if this point equals another point within a given epsilon.
   * @param {Point} otherPoint
   * @param {number} [epsilon=1e-6]
   * @returns {boolean}
   */
  equals(otherPoint, epsilon = 1e-6) {
    return Math.abs(this.x - otherPoint.x) < epsilon && Math.abs(this.y - otherPoint.y) < epsilon;
  }

  /**
   * Returns the squared distance to another point.
   * @param {Point} otherPoint
   * @returns {number}
   */
  distanceSqTo(otherPoint) {
    const dx = this.x - otherPoint.x;
    const dy = this.y - otherPoint.y;
    return dx * dx + dy * dy;
  }
  /**
   * Returns the distance to another point.
   * @param {Point} otherPoint
   * @returns {number}
   */
  distanceTo(otherPoint) {
    return Math.sqrt(this.distanceSqTo(otherPoint));
  }

  /**
   * Returns a new point linearly interpolated between this and another point.
   * @param {Point} otherPoint
   * @param {number} f - Interpolation factor (0..1)
   * @returns {Point}
   */
  lerp(otherPoint, f) {
    return new Point(
      this.x + (otherPoint.x - this.x) * f,
      this.y + (otherPoint.y - this.y) * f
    );
  }

  /**
   * Returns a new point translated by a vector.
   * @param {Point} vec
   * @returns {Point}
   */
  translate(vec) {
    return new Point(this.x + vec.x, this.y + vec.y);
  }

  /**
   * Returns a new point scaled by a factor.
   * Supports uniform scale (number) or non-uniform scale as Point/{x,y}/[x,y].
   * Optional `origin` specifies the point to scale around (default (0,0)).
   * @param {number|Point|{x:number,y:number}|[number,number]} scl
   * @param {Point|{x:number,y:number}|[number,number]|null} [origin=null]
   * @returns {Point}
   */
  scale(scl, origin = null) {
    let sx, sy;
    if (typeof scl === 'number') {
      sx = sy = scl;
    } else if (scl instanceof Point) {
      sx = scl.x; sy = scl.y;
    } else if (Array.isArray(scl) && scl.length >= 2) {
      sx = scl[0]; sy = scl[1];
    } else if (scl && typeof scl === 'object' && 'x' in scl && 'y' in scl) {
      sx = scl.x; sy = scl.y;
    } else {
      throw new Error('Point.scale(): invalid scale parameter');
    }

    if (origin == null) origin = new Point();
    else origin = origin instanceof Point ? origin : new Point(origin);

    const nx = origin.x + (this.x - origin.x) * sx;
    const ny = origin.y + (this.y - origin.y) * sy;
    return new Point(nx, ny);
  }

  /**
   * Returns a new point rotated by angle (radians) around an origin.
   * @param {number} angle - Angle in radians
   * @param {Point|null} [origin=null] - Origin point (default: (0,0))
   * @returns {Point}
   */
  rotate(angle, origin = null) {
    if (origin == null) origin = new Point();

    let dx = this.x - origin.x;
    let dy = this.y - origin.y;
    let rotatedX = origin.x + dx * Math.cos(angle) - dy * Math.sin(angle);
    let rotatedY = origin.y + dx * Math.sin(angle) + dy * Math.cos(angle);

    return new Point(rotatedX, rotatedY);
  }

  // Check if a point is (just) in area
  /**
   * Checks if this point is within the bounding box of a segment.
   * @param {Line} seg
   * @returns {boolean}
   */
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

  /**
   * Returns a string representation of the point.
   * @param {number} [prec=1] - Decimal precision
   * @returns {string}
   */
  toString(prec = 1) {
    return `Point(${this.x.toFixed(prec)}, ${this.y.toFixed(prec)})`;
  }

  /**
   * Returns an SVG circle string for the point.
   * @param {number} [prec=1] - Decimal precision
   * @returns {string}
   */
  toSVG(prec = 2) {
    return `<circle cx="${this.x.toFixed(prec)}" cy="${this.y.toFixed(prec)}" r="2" />`;
  }

  /**
   * Draws the point using p5.js ellipse().
   */
  drawShape() {
    ellipse(this.x, this.y, 5, 5);
  }
}