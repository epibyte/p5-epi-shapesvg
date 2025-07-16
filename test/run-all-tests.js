import pointTests from './point-tests.js';
import lineTests from './line-tests.js';
import polygonTests from './polygon-tests.js';

// Run all test suites
console.log('Running Geometry Classes Test Suite');
console.log('===================================');

// Run Point tests
pointTests.run();

// Run Line tests  
lineTests.run();

// Run Polygon tests
polygonTests.run();

// Overall summary
const totalPassed = pointTests.passed + lineTests.passed + polygonTests.passed;
const totalFailed = pointTests.failed + lineTests.failed + polygonTests.failed;
const totalTests = totalPassed + totalFailed;

console.log('\n' + '='.repeat(60));
console.log('OVERALL TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${totalPassed}`);
console.log(`Failed: ${totalFailed}`);

if (totalFailed === 0) {
  console.log('🎉 ALL TESTS PASSED! 🎉');
} else {
  console.log(`❌ ${totalFailed} test(s) failed`);
}

console.log('='.repeat(60));

// Export for potential use in other contexts
export { pointTests, lineTests, polygonTests };
