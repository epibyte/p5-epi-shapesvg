# Testing Guide

This directory contains a comprehensive test suite for the geometry classes (Point, Line, Polygon) using a simple, dependency-free test runner.

## Files

- `test-runner.js` - Simple test runner with assertion methods
- `point-tests.js` - Tests for Point class
- `line-tests.js` - Tests for Line class  
- `polygon-tests.js` - Tests for Polygon class
- `run-all-tests.js` - Runs all test suites and provides summary

## Running Tests

### All Tests
```bash
node test/run-all-tests.js
```

### Individual Test Suites
```bash
node test/point-tests.js
node test/line-tests.js
node test/polygon-tests.js
```

### In Browser
You can also run tests in the browser by importing the test files as ES modules:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Geometry Tests</title>
</head>
<body>
    <script type="module">
        import './test/run-all-tests.js';
    </script>
</body>
</html>
```

## Test Categories

### Point Tests
- Constructor behavior
- Coordinate operations (set, copy)
- Distance calculations
- Interpolation (lerp)
- Transformations (translate, scale, rotate)
- Equality comparisons
- String/SVG representations

### Line Tests
- Constructor and basic properties
- Length calculations
- Midpoint and interpolation
- Segment intersections
- Line-to-line operations
- String/SVG representations

### Polygon Tests
- Constructor variations
- Multi-ring operations
- Point-in-polygon tests
- Line clipping operations
- Polygon operations (merge, optimize)
- Static factory methods (createNEdge, createStar)
- Boolean operations (outerHull)

## Test Runner Features

The custom test runner provides:

- **Assertion Methods**:
  - `assert(condition, message)` - Basic assertion
  - `assertEqual(actual, expected, message)` - Strict equality
  - `assertAlmostEqual(actual, expected, epsilon, message)` - Floating point equality
  - `assertTrue/assertFalse(condition, message)` - Boolean assertions
  - `assertNull/assertNotNull(value, message)` - Null checks
  - `assertThrows(fn, message)` - Exception testing

- **Test Organization**:
  - `describe(name, fn)` - Test suite grouping
  - `test(name, fn)` - Individual test cases
  - `run()` - Execute tests and report results

- **Output**:
  - Colored console output (✓ for pass, ✗ for fail)
  - Detailed failure messages
  - Summary statistics

## Adding New Tests

To add tests for a new class:

1. Create a new test file (e.g., `new-class-tests.js`)
2. Import the test runner and your class
3. Create test cases using the runner's methods
4. Export the runner instance
5. Add to `run-all-tests.js`

Example:
```javascript
import TestRunner from './test-runner.js';
import NewClass from '../src/NewClass.js';

const runner = new TestRunner();

runner.describe('NewClass', () => {
  runner.test('should do something', () => {
    const instance = new NewClass();
    runner.assertTrue(instance.isValid());
  });
});

export default runner;
```

## Test Coverage

The test suite covers:

- ✅ Constructor edge cases
- ✅ Mathematical operations accuracy
- ✅ Geometric predicates
- ✅ Boundary conditions
- ✅ Error handling
- ✅ Output formatting
- ✅ Complex multi-step operations

## Performance Testing

For performance testing, you can add timing tests:

```javascript
runner.test('performance test', () => {
  const start = performance.now();
  
  // Run operation many times
  for (let i = 0; i < 10000; i++) {
    // ... operation
  }
  
  const end = performance.now();
  const duration = end - start;
  
  runner.assert(duration < 1000, `Operation took too long: ${duration}ms`);
});
```
