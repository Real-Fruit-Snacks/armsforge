import { describe, it, expect } from 'vitest';
import { TestEnvironment } from '../utils/test-helpers.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Basic Test Setup', () => {
  it('creates test environment correctly', async () => {
    const testEnv = new TestEnvironment();
    await testEnv.setup();

    try {
      const testRoot = testEnv.getTestRoot();

      // Check that directories exist
      expect(existsSync(join(testRoot, 'templates'))).toBe(true);
      expect(existsSync(join(testRoot, 'snippets'))).toBe(true);
      expect(existsSync(join(testRoot, 'data'))).toBe(true);

      // Check that mock files were created
      expect(existsSync(join(testRoot, 'templates', 'test-exploit.py'))).toBe(true);
      expect(existsSync(join(testRoot, 'data', 'suspicious-apis.json'))).toBe(true);

      // Verify file contents
      const templateContent = readFileSync(join(testRoot, 'templates', 'test-exploit.py'), 'utf-8');
      expect(templateContent).toContain('Mock exploit code');

    } finally {
      await testEnv.cleanup();
    }
  });

  it('validates basic functionality', () => {
    expect(2 + 2).toBe(4);
    expect('vitest').toBeTruthy();
    expect(Array.isArray([])).toBe(true);
  });
});