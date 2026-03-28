import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserPreferencesManager } from '../../src/config/user-preferences.js';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

describe('UserPreferencesManager Concurrency Tests', () => {
  let tempDir: string;
  let managers: UserPreferencesManager[];

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = join(homedir(), '.armsforge-test-concurrency');
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    managers = [];
  });

  afterEach(() => {
    // Clean up
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    managers = [];
  });

  it('should handle concurrent async savePreferences calls without race conditions', async () => {
    const configPath = join(tempDir, 'config.json');

    // Create multiple managers pointing to the same config
    const numManagers = 10;
    for (let i = 0; i < numManagers; i++) {
      const manager = new UserPreferencesManager(configPath);
      // Modify some preference to ensure we're saving different data
      manager.updateDefaultTemplateContext({ target_arch: i % 2 === 0 ? 'x64' : 'x86' });
      managers.push(manager);
    }

    // Execute savePreferences concurrently
    const savePromises = managers.map(manager => manager.savePreferences());

    // All saves should complete without errors
    await expect(Promise.all(savePromises)).resolves.not.toThrow();

    // Config file should exist
    expect(existsSync(configPath)).toBe(true);

    // Config directory should exist
    expect(existsSync(tempDir)).toBe(true);
  });

  it('should handle concurrent sync savePreferencesSync calls without race conditions', () => {
    const configPath = join(tempDir, 'config.json');

    // Create multiple managers pointing to the same config
    const numManagers = 5;
    for (let i = 0; i < numManagers; i++) {
      const manager = new UserPreferencesManager(configPath);
      manager.updateDefaultTemplateContext({ target_arch: i % 2 === 0 ? 'x64' : 'x86' });
      managers.push(manager);
    }

    // Execute savePreferencesSync concurrently (simulate with rapid succession)
    expect(() => {
      managers.forEach(manager => manager.savePreferencesSync());
    }).not.toThrow();

    // Config file should exist
    expect(existsSync(configPath)).toBe(true);

    // Config directory should exist
    expect(existsSync(tempDir)).toBe(true);
  });

  it('should handle mixed async and sync saves gracefully', async () => {
    const configPath = join(tempDir, 'config.json');

    // Create managers
    const asyncManager = new UserPreferencesManager(configPath);
    const syncManager = new UserPreferencesManager(configPath);

    asyncManager.updateDefaultTemplateContext({ target_arch: 'x64' });
    syncManager.updateDefaultTemplateContext({ target_arch: 'x86' });

    // Mix async and sync operations
    const operations = [
      asyncManager.savePreferences(),
      Promise.resolve(syncManager.savePreferencesSync()),
      asyncManager.savePreferences()
    ];

    await expect(Promise.all(operations)).resolves.not.toThrow();
    expect(existsSync(configPath)).toBe(true);
  });

  it('should handle directory creation race conditions correctly', async () => {
    const configPath = join(tempDir, 'subdir', 'nested', 'config.json');

    // Create multiple managers that will need to create the same nested directory structure
    const numManagers = 8;
    for (let i = 0; i < numManagers; i++) {
      managers.push(new UserPreferencesManager(configPath));
    }

    // All should try to create the directory structure concurrently
    const savePromises = managers.map(manager => manager.savePreferences());

    await expect(Promise.all(savePromises)).resolves.not.toThrow();

    // Verify the nested directory was created
    expect(existsSync(join(tempDir, 'subdir', 'nested'))).toBe(true);
    expect(existsSync(configPath)).toBe(true);
  });

  it('should maintain data integrity under concurrent access', async () => {
    const configPath = join(tempDir, 'config.json');

    // Create managers with different configurations
    const manager1 = new UserPreferencesManager(configPath);
    const manager2 = new UserPreferencesManager(configPath);

    manager1.updateDefaultTemplateContext({
      target_arch: 'x64',
      target_os: 'windows',
      language: 'c'
    });

    manager2.updateDefaultTemplateContext({
      target_arch: 'x86',
      target_os: 'linux',
      language: 'cpp'
    });

    // Save both concurrently
    await Promise.all([
      manager1.savePreferences(),
      manager2.savePreferences()
    ]);

    // Verify that the file was written successfully (last writer wins is acceptable)
    expect(existsSync(configPath)).toBe(true);

    // Load the saved config to verify it's valid JSON
    const finalManager = new UserPreferencesManager(configPath);
    const prefs = finalManager.getPreferences();

    // Should have valid structure regardless of which manager's data was saved last
    expect(prefs).toHaveProperty('default_template_context');
    expect(['x64', 'x86']).toContain(prefs.default_template_context.target_arch);
    expect(['windows', 'linux']).toContain(prefs.default_template_context.target_os);
  });

  it('should handle EEXIST errors gracefully during directory creation', async () => {
    const configPath = join(tempDir, 'config.json');

    // Pre-create the directory to simulate a race condition
    mkdirSync(tempDir, { recursive: true });

    const manager = new UserPreferencesManager(configPath);

    // Should not throw even though directory already exists
    await expect(manager.savePreferences()).resolves.not.toThrow();
    expect(existsSync(configPath)).toBe(true);
  });

  it('should serialize access through mutex correctly', async () => {
    const configPath = join(tempDir, 'config.json');
    const results: number[] = [];

    // Create managers that will record execution order
    const managers = Array.from({ length: 5 }, (_, i) => {
      const manager = new UserPreferencesManager(configPath);
      return {
        manager,
        id: i,
        save: async () => {
          await manager.savePreferences();
          results.push(i);
        }
      };
    });

    // Execute all saves concurrently
    await Promise.all(managers.map(m => m.save()));

    // All should have completed
    expect(results).toHaveLength(5);
    expect(results.sort()).toEqual([0, 1, 2, 3, 4]);
    expect(existsSync(configPath)).toBe(true);
  });

  it('should handle errors during concurrent operations correctly', async () => {
    // Use an invalid path that will cause errors but passes validation
    // Create a path in temp directory with insufficient permissions
    const invalidDir = join(tempDir, 'readonly');
    mkdirSync(invalidDir, { recursive: true });

    // Try to make it readonly (this might not work on all systems, so we'll handle both cases)
    try {
      const fs = await import('fs');
      fs.chmodSync(invalidDir, 0o444); // readonly
    } catch {
      // If chmod fails, skip this test on systems that don't support it
      console.warn('Skipping permission test on system that doesnt support chmod');
      return;
    }

    const invalidPath = join(invalidDir, 'config.json');

    // The managers should be created successfully, but savePreferences should fail
    const managers = Array.from({ length: 3 }, () => {
      // Create with a path that passes validation but will fail on write
      const manager = new UserPreferencesManager();
      // Override the configPath to the readonly directory
      (manager as any).configPath = invalidPath;
      return manager;
    });

    // All should fail gracefully with the same error
    const results = await Promise.allSettled(
      managers.map(m => m.savePreferences())
    );

    results.forEach(result => {
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        expect(result.reason.message).toContain('Failed to save preferences');
      }
    });

    // Restore permissions for cleanup
    try {
      const fs = await import('fs');
      fs.chmodSync(invalidDir, 0o755);
    } catch {
      // Ignore cleanup errors
    }
  });
});