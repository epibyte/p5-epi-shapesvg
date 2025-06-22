import Point from '../src/Point.js';
import Line from '../src/Line.js';
import Polygon from '../src/Polygon.js';

const p1 = new Point(10, 20);
const p2 = new Point(30, 40);
const l1 = new Line(p1, p2);
const l1mp = l1.midPt();
const l1vec = new Point(1, 1);
const l1tp = l1mp.translate(l1vec);

const p3 = new Point(40, 10);
const p4 = new Point(10, 50);
const l2 = new Line(p3, p4);
const intersection = l1.segmentIntersection(l2);

console.log(p1.toString());
console.log(p2.toString());
console.log(l1.toString()); // Line(Point(10, 20) -> Point(30, 40))
console.log('Length:', l1.length());
console.log('Midpoint:', l1mp.toString(), l1mp);
console.log('isOnSegmentArea():', l1mp.isOnSegmentArea(l1));
console.log('vec:', l1vec.toString());
console.log('translate():', l1tp.toString());
console.log('isOnSegmentArea():', l1tp.isOnSegmentArea(l1));
console.log('Segment Intersection:', intersection); 

const polygon = Polygon.createFromNEdges(5, 100, new Point(40, 60), Math.PI / 4);
console.log(polygon.toString());
