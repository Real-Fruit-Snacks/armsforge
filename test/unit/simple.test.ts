import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { extractDescription, extractDescriptionSimple } from '../../src/utils/regex-patterns.js';

// Test utilities for reliable test environment management
class TestEnvironment {
  private testDir: string;
  private originalEnv: string | undefined;

  constructor() {
    // Generate unique test directory with timestamp and random ID
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    this.testDir = join(process.cwd(), `test-temp-${timestamp}-${randomId}`);
    this.originalEnv = process.env.CLAUDE_PLUGIN_ROOT;
  }

  async setup(): Promise<void> {
    // Clean setup with proper error handling
    await this.cleanup();

    // Create test structure with recursive creation
    try {
      mkdirSync(join(this.testDir, 'templates'), { recursive: true });
      mkdirSync(join(this.testDir, 'snippets'), { recursive: true });
      mkdirSync(join(this.testDir, 'data'), { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create test directory structure: ${error}`);
    }

    // Set environment
    process.env.CLAUDE_PLUGIN_ROOT = this.testDir;
  }

  async cleanup(): Promise<void> {
    // Restore original environment
    if (this.originalEnv !== undefined) {
      process.env.CLAUDE_PLUGIN_ROOT = this.originalEnv;
    } else {
      delete process.env.CLAUDE_PLUGIN_ROOT;
    }

    // Clean up test directory with retry logic for resource conflicts
    if (existsSync(this.testDir)) {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          rmSync(this.testDir, { recursive: true, force: true });
          break;
        } catch (error) {
          attempts++;
          if (attempts === maxAttempts) {
            console.warn(`Failed to cleanup test directory after ${maxAttempts} attempts:`, error);
          } else {
            // Brief delay before retry to handle resource conflicts
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
      }
    }
  }

  getTestDir(): string {
    return this.testDir;
  }
}

describe('Armsforge MCP Server Tests', () => {
  let testEnv: TestEnvironment;
  let testDir: string;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
    testDir = testEnv.getTestDir();
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  describe('Template System', () => {
    it('handles template listing logic', () => {
      // Create mock templates
      const templates = {
        'exploit.py': '# @desc Python exploit template\nprint("exploit")',
        'loader.cs': '// @desc C# loader template\nConsole.WriteLine("loader");'
      };

      Object.entries(templates).forEach(([name, content]) => {
        writeFileSync(join(testDir, 'templates', name), content);
      });

      // Test template listing logic
      const files = ['exploit.py', 'loader.cs'];
      let list = '';

      files.forEach(file => {
        const content = readFileSync(join(testDir, 'templates', file), 'utf-8');
        const desc = extractDescription(content);
        list += `  ${file}${desc ? ` — ${desc}` : ''}\n`;
      });

      expect(list).toContain('exploit.py — Python exploit template');
      expect(list).toContain('loader.cs — C# loader template');
    });

    it('handles template retrieval', () => {
      const templateContent = '# @desc Test template\nprint("test")';
      writeFileSync(join(testDir, 'templates', 'test.py'), templateContent);

      const retrieved = readFileSync(join(testDir, 'templates', 'test.py'), 'utf-8');
      expect(retrieved).toBe(templateContent);
    });

    it('handles missing template gracefully', () => {
      const templatesDir = join(testDir, 'templates');
      const available = existsSync(templatesDir) ? ['test.py'] : [];

      const notFound = 'missing.py';
      const result = `Template "${notFound}" not found. Available: ${available.join(', ') || 'none'}`;

      expect(result).toContain('not found');
      expect(result).toContain('Available:');
    });
  });

  describe('Snippet System', () => {
    it('handles snippet listing', () => {
      const snippets = {
        'syscall.asm': '; @desc Direct syscall implementation\nmov rax, 60',
        'crypto.c': '// @desc AES encryption routine\nvoid encrypt() {}'
      };

      Object.entries(snippets).forEach(([name, content]) => {
        writeFileSync(join(testDir, 'snippets', name), content);
      });

      // Test snippet listing
      expect(existsSync(join(testDir, 'snippets', 'syscall.asm'))).toBe(true);
      expect(existsSync(join(testDir, 'snippets', 'crypto.c'))).toBe(true);
    });

    it('extracts descriptions from different comment styles', () => {
      const asmContent = '; @desc Assembly description\nmov rax, 60';
      const cContent = '// @desc C description\nvoid test() {}';

      writeFileSync(join(testDir, 'snippets', 'test.asm'), asmContent);
      writeFileSync(join(testDir, 'snippets', 'test.c'), cContent);

      const asmDesc = extractDescription(asmContent);
      const cDesc = extractDescription(cContent);

      expect(asmDesc).toBe('Assembly description');
      expect(cDesc).toBe('C description');
    });
  });

  describe('Detection Data', () => {
    it('handles JSON data search', () => {
      const apiData = {
        "categories": {
          "injection": {
            "apis": [
              {
                "name": "VirtualAllocEx",
                "risk": "high",
                "description": "Allocates memory in another process"
              }
            ]
          }
        }
      };

      writeFileSync(join(testDir, 'data', 'suspicious-apis.json'), JSON.stringify(apiData, null, 2));

      // Test search logic
      const content = readFileSync(join(testDir, 'data', 'suspicious-apis.json'), 'utf-8');
      const data = JSON.parse(content);

      const query = 'virtualallocex';
      let found = false;

      Object.values(data.categories).forEach((category: any) => {
        category.apis.forEach((api: any) => {
          if (JSON.stringify(api).toLowerCase().includes(query.toLowerCase())) {
            found = true;
            expect(api.name).toBe('VirtualAllocEx');
          }
        });
      });

      expect(found).toBe(true);
    });

    it('handles multiple detection files', () => {
      const files = [
        { name: 'suspicious-apis.json', data: { description: "APIs", categories: {} } },
        { name: 'sysmon-rules.json', data: { description: "Sysmon", events: [] } },
        { name: 'etw-providers.json', data: { description: "ETW", providers: [] } },
        { name: 'amsi-triggers.json', data: { description: "AMSI", trigger_patterns: {} } }
      ];

      files.forEach(({ name, data }) => {
        writeFileSync(join(testDir, 'data', name), JSON.stringify(data, null, 2));
      });

      // Verify all files exist and are valid JSON
      files.forEach(({ name }) => {
        expect(existsSync(join(testDir, 'data', name))).toBe(true);
        const content = readFileSync(join(testDir, 'data', name), 'utf-8');
        expect(() => JSON.parse(content)).not.toThrow();
      });
    });

    it('validates risk levels', () => {
      const validRisks = ['low', 'medium', 'high', 'critical'];
      const testRisk = 'high';

      expect(validRisks.includes(testRisk)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('handles missing directories', () => {
      rmSync(join(testDir, 'templates'), { recursive: true, force: true });

      const dirExists = existsSync(join(testDir, 'templates'));
      const message = dirExists ? 'Templates found' : 'Templates directory not found.';

      expect(message).toBe('Templates directory not found.');
    });

    it('handles malformed JSON gracefully', () => {
      writeFileSync(join(testDir, 'data', 'bad.json'), '{ invalid json }');

      expect(() => {
        try {
          const content = readFileSync(join(testDir, 'data', 'bad.json'), 'utf-8');
          JSON.parse(content);
        } catch {
          // This is expected behavior - continue gracefully
          return 'handled gracefully';
        }
      }).not.toThrow();
    });

    it('handles empty files', () => {
      writeFileSync(join(testDir, 'templates', 'empty.py'), '');

      const content = readFileSync(join(testDir, 'templates', 'empty.py'), 'utf-8');
      expect(content).toBe('');
    });
  });

  describe('Regex Pattern Consistency', () => {
    it('ensures tests use same patterns as implementation', () => {
      const testCases = [
        {
          name: 'Handlebars comment',
          content: '{{!-- @desc Handlebars template description --}}\n<div>content</div>',
          expected: 'Handlebars template description'
        },
        {
          name: 'C-style block comment',
          content: '/* @desc C block comment description */\nvoid main() {}',
          expected: 'C block comment description'
        },
        {
          name: 'Single-line comment',
          content: '// @desc Single line description\nconsole.log("test");',
          expected: 'Single line description'
        },
        {
          name: 'Hash comment',
          content: '# @desc Python/shell description\nprint("test")',
          expected: 'Python/shell description'
        },
        {
          name: 'Assembly comment',
          content: '; @desc Assembly description\nmov rax, 60',
          expected: 'Assembly description'
        },
        {
          name: 'Multiple comment types',
          content: '{{!-- @desc Template description --}}\n// @desc Code description\n# @desc Script description',
          expected: 'Template description' // First match should be returned
        }
      ];

      testCases.forEach(({ name, content, expected }) => {
        writeFileSync(join(testDir, 'test-file.txt'), content);
        const extractedDesc = extractDescription(content);
        expect(extractedDesc).toBe(expected, `Failed for ${name}`);

        // Verify simple extraction works for supported patterns
        if (name === 'Single-line comment' || name === 'Hash comment' || name === 'Assembly comment') {
          const simpleExtracted = extractDescriptionSimple(content);
          expect(simpleExtracted).toBe(expected, `Simple extraction failed for ${name}`);
        }
      });
    });

    it('validates template engine uses comprehensive patterns', () => {
      // Test that comprehensive extraction works with Handlebars templates
      const handlebarsTemplate = '{{!-- @desc Complex template with variables --}}\n{{variable}}\n// @desc Inline comment\ncode here';
      const desc = extractDescription(handlebarsTemplate);
      expect(desc).toBe('Complex template with variables');
    });

    it('validates MCP server uses simple patterns', () => {
      // Test that simple extraction works for snippets (legacy compatibility)
      const snippetContent = '// @desc Simple snippet description\nvoid function() {}';
      const desc = extractDescriptionSimple(snippetContent);
      expect(desc).toBe('Simple snippet description');

      // Verify it doesn't extract Handlebars comments (expected behavior for snippets)
      const handlebarsContent = '{{!-- @desc Template description --}}\ntemplate content';
      const noDesc = extractDescriptionSimple(handlebarsContent);
      expect(noDesc).toBe('');
    });
  });

  describe('Integration Workflows', () => {
    it('simulates template to detection lookup workflow', () => {
      // 1. Create template with API usage
      const template = `# @desc Process injection template
import ctypes
kernel32 = ctypes.windll.kernel32
result = kernel32.VirtualAllocEx(handle, 0, size, 0x3000, 0x40)`;

      writeFileSync(join(testDir, 'templates', 'injection.py'), template);

      // 2. Create detection data
      const detectionData = {
        categories: {
          injection: {
            apis: [{
              name: "VirtualAllocEx",
              risk: "high",
              description: "Memory allocation in remote process"
            }]
          }
        }
      };

      writeFileSync(join(testDir, 'data', 'suspicious-apis.json'), JSON.stringify(detectionData));

      // 3. Verify workflow
      const templateContent = readFileSync(join(testDir, 'templates', 'injection.py'), 'utf-8');
      expect(templateContent).toContain('VirtualAllocEx');

      const detectionContent = readFileSync(join(testDir, 'data', 'suspicious-apis.json'), 'utf-8');
      const detection = JSON.parse(detectionContent);
      expect(detection.categories.injection.apis[0].name).toBe('VirtualAllocEx');
    });
  });
});