import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserPreferencesManager } from '../../src/config/user-preferences.js';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

describe('UserPreferencesManager Security Tests', () => {
  let tempDir: string;
  let manager: UserPreferencesManager;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = join(homedir(), '.armsforge-test');
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should use os.homedir() instead of environment variables', () => {
    // Store original env vars
    const originalHome = process.env.HOME;
    const originalUserProfile = process.env.USERPROFILE;

    try {
      // Set malicious environment variables
      process.env.HOME = '/etc/passwd';
      process.env.USERPROFILE = 'C:\\Windows\\System32';

      // Create manager with default config path
      manager = new UserPreferencesManager();

      // The config path should still use the real home directory from os.homedir()
      const expectedPath = join(homedir(), '.armsforge', 'config.json');
      expect((manager as any).configPath).toBe(expectedPath);

    } finally {
      // Restore original env vars
      process.env.HOME = originalHome;
      process.env.USERPROFILE = originalUserProfile;
    }
  });

  it('should validate config paths and prevent traversal', () => {
    // Try to create a manager with a malicious config path
    const maliciousPath = '../../../etc/passwd';

    expect(() => {
      manager = new UserPreferencesManager(maliciousPath);
      manager.savePreferences();
    }).toThrow();
  });

  it('should handle missing home directory gracefully', () => {
    // Mock os.homedir to throw an error
    const originalHomedir = require('os').homedir;

    try {
      require('os').homedir = () => {
        throw new Error('Home directory unavailable');
      };

      // Should fall back to current directory safely
      manager = new UserPreferencesManager();
      expect((manager as any).configPath).toContain('.armsforge');

    } finally {
      require('os').homedir = originalHomedir;
    }
  });

  it('should prevent writing to system directories', () => {
    if (process.platform === 'win32') {
      // Skip system directory test on Windows
      return;
    }

    const systemPath = '/etc/armsforge-config.json';

    expect(() => {
      manager = new UserPreferencesManager(systemPath);
      manager.savePreferences();
    }).toThrow('Cannot write config to system directory');
  });

  it('should reject overly long paths', () => {
    const longPath = 'a'.repeat(1001) + '/config.json';

    expect(() => {
      manager = new UserPreferencesManager(longPath);
      manager.savePreferences();
    }).toThrow('Config path too long');
  });

  it('should create config directory safely', () => {
    const safePath = join(homedir(), '.armsforge-test-safe', 'config.json');

    manager = new UserPreferencesManager(safePath);

    // This should succeed and create the directory
    expect(() => {
      manager.savePreferences();
    }).not.toThrow();

    // Verify the config file was created
    expect(existsSync(safePath)).toBe(true);

    // Clean up
    rmSync(join(homedir(), '.armsforge-test-safe'), { recursive: true, force: true });
  });

  it('should normalize and resolve paths correctly', () => {
    const unnormalizedPath = join(homedir(), '.armsforge', '..', '.armsforge', 'config.json');

    manager = new UserPreferencesManager(unnormalizedPath);

    // Should normalize to the expected path
    const expectedPath = join(homedir(), '.armsforge', 'config.json');
    expect((manager as any).configPath).toBe(expectedPath);
  });
});