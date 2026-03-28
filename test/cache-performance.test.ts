import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateEngine } from '../src/templates/engine.js';
import { join } from 'path';
import { mkdirSync, writeFileSync, rmSync } from 'fs';

describe('LRU Cache Performance', () => {
  let engine: TemplateEngine;
  let testDir: string;

  beforeEach(() => {
    // Create temporary test directory
    testDir = join(process.cwd(), 'test-templates-cache');
    mkdirSync(testDir, { recursive: true });

    // Create test template
    writeFileSync(join(testDir, 'test.hbs'), 'Hello {{name}}!');

    // Initialize engine with small cache for testing
    engine = new TemplateEngine(testDir, undefined, {
      maxSize: 3,
      maxMemoryMB: 1
    });
  });

  afterEach(() => {
    // Cleanup
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should track cache hits and misses', () => {
    const context = { name: 'World' };

    // Initial stats should be zero
    let stats = engine.getCacheStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.size).toBe(0);

    // First access should be a miss
    engine.generateTemplate('test', context);
    stats = engine.getCacheStats();
    expect(stats.misses).toBe(1);
    expect(stats.hits).toBe(0);
    expect(stats.size).toBe(1);

    // Second access should be a hit
    engine.generateTemplate('test', context);
    stats = engine.getCacheStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.size).toBe(1);
  });

  it('should track memory usage', () => {
    const context = { name: 'World' };

    engine.generateTemplate('test', context);
    const stats = engine.getCacheStats();

    expect(stats.memoryUsage).toBeGreaterThan(0);
    expect(stats.maxMemoryUsage).toBe(1024 * 1024); // 1MB
    expect(stats.memoryUsage).toBeLessThan(stats.maxMemoryUsage);
  });

  it('should calculate hit rate correctly', () => {
    const context = { name: 'World' };

    // Generate template multiple times
    engine.generateTemplate('test', context); // miss
    engine.generateTemplate('test', context); // hit
    engine.generateTemplate('test', context); // hit
    engine.generateTemplate('test', context); // hit

    const stats = engine.getCacheStats();
    expect(stats.hitRate).toBe(0.75); // 3 hits out of 4 total accesses
  });

  it('should evict least recently used items when capacity exceeded', () => {
    const context = { name: 'World' };

    // Create multiple test templates
    writeFileSync(join(testDir, 'test1.hbs'), 'Template 1: {{name}}');
    writeFileSync(join(testDir, 'test2.hbs'), 'Template 2: {{name}}');
    writeFileSync(join(testDir, 'test3.hbs'), 'Template 3: {{name}}');
    writeFileSync(join(testDir, 'test4.hbs'), 'Template 4: {{name}}');

    // Fill cache to capacity (3 items)
    engine.generateTemplate('test1', context);
    engine.generateTemplate('test2', context);
    engine.generateTemplate('test3', context);

    let stats = engine.getCacheStats();
    expect(stats.size).toBe(3);
    expect(stats.evictions).toBe(0);

    // Adding 4th item should evict the first one (test1)
    engine.generateTemplate('test4', context);

    stats = engine.getCacheStats();
    expect(stats.size).toBe(3); // Still at capacity
    expect(stats.evictions).toBe(1); // One eviction occurred

    // Accessing test1 again should be a miss (it was evicted)
    const missCountBefore = stats.misses;
    engine.generateTemplate('test1', context);

    stats = engine.getCacheStats();
    expect(stats.misses).toBe(missCountBefore + 1);
  });

  it('should clear cache and maintain stats', () => {
    const context = { name: 'World' };

    engine.generateTemplate('test', context);
    engine.generateTemplate('test', context);

    let stats = engine.getCacheStats();
    expect(stats.size).toBe(1);
    expect(stats.hits).toBe(1);

    engine.clearCache();

    stats = engine.getCacheStats();
    expect(stats.size).toBe(0);
    expect(stats.memoryUsage).toBe(0);
    // Stats should be preserved
    expect(stats.hits).toBe(1);
  });

  it('should reset stats independently of cache', () => {
    const context = { name: 'World' };

    engine.generateTemplate('test', context);
    engine.generateTemplate('test', context);

    let stats = engine.getCacheStats();
    expect(stats.hits).toBe(1);
    expect(stats.size).toBe(1);

    engine.resetCacheStats();

    stats = engine.getCacheStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.evictions).toBe(0);
    // Cache should still be intact
    expect(stats.size).toBe(1);
  });
});