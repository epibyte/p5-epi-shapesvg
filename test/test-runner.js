/**
 * Simple Test Runner for geometry classes
 * No external dependencies required
 */
export default class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.currentSuite = null;
  }

  /**
   * Start a test suite
   * @param {string} name - Suite name
   * @param {Function} fn - Suite function
   */
  describe(name, fn) {
    console.log(`\n=== ${name} ===`);
    this.currentSuite = name;
    fn();
    this.currentSuite = null;
  }

  /**
   * Run a single test
   * @param {string} name - Test name
   * @param {Function} fn - Test function
   */
  test(name, fn) {
    const fullName = this.currentSuite ? `${this.currentSuite} > ${name}` : name;
    try {
      fn();
      console.log(`✓ ${name}`);
      this.passed++;
    } catch (error) {
      console.log(`✗ ${name}: ${error.message}`);
      this.failed++;
    }
  }

  /**
   * Basic assertion
   * @param {boolean} condition
   * @param {string} message
   */
  assert(condition, message = 'Assertion failed') {
    if (!condition) {
      throw new Error(message);
    }
  }

  /**
   * Assert strict equality
   * @param {*} actual
   * @param {*} expected
   * @param {string} message
   */
  assertEqual(actual, expected, message = `Expected ${expected}, got ${actual}`) {
    if (actual !== expected) {
      throw new Error(message);
    }
  }

  /**
   * Assert approximate equality (for floating point numbers)
   * @param {number} actual
   * @param {number} expected
   * @param {number} epsilon
   * @param {string} message
   */
  assertAlmostEqual(actual, expected, epsilon = 1e-6, message = `Expected ~${expected}, got ${actual}`) {
    if (Math.abs(actual - expected) > epsilon) {
      throw new Error(message);
    }
  }

  /**
   * Assert that a function throws an error
   * @param {Function} fn
   * @param {string} message
   */
  assertThrows(fn, message = 'Expected function to throw') {
    try {
      fn();
      throw new Error(message);
    } catch (error) {
      if (error.message === message) {
        throw error; // Re-throw if it's our assertion error
      }
      // Function threw as expected
    }
  }

  /**
   * Assert that condition is true
   * @param {boolean} condition
   * @param {string} message
   */
  assertTrue(condition, message = 'Expected true') {
    this.assert(condition === true, message);
  }

  /**
   * Assert that condition is false
   * @param {boolean} condition
   * @param {string} message
   */
  assertFalse(condition, message = 'Expected false') {
    this.assert(condition === false, message);
  }

  /**
   * Assert that value is null
   * @param {*} value
   * @param {string} message
   */
  assertNull(value, message = 'Expected null') {
    this.assert(value === null, message);
  }

  /**
   * Assert that value is not null
   * @param {*} value
   * @param {string} message
   */
  assertNotNull(value, message = 'Expected not null') {
    this.assert(value !== null, message);
  }

  /**
   * Print test results and return success status
   * @returns {boolean} - True if all tests passed
   */
  run() {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Test Results: ${this.passed} passed, ${this.failed} failed`);
    if (this.failed > 0) {
      console.log(`❌ ${this.failed} test(s) failed`);
    } else {
      console.log(`✅ All tests passed!`);
    }
    console.log(`${'='.repeat(50)}`);
    return this.failed === 0;
  }
}
