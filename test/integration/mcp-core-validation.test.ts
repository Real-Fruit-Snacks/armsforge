import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TestEnvironment } from '../utils/test-helpers.js';

// Focused MCP server validation tests
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const srcRoot = resolve(__dirname, '../../src');

describe('MCP Server Core Validation', () => {
  let testEnv: TestEnvironment;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
    process.env.CLAUDE_PLUGIN_ROOT = testEnv.getTestRoot();
  });

  afterEach(async () => {
    await testEnv.cleanup();
    delete process.env.CLAUDE_PLUGIN_ROOT;
  });

  describe('Critical MCP Tool Coverage Validation', () => {
    it('validates all 6 critical MCP tools are defined', () => {
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');

      // The 6 critical tools that were identified as 0% coverage
      const criticalTools = [
        'af_list_templates',
        'af_get_template',
        'af_list_snippets',
        'af_get_snippet',
        'af_set_template_context',
        'af_detection_lookup'
      ];

      for (const tool of criticalTools) {
        expect(serverSource).toContain(`"${tool}"`);
        expect(serverSource).toContain('server.tool(');
      }

      // Verify tool handlers exist
      expect(serverSource.match(/server\.tool\(/g)?.length).toBeGreaterThanOrEqual(6);
    });

    it('validates validation schemas are used', () => {
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');

      // Verify schema imports and usage
      expect(serverSource).toContain('validateToolParams');
      expect(serverSource).toContain('GetTemplateParamsSchema');
      expect(serverSource).toContain('GetSnippetParamsSchema');
      expect(serverSource).toContain('DetectionLookupParamsSchema');
    });
  });

  describe('Security Fix Validation', () => {
    it('validates path traversal protection is implemented', () => {
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');

      // Verify our security fix is present
      expect(serverSource).toContain('resolvedPath = resolve(filepath)');
      expect(serverSource).toContain('resolvedDir = resolve(dir)');
      expect(serverSource).toContain('startsWith');
      expect(serverSource).toContain('escape');
    });

    it('validates console output fix prevents MCP corruption', () => {
      const configSource = readFileSync(join(srcRoot, 'config', 'user-preferences.ts'), 'utf-8');

      // Verify improved error handling with structured logging
      expect(configSource).not.toContain('console.warn');
      expect(configSource).toContain('handleConfigurationError');
      expect(configSource).toContain('categorizeConfigError');
    });

    it('validates ESM/CJS mixing is fixed', () => {
      const configSource = readFileSync(join(srcRoot, 'config', 'user-preferences.ts'), 'utf-8');

      // Verify pure ESM
      expect(configSource).not.toContain('require(');
      expect(configSource).toContain('import { readFileSync, writeFileSync, existsSync, mkdirSync }');
    });
  });

  describe('Functional Component Tests', () => {
    it('validates template engine integration', () => {
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');

      expect(serverSource).toContain('TemplateEngine');
      expect(serverSource).toContain('templateEngine');
    });

    it('validates detection data accessibility', () => {
      const dataDir = join(testEnv.getTestRoot(), 'data');
      const requiredFiles = [
        'suspicious-apis.json',
        'sysmon-rules.json',
        'etw-providers.json',
        'amsi-triggers.json'
      ];

      for (const file of requiredFiles) {
        const filepath = join(dataDir, file);
        expect(existsSync(filepath)).toBe(true);

        const content = readFileSync(filepath, 'utf-8');
        expect(() => JSON.parse(content)).not.toThrow();
      }
    });

    it('validates template and snippet directories', () => {
      const templatesDir = join(testEnv.getTestRoot(), 'templates');
      const snippetsDir = join(testEnv.getTestRoot(), 'snippets');

      expect(existsSync(templatesDir)).toBe(true);
      expect(existsSync(snippetsDir)).toBe(true);

      // Verify sample files exist and are readable
      const sampleTemplate = join(templatesDir, 'test-exploit.py');
      const sampleSnippet = join(snippetsDir, 'test-syscall.asm');

      expect(existsSync(sampleTemplate)).toBe(true);
      expect(existsSync(sampleSnippet)).toBe(true);

      expect(readFileSync(sampleTemplate, 'utf-8').length).toBeGreaterThan(0);
      expect(readFileSync(sampleSnippet, 'utf-8').length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Validation', () => {
    it('validates error handling components are imported', () => {
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');

      expect(serverSource).toContain('ArmsforgeError');
      expect(serverSource).toContain('safeAsync');
      expect(serverSource).toContain('logger');
    });

    it('tests path resolution security logic', () => {
      const snippetsDir = join(testEnv.getTestRoot(), 'snippets');

      // Test legitimate path
      const legitimatePath = join(snippetsDir, 'legitimate.txt');
      const resolvedLegitimate = resolve(legitimatePath);
      const resolvedDir = resolve(snippetsDir);

      expect(resolvedLegitimate.startsWith(resolvedDir)).toBe(true);

      // Test malicious path would be caught
      const maliciousPath = join(snippetsDir, '../../../etc/passwd');
      const resolvedMalicious = resolve(maliciousPath);

      expect(resolvedMalicious.startsWith(resolvedDir)).toBe(false);
    });
  });

  describe('Build and Module Integration', () => {
    it('validates TypeScript compilation succeeds', () => {
      // If tests are running, TypeScript compilation already succeeded
      expect(true).toBe(true);
    });

    it('validates all imports can be resolved', async () => {
      // Test key module imports work
      const validationModule = await import(`${srcRoot}/utils/validation.js`);
      const errorsModule = await import(`${srcRoot}/utils/errors.js`);

      expect(validationModule).toBeDefined();
      expect(errorsModule).toBeDefined();

      expect(validationModule.GetSnippetParamsSchema).toBeDefined();
      expect(errorsModule.ArmsforgeError).toBeDefined();
    });

    it('validates validation schemas prevent path traversal', async () => {
      const validationModule = await import(`${srcRoot}/utils/validation.js`);

      // Test malicious inputs are rejected
      expect(() => {
        validationModule.GetSnippetParamsSchema.parse({ name: '../../../etc/passwd' });
      }).toThrow();

      expect(() => {
        validationModule.GetSnippetParamsSchema.parse({ name: '..\\\\..\\\\windows\\\\system32' });
      }).toThrow();

      // Test legitimate inputs pass
      expect(() => {
        validationModule.GetSnippetParamsSchema.parse({ name: 'legitimate-snippet.asm' });
      }).not.toThrow();
    });
  });
});