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