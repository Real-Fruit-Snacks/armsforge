/**
 * Test script to verify path traversal vulnerability is fixed
 */

import { resolveSafePath, FilePathSchema } from './dist/utils/validation.js';
import { resolve } from 'path';

console.log('Testing path traversal fix...\n');

// Test 1: Normal paths should work
try {
  const result = resolveSafePath('/base', 'file.txt');
  console.log('✅ Normal path works:', result);
} catch (error) {
  console.log('❌ Normal path failed:', error.message);
}

// Test 2: Traversal should be blocked
try {
  const result = resolveSafePath('/base', '../../../etc/passwd');
  console.log('❌ Traversal not blocked:', result);
} catch (error) {
  console.log('✅ Traversal blocked:', error.userMessage || error.message);
}

// Test 3: Encoded traversal should be blocked
try {
  const result = resolveSafePath('/base', '..%2F..%2F..%2Fetc%2Fpasswd');
  console.log('❌ Encoded traversal not blocked:', result);
} catch (error) {
  console.log('✅ Encoded traversal blocked:', error.userMessage || error.message);
}

// Test 4: Schema validation - normal path
try {
  const result = FilePathSchema.parse('templates/exploit.c');
  console.log('✅ Schema accepts normal path:', result);
} catch (error) {
  console.log('❌ Schema rejects normal path:', error.message);
}

// Test 5: Schema validation - traversal path
try {
  const result = FilePathSchema.parse('../../../etc/passwd');
  console.log('❌ Schema accepts traversal path:', result);
} catch (error) {
  console.log('✅ Schema rejects traversal path:', error.issues?.[0]?.message || error.message);
}

// Test 6: Schema validation - absolute path
try {
  const result = FilePathSchema.parse('/etc/passwd');
  console.log('❌ Schema accepts absolute path:', result);
} catch (error) {
  console.log('✅ Schema rejects absolute path:', error.issues?.[0]?.message || error.message);
}

console.log('\nPath traversal fix verification complete!');