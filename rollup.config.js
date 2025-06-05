// run via: npx rollup -c

import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'index.js',
  output: {
    file: 'dist/p5-epi-shapesvg.js',
    format: 'iife',            // Immediately Invoked Function Expression
    name: 'EpiShapeSvg',       // Global namespace when included via script tag
  },
  plugins: [resolve()],
};

/*

<!DOCTYPE html>
<html>
<head>
  <title>My Project</title>
  <script src="dist/p5-epi-shapesvg.js"></script>
</head>
<body>
  <script>
    const { Point, Line } = MyHelper;

    const p1 = new Point(10, 20);
    const p2 = new Point(30, 40);
    const line = new Line(p1, p2);

    console.log(line.length());
  </script>
</body>
</html>

*/