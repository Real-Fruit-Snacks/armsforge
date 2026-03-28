import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateEngine } from '../src/templates/engine.js';
import { join } from 'path';
import { mkdirSync, writeFileSync, rmSync } from 'fs';

describe('Cache Performance Benchmark', () => {
  let engine: TemplateEngine;
  let testDir: string;

  beforeEach(() => {
    testDir = join(process.cwd(), 'test-templates-benchmark');
    mkdirSync(testDir, { recursive: true });

    // Create 100 test templates to stress test the cache
    for (let i = 0; i < 100; i++) {
      writeFileSync(join(testDir, `test${i}.hbs`), `Template ${i}: {{name}} - {{value}}`);
    }

    engine = new TemplateEngine(testDir, undefined, {
      maxSize: 50,
      maxMemoryMB: 10
    });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should handle rapid template access efficiently', () => {
    const context = { name: 'Test', value: 'Value' };
    const startTime = performance.now();

    // Access patterns that would stress the old O(n log n) implementation
    for (let i = 0; i < 1000; i++) {
      const templateId = i % 50; // Keep within cache capacity to allow hits
      engine.generateTemplate(`test${templateId}`, context);
    }

    const endTime = performance.now();
    const stats = engine.getCacheStats();

    console.log(`Performance metrics:`);
    console.log(`  Execution time: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`  Cache hits: ${stats.hits}`);
    console.log(`  Cache misses: ${stats.misses}`);
    console.log(`  Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
    console.log(`  Evictions: ${stats.evictions}`);
    console.log(`  Memory usage: ${(stats.memoryUsage / 1024).toFixed(1)}KB`);

    // Should complete in reasonable time (old implementation would be much slower)
    expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max

    // Should have good hit rate due to access patterns
    expect(stats.hitRate).toBeGreaterThan(0.5);

    // Should not have triggered evictions since we stay within cache capacity
    expect(stats.evictions).toBe(0);

    // Memory should be within limits
    expect(stats.memoryUsage).toBeLessThan(stats.maxMemoryUsage);
  });

  it('should maintain O(1) performance characteristics', () => {
    const context = { name: 'Test', value: 'Value' };

    // Fill cache to capacity
    for (let i = 0; i < 50; i++) {
      engine.generateTemplate(`test${i}`, context);
    }

    // Measure time for cache operations at capacity
    const operations = 100;
    const startTime = performance.now();

    for (let i = 0; i < operations; i++) {
      // Mix of hits and evictions
      const templateId = 25 + (i % 50); // Will cause evictions
      engine.generateTemplate(`test${templateId}`, context);
    }

    const endTime = performance.now();
    const avgTimePerOp = (endTime - startTime) / operations;

    console.log(`Average time per operation: ${avgTimePerOp.toFixed(3)}ms`);

    // Each operation should be very fast (O(1) characteristic)
    expect(avgTimePerOp).toBeLessThan(10); // 10ms per operation max
  });
});