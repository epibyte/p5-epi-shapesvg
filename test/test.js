import Point from '../src/Point.js';
import Line from '../src/Line.js';

const p1 = new Point(10, 20);
const p2 = new Point(30, 40);
const l1 = new Line(p1, p2);

console.log(p1.toString());
console.log(p2.toString());
console.log(l1.toString()); // Line(Point(10, 20) -> Point(30, 40))
console.log('Length:', l1.length());
console.log('Midpoint:', l1.midPt().toString());
