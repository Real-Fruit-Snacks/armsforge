#!/usr/bin/env node

// Test script to verify template security fixes
import { TemplateEngine } from './dist/src/templates/engine.js';
import { mkdtempSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

console.log('Testing template security fixes...\n');

// Create temporary directory for test templates
const testDir = mkdtempSync(join(tmpdir(), 'template-test-'));

// Test 1: Normal template should work
const normalTemplate = `
{{!-- @desc Test template --}}
// Normal template test
const data = "{{payload_data}}";
console.log("Architecture: {{target_arch}}");
{{#ifOS "windows"}}
// Windows-specific code
{{/ifOS}}
`;

writeFileSync(join(testDir, 'normal.hbs'), normalTemplate);

// Test 2: Malicious template with prototype pollution attempt
const maliciousTemplate1 = `
{{!-- @desc Malicious template --}}
// Attempting prototype pollution
{{constructor.prototype.isAdmin}} = true;
const data = "{{payload_data}}";
`;

writeFileSync(join(testDir, 'malicious1.hbs'), maliciousTemplate1);

// Test 3: Template with dangerous __proto__ access
const maliciousTemplate2 = `
{{!-- @desc Another malicious template --}}
// Attempting __proto__ access
{{__proto__.polluted}} = "hacked";
const data = "{{payload_data}}";
`;

writeFileSync(join(testDir, 'malicious2.hbs'), maliciousTemplate2);

// Test 4: Template with partials (should be blocked)
const maliciousTemplate3 = `
{{!-- @desc Partial inclusion attempt --}}
{{> ../../../etc/passwd}}
const data = "{{payload_data}}";
`;

writeFileSync(join(testDir, 'malicious3.hbs'), maliciousTemplate3);

// Initialize template engine
const engine = new TemplateEngine(testDir);

const context = {
  payload_data: 'test-data',
  target_arch: 'x64',
  target_os: 'windows',
  language: 'javascript',
  evasion_level: 1,
  payload_format: 'raw'
};

let testsPassed = 0;
let testsTotal = 4;

// Test 1: Normal template should work
try {
  console.log('Test 1: Normal template compilation...');
  const result = engine.generateTemplate('normal', context);
  if (result.includes('const data = "test-data"') && result.includes('Architecture: x64')) {
    console.log('✅ Normal template works correctly\n');
    testsPassed++;
  } else {
    console.log('❌ Normal template failed\n');
  }
} catch (error) {
  console.log(`❌ Normal template failed: ${error.message}\n`);
}

// Test 2: Malicious template 1 should be blocked
try {
  console.log('Test 2: Prototype pollution attempt...');
  engine.generateTemplate('malicious1', context);
  console.log('❌ Malicious template 1 was NOT blocked (SECURITY ISSUE)\n');
} catch (error) {
  console.log(`✅ Malicious template 1 blocked: ${error.message}\n`);
  testsPassed++;
}

// Test 3: Malicious template 2 should be blocked
try {
  console.log('Test 3: __proto__ access attempt...');
  engine.generateTemplate('malicious2', context);
  console.log('❌ Malicious template 2 was NOT blocked (SECURITY ISSUE)\n');
} catch (error) {
  console.log(`✅ Malicious template 2 blocked: ${error.message}\n`);
  testsPassed++;
}

// Test 4: Malicious template 3 should be blocked
try {
  console.log('Test 4: Partial inclusion attempt...');
  engine.generateTemplate('malicious3', context);
  console.log('❌ Malicious template 3 was NOT blocked (SECURITY ISSUE)\n');
} catch (error) {
  console.log(`✅ Malicious template 3 blocked: ${error.message}\n`);
  testsPassed++;
}

console.log(`\n=== TEST RESULTS ===`);
console.log(`Passed: ${testsPassed}/${testsTotal}`);
if (testsPassed === testsTotal) {
  console.log('🎉 All security tests passed! Template compilation is now secure.');
  process.exit(0);
} else {
  console.log('⚠️  Some security tests failed. Review the implementation.');
  process.exit(1);
}