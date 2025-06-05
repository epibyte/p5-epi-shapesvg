import Point from './src/Point.js';
import Line from './src/Line.js';

const p1 = new Point(10, 20);
const p2 = new Point(30, 40);
const line = new Line(p1, p2);

console.log(line.length());