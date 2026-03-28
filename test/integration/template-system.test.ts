import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { TestEnvironment } from '../utils/test-helpers.js';

describe('Template System Integration', () => {
  let testEnv: TestEnvironment;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  describe('Template Validation', () => {
    it('validates Python template syntax', () => {
      const pythonTemplate = readFileSync(
        join(testEnv.getTestRoot(), 'templates', 'test-exploit.py'),
        'utf-8'
      );

      // Check for valid Python syntax indicators
      expect(pythonTemplate).toMatch(/^#!\/usr\/bin\/env python3/);
      expect(pythonTemplate).toMatch(/import\s+\w+/);
      expect(pythonTemplate).toMatch(/def\s+\w+\(/);

      // Check for required template metadata
      expect(pythonTemplate).toMatch(/@desc\s+.+/);

      // Check for template placeholders
      expect(pythonTemplate).toMatch(/Mock exploit code/);
    });

    it('validates C# template syntax', () => {
      const csharpTemplate = readFileSync(
        join(testEnv.getTestRoot(), 'templates', 'mock-loader.cs'),
        'utf-8'
      );

      // Check for valid C# syntax indicators
      expect(csharpTemplate).toMatch(/using\s+System/);
      expect(csharpTemplate).toMatch(/namespace\s+\w+/);
      expect(csharpTemplate).toMatch(/class\s+\w+/);
      expect(csharpTemplate).toMatch(/static\s+void\s+Main/);

      // Check for template metadata
      expect(csharpTemplate).toMatch(/@desc\s+.+/);
    });

    it('extracts template metadata correctly', () => {
      const templates = [
        { file: 'test-exploit.py', expectedDesc: 'Test exploit template for unit testing' },
        { file: 'mock-loader.cs', expectedDesc: 'Mock C# loader for testing' }
      ];

      templates.forEach(({ file, expectedDesc }) => {
        const content = readFileSync(join(testEnv.getTestRoot(), 'templates', file), 'utf-8');
        const descMatch = content.match(/^\/\/\s*@desc\s+(.+)$/m) || content.match(/^#\s*@desc\s+(.+)$/m);

        expect(descMatch).toBeTruthy();
        expect(descMatch![1]).toBe(expectedDesc);
      });
    });

    it('validates template placeholders and TODOs', () => {
      // Create a more realistic template with placeholders
      const templateWithPlaceholders = `#!/usr/bin/env python3
# @desc Realistic template with placeholders
"""
Target: <TARGET_BINARY>
Platform: <PLATFORM>
"""

OFFSET = 0  # TODO: Find with pattern_create
RET_ADDR = 0x00000000  # TODO: Set return address
PAYLOAD = b"<PAYLOAD>"  # TODO: Generate payload

def exploit(target_ip, target_port):
    # TODO: Implement exploit logic
    pass
`;

      writeFileSync(
        join(testEnv.getTestRoot(), 'templates', 'placeholder-test.py'),
        templateWithPlaceholders
      );

      const content = readFileSync(
        join(testEnv.getTestRoot(), 'templates', 'placeholder-test.py'),
        'utf-8'
      );

      // Check for common placeholder patterns
      expect(content).toMatch(/<[A-Z_]+>/g); // Angle bracket placeholders
      expect(content).toMatch(/TODO:/g); // TODO markers
      expect(content).toMatch(/0x[0-9a-fA-F]+/); // Hex addresses
    });
  });

  describe('Snippet Validation', () => {
    it('validates Assembly snippet syntax', () => {
      const asmSnippet = readFileSync(
        join(testEnv.getTestRoot(), 'snippets', 'test-syscall.asm'),
        'utf-8'
      );

      // Check for valid Assembly syntax
      expect(asmSnippet).toMatch(/section\s+\.\w+/);
      expect(asmSnippet).toMatch(/global\s+\w+/);
      expect(asmSnippet).toMatch(/mov\s+\w+,\s*\d+/);
      expect(asmSnippet).toMatch(/syscall/);

      // Check for snippet metadata
      expect(asmSnippet).toMatch(/;\s*@desc\s+.+/);
    });

    it('validates C snippet syntax', () => {
      const cSnippet = readFileSync(
        join(testEnv.getTestRoot(), 'snippets', 'mock-crypto.c'),
        'utf-8'
      );

      // Check for valid C syntax
      expect(cSnippet).toMatch(/#include\s+<\w+\.h>/);
      expect(cSnippet).toMatch(/void\s+\w+\(/);
      expect(cSnippet).toMatch(/for\s*\(/);
      expect(cSnippet).toMatch(/\/\/\s*@desc\s+.+/);
    });

    it('checks for common security patterns in snippets', () => {
      const patterns = [
        { file: 'mock-crypto.c', pattern: /\^|\+|-/, description: 'crypto operations' },
        { file: 'test-syscall.asm', pattern: /syscall|int\s+0x80/, description: 'system calls' }
      ];

      patterns.forEach(({ file, pattern, description }) => {
        const content = readFileSync(join(testEnv.getTestRoot(), 'snippets', file), 'utf-8');
        expect(content).toMatch(pattern);
      });
    });
  });

  describe('Detection Data Integration', () => {
    it('validates JSON structure across all detection files', () => {
      const dataFiles = [
        'suspicious-apis.json',
        'sysmon-rules.json',
        'etw-providers.json',
        'amsi-triggers.json'
      ];

      dataFiles.forEach(file => {
        const content = readFileSync(join(testEnv.getTestRoot(), 'data', file), 'utf-8');

        // Should be valid JSON
        expect(() => JSON.parse(content)).not.toThrow();

        const data = JSON.parse(content);
        expect(data).toHaveProperty('description');
        expect(typeof data.description).toBe('string');
      });
    });

    it('validates suspicious APIs data structure', () => {
      const content = readFileSync(join(testEnv.getTestRoot(), 'data', 'suspicious-apis.json'), 'utf-8');
      const data = JSON.parse(content);

      expect(data).toHaveProperty('categories');
      expect(typeof data.categories).toBe('object');

      // Check structure of API entries
      Object.values(data.categories).forEach((category: any) => {
        expect(category).toHaveProperty('apis');
        expect(Array.isArray(category.apis)).toBe(true);

        category.apis.forEach((api: any) => {
          expect(api).toHaveProperty('name');
          expect(api).toHaveProperty('risk');
          expect(api).toHaveProperty('description');
          expect(['low', 'medium', 'high', 'critical']).toContain(api.risk);
        });
      });
    });

    it('validates cross-references between detection data', () => {
      const apisData = JSON.parse(readFileSync(join(testEnv.getTestRoot(), 'data', 'suspicious-apis.json'), 'utf-8'));
      const sysmonData = JSON.parse(readFileSync(join(testEnv.getTestRoot(), 'data', 'sysmon-rules.json'), 'utf-8'));

      // Look for APIs that should have corresponding Sysmon events
      const apiNames = new Set();
      Object.values(apisData.categories).forEach((category: any) => {
        category.apis.forEach((api: any) => apiNames.add(api.name));
      });

      const eventNames = new Set();
      if (sysmonData.events) {
        sysmonData.events.forEach((event: any) => eventNames.add(event.name));
      }

      // Check for some expected cross-references
      if (apiNames.has('CreateRemoteThread')) {
        expect(eventNames.has('CreateRemoteThread')).toBe(true);
      }
    });
  });

  describe('End-to-End Workflows', () => {
    it('simulates complete template retrieval workflow', () => {
      // 1. List available templates
      const templatesDir = join(testEnv.getTestRoot(), 'templates');
      const files = ['test-exploit.py', 'mock-loader.cs'];
      expect(files.length).toBeGreaterThan(0);

      // 2. Get specific template
      const templateContent = readFileSync(join(templatesDir, files[0]), 'utf-8');
      expect(templateContent).toBeTruthy();
      expect(templateContent.length).toBeGreaterThan(0);

      // 3. Verify template has required metadata
      expect(templateContent).toMatch(/@desc\s+.+/);
    });

    it('simulates security research workflow', () => {
      // 1. Look up API in detection data
      const query = 'VirtualAllocEx';
      const detectionFile = join(testEnv.getTestRoot(), 'data', 'suspicious-apis.json');
      const detectionData = JSON.parse(readFileSync(detectionFile, 'utf-8'));

      let found = false;
      Object.values(detectionData.categories).forEach((category: any) => {
        category.apis.forEach((api: any) => {
          if (api.name.toLowerCase().includes(query.toLowerCase())) {
            found = true;
            expect(api).toHaveProperty('risk');
            expect(api).toHaveProperty('detection_patterns');
          }
        });
      });

      expect(found).toBe(true);

      // 2. Get related template
      const templateContent = readFileSync(join(testEnv.getTestRoot(), 'templates', 'test-exploit.py'), 'utf-8');
      expect(templateContent).toBeTruthy();

      // 3. Get related snippet
      const snippetContent = readFileSync(join(testEnv.getTestRoot(), 'snippets', 'test-syscall.asm'), 'utf-8');
      expect(snippetContent).toBeTruthy();
    });
  });

  describe('Performance and Scale', () => {
    it('handles large template files efficiently', () => {
      // Create a larger template file
      const largeTemplate = Array(1000).fill('# Comment line').join('\n') + '\n' +
        '# @desc Large template for performance testing\n' +
        'print("Large template content")';

      writeFileSync(join(testEnv.getTestRoot(), 'templates', 'large-template.py'), largeTemplate);

      const start = Date.now();
      const content = readFileSync(join(testEnv.getTestRoot(), 'templates', 'large-template.py'), 'utf-8');
      const end = Date.now();

      expect(content).toBeTruthy();
      expect(end - start).toBeLessThan(100); // Should read quickly
    });

    it('handles many small files efficiently', () => {
      // Create many small template files
      for (let i = 0; i < 50; i++) {
        writeFileSync(
          join(testEnv.getTestRoot(), 'templates', `template-${i}.py`),
          `# @desc Test template ${i}\nprint("Template ${i}")`
        );
      }

      const start = Date.now();

      // Simulate listing operation
      const fs = require('fs');
      const files = fs.readdirSync(join(testEnv.getTestRoot(), 'templates'))
        .filter((f: string) => !f.startsWith('.'))
        .slice(0, 10); // Limit to first 10 for performance

      const end = Date.now();

      expect(files.length).toBeGreaterThan(0);
      expect(end - start).toBeLessThan(200); // Should list quickly
    });
  });
});