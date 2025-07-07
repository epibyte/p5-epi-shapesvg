// v0.1 getRotatedPt(pt, rotation) 



function getRotatedPt(pt, rotation) { // older versions have getRotatedPt(px, py, rotation) 
	// Apply manual rotation if required
	if (rotation) {
		const rotationPoint = rotation.point; // rotation?.point || { x: 0, y: 0 };
		const rotationAngle = rotation.angle; // rotation?.angle || 0;
		let dx = pt.x - rotationPoint.x;
		let dy = pt.y - rotationPoint.y;
		let rotatedX = rotationPoint.x + dx * cos(rotationAngle) - dy * sin(rotationAngle);
		let rotatedY = rotationPoint.y + dx * sin(rotationAngle) + dy * cos(rotationAngle);
		return {x: rotatedX, y: rotatedY}
	}
	return {x: pt.x, y: pt.y}
}
function getScaledPt(pt, scl) {
	return {x: pt.x * scl, y: pt.y * scl};
}
function getTransitionPt(pt, tr) {
	return {x: pt.x + tr.x, y: pt.y + tr.y};
}
function getRotatedPoly(poly, rotation) {
	return poly.map((e) => getRotatedPt(e, rotation));
}
function getScaledPoly(poly, scl) {
	return poly.map((e) => getScaledPt(e, scl));
}
function getTransitionPoly(poly, tr) {
	return poly.map((e) => getTransitionPt(e, tr));
}


// clipPts(ptArr, boundaryPoints)
function clipPts(ptsArr, boundaryPoints, rotation = null) {
	let segmentStarted = false;
	
	for (let i = 0; i < ptsArr.length; i++) {
		const pt = ptsArr[i];
		let px = pt.x;
		let py = pt.y;
		
		// Apply manual rotation if required
    if (rotation) {
			const rotPt = getRotatedPt(pt, rotation);
      px = rotPt.x;
      py = rotPt.y;
    }
		
	 	// Check if the point is inside the polygon boundary
    if (isPointInPolygon(px, py, boundaryPoints)) {
      if (!segmentStarted) {
        beginShape();
				svgStr += `<polyline points="`;
        segmentStarted = true;
				if (i > 0) {
					const qt = ptsArr[i-1];
					const len = dist(qt.x, qt.y, pt.x, pt.y);
					const df = 1/len;
					for (let f = df; f < 1; f += df) {
						let qx = lerp(qt.x, pt.x, f);
						let qy = lerp(qt.y, pt.y, f);
						if (rotation) {
							const rotPt = getRotatedPt({x: qx, y: qy}, rotation);
							qx = rotPt.x;
							qy = rotPt.y;
						}
						if (isPointInPolygon(qx, qy, boundaryPoints)) {
							vertex(qx, qy);
							svgStr += `${nf(qx,0,3)},${nf(qy,0,3)} `;
							break;
						}
					}
				}
      }
      vertex(px, py);
			svgStr += `${nf(px,0,3)},${nf(py,0,3)} `;
    } else {
      if (segmentStarted) {
        endShape();
				svgStr += `" />\n`;
        segmentStarted = false;
      }
    }
	} // for pts
	
  if (segmentStarted) {
    endShape();
		svgStr += `" />\n`;
  }
}

function clipPtsMultipoly(ptsArr, multiPoly, rotation = null) {
	let segmentStarted = false;
	
	for (let i = 0; i < ptsArr.length; i++) {
		const pt = ptsArr[i];
		let px = pt.x;
		let py = pt.y;
		
		// Apply manual rotation if required
    if (rotation) {
			const rotPt = getRotatedPt(pt, rotation);
      px = rotPt.x;
      py = rotPt.y;
    }
		
	 	// Check if the point is inside the polygon boundary
    if (isPointInMultiPoly(px, py, multiPoly)) {
      if (!segmentStarted) {
        beginShape();
				svgStr += `<polyline points="`;
        segmentStarted = true;
				if (i > 0) {
					const qt = ptsArr[i-1];
					const len = dist(qt.x, qt.y, pt.x, pt.y);
					const df = 1/len;
					for (let f = df; f < 1; f += df) {
						let qx = lerp(qt.x, pt.x, f);
						let qy = lerp(qt.y, pt.y, f);
						if (rotation) {
							const rotPt = getRotatedPt({x: qx, y: qy}, rotation);
							qx = rotPt.x;
							qy = rotPt.y;
						}
						if (isPointInMultiPoly(qx, qy, multiPoly)) {
							vertex(qx, qy);
							svgStr += `${nf(qx,0,3)},${nf(qy,0,3)} `;
							break;
						}
					}
				}
      }
      vertex(px, py);
			svgStr += `${nf(px,0,3)},${nf(py,0,3)} `;
    } else {
      if (segmentStarted) {
        endShape();
				svgStr += `" />\n`;
        segmentStarted = false;
      }
    }
	} // for pts
	
  if (segmentStarted) {
    endShape();
		svgStr += `" />\n`;
  }
}


function clipArc(x, y, w, h, start, stop, boundaryPoints, rotation = null) {
  // svgStr += `<g fill="none">\n`;
	
	let segmentStarted = false;

	const l = 5;
	const u = TAU*(w+h)/4;
	const num = ~~((stop - start) / 0.01);
	const dlt_angle = (stop - start) / num; // min(HALF_PI, TAU/(u/l)); //
	const pts = [];
  for (let i = 0, angle = start; i <= num; i++, angle += dlt_angle) {
		if (i === num) angle = stop;
		
    // Compute point on the unrotated ellipse
    let px = x + (w / 2) * cos(angle);
    let py = y + (h / 2) * sin(angle);

    // Apply manual rotation if required
    if (rotation) {
			const rotPt = getRotatedPt(px, py, rotation);
      px = rotPt.x;
      py = rotPt.y;
    }

    // Check if the point is inside the polygon boundary
    if (isPointInPolygon(px, py, boundaryPoints)) {
      if (!segmentStarted) {
        beginShape();
				svgStr += `<polyline points="`;
        segmentStarted = true;
      }
      vertex(px, py);
			pts.push({x: px, y: py});
			svgStr += `${nf(px,0,3)},${nf(py,0,3)} `;
    } else {
      if (segmentStarted) {
        endShape();
				svgStr += `" />\n`;
        segmentStarted = false;
      }
    }
  }

  if (segmentStarted) {
    endShape();
		svgStr += `" />\n`;
  }

	return pts;
	// svgStr += `</g>\n`;
}


function clipLine(p1, p2, boundaryPts, inside = true) {
  let intersectionPoints = [];

  // Check intersections with all polygon edges
  for (let i = 0; i < boundaryPts.length; i++) {
    let j = (i + 1) % boundaryPts.length;  // next vertex, wrapping around
    let edgeStart = boundaryPts[i];
    let edgeEnd = boundaryPts[j];

    let intersection = lineSegmentIntersection(p1, p2, edgeStart, edgeEnd);
		if (intersection) insertIntersectionPoint(intersectionPoints, intersection); // intersectionPoints.push(intersection);
  }

  // Check if endpoints are inside the polygon
  let p1Inside = isPointInPolygon(p1.x, p1.y, boundaryPts);
  let p2Inside = isPointInPolygon(p2.x, p2.y, boundaryPts);

  // Add the endpoints if they are inside/outside the polygon
	if (inside) {	
		if (p1Inside) insertIntersectionPoint(intersectionPoints, p1); // intersectionPoints.push(p1);
		if (p2Inside) insertIntersectionPoint(intersectionPoints, p2); // intersectionPoints.push(p2);
	} else {
		if (!p1Inside) insertIntersectionPoint(intersectionPoints, p1); // intersectionPoints.push(p1);
		if (!p2Inside) insertIntersectionPoint(intersectionPoints, p2); // intersectionPoints.push(p2);
	}
	// Sort intersection points by distance from p1
  intersectionPoints.sort((a, b) => dist(p1.x, p1.y, a.x, a.y) - dist(p1.x, p1.y, b.x, b.y));
	
	const debugMode = (intersectionPoints % 2 === 1);
	if (debugMode) {
		console.log(`${p1.x}, ${p1.y}, ${p2.x}, ${p2.y}`);
		console.log(boundaryPts);
		console.log(intersectionPoints);
	}
	
  // Draw all valid line segments inside the polygon
	// svgStr += `<g>\n`
  for (let i = 0; i < intersectionPoints.length - 1; i += 2) {
    let start = intersectionPoints[i];
    let end = intersectionPoints[i + 1];
		const dst = dist(start.x, start.y, end.x, end.y);
		// if (debugMode) {stroke("red")} else {stroke("silver")}
    line(start.x, start.y, end.x, end.y);
		svgStr += `<line x1="${nf(start.x,0,3)}" y1="${nf(start.y,0,3)}" x2="${nf(end.x,0,3)}" y2="${nf(end.y,0,3)}" />\n`;
		// if (debugMode) console.log(`.. ${nf(dst, 0, 3)}: <line x1="${nf(start.x,0,3)}" y1="${nf(start.y,0,3)}" x2="${nf(end.x,0,3)}" y2="${nf(end.y,0,3)}" />\n`);
  }

	// svgStr += `</g>\n`
	return intersectionPoints;
}

function insertIntersectionPoint(arr, newPt) {
	const epsilon = 1e-6;
	
	for (const p of arr) {
		if (dist(p.x, p.y, newPt.x, newPt.y) < epsilon) {
			return false;
		}
	}
	
	arr.push(newPt);
	return true;
}

  
// Check if a point is on a line segment
function isPointOnSegment(x, y, p1, p2) {
  const epsilon = 1e-6; // Small tolerance for floating-point errors
  return (
    x >= Math.min(p1.x, p2.x) - epsilon &&
    x <= Math.max(p1.x, p2.x) + epsilon &&
    y >= Math.min(p1.y, p2.y) - epsilon &&
    y <= Math.max(p1.y, p2.y) + epsilon
  );
}

// Check if a point is inside a polygon (ray-casting algorithm)
function isPointInPolygon(x, y, polygon) {
  const epsilon = 1e-6;
  let isInside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > y + epsilon) !== (yj > y + epsilon)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi + epsilon) + xi);
      
    if (intersect) isInside = !isInside;
  }

  return isInside;
}

// calls isPointInPolygon() for each polygon and inverts result (XOR/DIFFERENCE)
function isPointInMultiPoly(x, y, multipoly) {
  let isInside = false;

	if (Array.isArray(multipoly)) {
		for (const poly of multipoly) {
			if (isPointInPolygon(x, y, poly)) isInside = !isInside;
		}
	} else {
		return isPointInPolygon(x, y, multipoly)
	}
	
  return isInside;
}