import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { rm, access } from 'fs/promises';
import { join } from 'path';
import { mockTemplates, mockSnippets, mockDetectionData } from '../fixtures/mock-data.js';

export class TestEnvironment {
  private testRoot: string;
  private originalEnv: string | undefined;

  constructor() {
    // Create unique directory for each test instance to prevent conflicts
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    this.testRoot = join(process.cwd(), 'test', 'temp', uniqueId);
    this.originalEnv = process.env.CLAUDE_PLUGIN_ROOT;
  }

  async setup(): Promise<void> {
    // Clean up any existing test directory
    await this.cleanup();

    // Create test directory structure
    mkdirSync(this.testRoot, { recursive: true });
    mkdirSync(join(this.testRoot, 'templates'), { recursive: true });
    mkdirSync(join(this.testRoot, 'snippets'), { recursive: true });
    mkdirSync(join(this.testRoot, 'data'), { recursive: true });

    // Set environment variable to point to test root
    process.env.CLAUDE_PLUGIN_ROOT = this.testRoot;

    // Create mock template files
    Object.entries(mockTemplates).forEach(([filename, { content }]) => {
      writeFileSync(join(this.testRoot, 'templates', filename), content);
    });

    // Create mock snippet files
    Object.entries(mockSnippets).forEach(([filename, { content }]) => {
      writeFileSync(join(this.testRoot, 'snippets', filename), content);
    });

    // Create mock detection data files
    Object.entries(mockDetectionData).forEach(([filename, data]) => {
      writeFileSync(join(this.testRoot, 'data', filename), JSON.stringify(data, null, 2));
    });
  }

  async cleanup(): Promise<void> {
    // Restore original environment
    if (this.originalEnv !== undefined) {
      process.env.CLAUDE_PLUGIN_ROOT = this.originalEnv;
    } else {
      delete process.env.CLAUDE_PLUGIN_ROOT;
    }

    // Remove test directory with async retry for Windows file locking issues
    try {
      await access(this.testRoot);
    } catch {
      // Directory doesn't exist, nothing to clean up
      return;
    }

    let retries = 3;
    let delay = 10; // Start with 10ms delay

    while (retries > 0) {
      try {
        await rm(this.testRoot, { recursive: true, force: true });
        break; // Success, exit retry loop
      } catch (error: any) {
        retries--;
        if ((error.code === 'ENOTEMPTY' || error.code === 'EBUSY' || error.code === 'EPERM') && retries > 0) {
          // Proper async delay with exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff: 10ms, 20ms, 40ms
        } else {
          // Either not a recoverable error or out of retries - ignore cleanup errors in tests
          console.warn(`Failed to cleanup test directory ${this.testRoot}:`, error.message);
          break;
        }
      }
    }
  }

  getTestRoot(): string {
    return this.testRoot;
  }
}

export function createMockTool(name: string, description: string, schema: any, handler: Function) {
  return {
    name,
    description,
    schema,
    handler: async (args: any) => {
      try {
        return await handler(args);
      } catch (error) {
        throw error;
      }
    }
  };
}

export function expectTextContent(result: any, expectedText: string): void {
  expect(result).toHaveProperty('content');
  expect(Array.isArray(result.content)).toBe(true);
  expect(result.content).toHaveLength(1);
  expect(result.content[0]).toHaveProperty('type', 'text');
  expect(result.content[0]).toHaveProperty('text', expectedText);
}

export function expectTextContentContains(result: any, expectedSubstring: string): void {
  expect(result).toHaveProperty('content');
  expect(Array.isArray(result.content)).toBe(true);
  expect(result.content).toHaveLength(1);
  expect(result.content[0]).toHaveProperty('type', 'text');
  expect(result.content[0].text).toContain(expectedSubstring);
}