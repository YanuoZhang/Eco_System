#!/usr/bin/env node

/**
 * Simple test runner for energy-mix API tests
 * This script can be used to run tests manually if npm test has issues
 */

const { exec } = require('child_process');
const path = require('path');

console.log('Running Energy Mix API Tests...\n');

// Run vitest directly
const testCommand = 'npx vitest run --reporter=verbose';

exec(testCommand, { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Test execution failed: ${error.message}`);
    process.exit(1);
  }

  if (stderr) {
    console.error(`Test warnings: ${stderr}`);
  }

  console.log(stdout);

  if (stdout.includes('PASS') && !stdout.includes('FAIL')) {
    console.log('\nAll tests passed!');
  } else {
    console.log('\nSome tests failed!');
    process.exit(1);
  }
});
