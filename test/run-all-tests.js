import pointTests from './point-tests.js';
import lineTests from './line-tests.js';
import polygonTests from './polygon-tests.js';
import polygonClipTests from './polygon-clip-tests.js';

// Suite files run themselves on import and print their own summaries.
console.log('Running Geometry Classes Test Suite');
console.log('===================================');

// Aggregate totals from all suites.
const suites = [pointTests, lineTests, polygonTests, polygonClipTests];
const totalPassed = suites.reduce((sum, suite) => sum + suite.passed, 0);
const totalFailed = suites.reduce((sum, suite) => sum + suite.failed, 0);
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

// Final process exit code. Guarded for browser use.
if (typeof process !== 'undefined') {
  process.exitCode = totalFailed > 0 ? 1 : 0;
}

// Export for potential use in other contexts
export { pointTests, lineTests, polygonTests, polygonClipTests };
