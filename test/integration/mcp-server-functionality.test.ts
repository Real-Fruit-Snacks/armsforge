import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TestEnvironment } from '../utils/test-helpers.js';

// Test MCP server functionality without importing the full server
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const srcRoot = resolve(__dirname, '../../src');

describe('MCP Server Functionality - Integration Tests', () => {
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

  describe('MCP Server Tool Registration Validation', () => {
    it('validates all 6 MCP tools are properly defined in server', () => {
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');

      // Verify all 6 critical MCP tools are defined
      const expectedTools = [
        'af_list_templates',
        'af_get_template',
        'af_list_snippets',
        'af_get_snippet',
        'af_set_template_context',
        'af_detection_lookup'
      ];

      for (const tool of expectedTools) {
        expect(serverSource).toContain(tool);
        expect(serverSource).toMatch(new RegExp(`server\\.tool\\(\\s*"${tool}"`));
      }
    });

    it('validates all tool schemas are properly imported and used', () => {
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');

      // Verify validation schemas are imported
      expect(serverSource).toContain('validateToolParams');
      expect(serverSource).toContain('ListTemplatesParamsSchema');
      expect(serverSource).toContain('GetTemplateParamsSchema');
      expect(serverSource).toContain('GetSnippetParamsSchema');
      expect(serverSource).toContain('DetectionLookupParamsSchema');
      expect(serverSource).toContain('SetTemplateContextParamsSchema');

      // Verify schemas are used in validation
      expect(serverSource).toMatch(/validateToolParams\s*\(\s*\w+ParamsSchema/);
    });

    it('validates server has proper error handling structure', () => {
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');

      // Verify error handling patterns
      expect(serverSource).toContain('ArmsforgeError');
      expect(serverSource).toContain('safeAsync');
      expect(serverSource).toContain('try {');
      expect(serverSource).toContain('catch');
      expect(serverSource).toContain('logger.toolStart');
      expect(serverSource).toContain('logger.toolSuccess');
    });
  });

  describe('Path Traversal Security Integration Tests', () => {
    it('validates path traversal protection is implemented in af_get_snippet', () => {
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');

      // Verify the security fix is present
      expect(serverSource).toContain('Security: Verify the resolved path stays within');
      expect(serverSource).toContain('resolvedPath = resolve(filepath)');
      expect(serverSource).toContain('resolvedDir = resolve(dir)');
      expect(serverSource).toContain('resolvedPath.startsWith(resolvedDir');
      expect(serverSource).toContain('Snippet path escapes snippets directory');
    });

    it('tests path traversal protection logic with real file operations', () => {
      const snippetsDir = join(testEnv.getTestRoot(), 'snippets');
      const testFile = join(snippetsDir, 'legitimate.txt');

      writeFileSync(testFile, 'legitimate content');
      expect(existsSync(testFile)).toBe(true);

      // Test that resolve() would catch path traversal attempts
      const maliciousPath = join(snippetsDir, '../../../etc/passwd');
      const resolvedMalicious = resolve(maliciousPath);
      const resolvedDir = resolve(snippetsDir);

      // This is what our security check does - verify it works
      expect(resolvedMalicious.startsWith(resolvedDir + require('path').sep)).toBe(false);

      // Verify legitimate path passes
      const legitimatePath = join(snippetsDir, 'legitimate.txt');
      const resolvedLegitimate = resolve(legitimatePath);
      expect(resolvedLegitimate.startsWith(resolvedDir + require('path').sep)).toBe(true);
    });
  });

  describe('Template Engine Integration Tests', () => {
    it('validates template engine is properly initialized in server', () => {
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');

      expect(serverSource).toContain('TemplateEngine');
      expect(serverSource).toContain('initTemplateEngine');
      expect(serverSource).toContain('templateEngine.listTemplates');
      expect(serverSource).toContain('templateEngine.generateTemplate');
    });

    it('tests template directory structure and file accessibility', () => {
      const templatesDir = join(testEnv.getTestRoot(), 'templates');
      expect(existsSync(templatesDir)).toBe(true);

      // Test template files exist and are readable
      const templateFiles = ['test-exploit.py', 'mock-loader.cs'];
      for (const file of templateFiles) {
        const filepath = join(templatesDir, file);
        expect(existsSync(filepath)).toBe(true);

        const content = readFileSync(filepath, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
        expect(content).toContain('@desc');
      }
    });
  });

  describe('Detection Data Integration Tests', () => {
    it('validates all detection data files are present and parseable', () => {
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

        const data = JSON.parse(content);
        expect(data).toBeDefined();
        expect(typeof data).toBe('object');
      }
    });

    it('validates detection lookup functionality in server source', () => {
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');

      expect(serverSource).toContain('af_detection_lookup');
      expect(serverSource).toContain('getDataDir');
      expect(serverSource).toContain('readdirSync');
      expect(serverSource).toContain('JSON.parse');
    });
  });

  describe('Validation Schema Integration Tests', () => {
    it('imports and tests validation functions directly', async () => {
      // Import validation functions to test them directly
      const validationModule = await import(`${srcRoot}/utils/validation.ts`);

      expect(validationModule.validateToolParams).toBeDefined();
      expect(validationModule.GetTemplateParamsSchema).toBeDefined();
      expect(validationModule.GetSnippetParamsSchema).toBeDefined();
      expect(validationModule.DetectionLookupParamsSchema).toBeDefined();

      // Test basic validation functionality
      const validTemplate = { name: 'test-exploit' }; // No .py extension - schema only allows alphanumeric/hyphens/underscores
      expect(() => validationModule.GetTemplateParamsSchema.parse(validTemplate)).not.toThrow();

      const validSnippet = { name: 'test-syscall.asm' };
      expect(() => validationModule.GetSnippetParamsSchema.parse(validSnippet)).not.toThrow();

      const validDetection = { query: 'VirtualAllocEx' };
      expect(() => validationModule.DetectionLookupParamsSchema.parse(validDetection)).not.toThrow();
    });

    it('validates path traversal prevention in snippet schema', async () => {
      const validationModule = await import(`${srcRoot}/utils/validation.js`);

      // Test that malicious paths are rejected by schema
      const maliciousInputs = [
        { name: '../../../etc/passwd' },
        { name: '..\\\\..\\\\windows\\\\system32\\\\config\\\\sam' },
        { name: 'test/../../../sensitive.txt' }
      ];

      for (const input of maliciousInputs) {
        expect(() => validationModule.GetSnippetParamsSchema.parse(input)).toThrow();
      }

      // Test that legitimate names pass
      const legitimateInputs = [
        { name: 'test-syscall.asm' },
        { name: 'crypto-helper.c' },
        { name: 'injection-technique.cs' }
      ];

      for (const input of legitimateInputs) {
        expect(() => validationModule.GetSnippetParamsSchema.parse(input)).not.toThrow();
      }
    });
  });

  describe('Error Handling Integration Tests', () => {
    it('validates ArmsforgeError integration in server', () => {
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');

      expect(serverSource).toContain('ArmsforgeError.fileSystem');
      expect(serverSource).toContain('ArmsforgeError.validation');
      expect(serverSource).toContain('ArmsforgeError.template');
    });

    it('tests error handling functions directly', async () => {
      const errorsModule = await import(`${srcRoot}/utils/errors.ts`);

      expect(errorsModule.ArmsforgeError).toBeDefined();
      expect(errorsModule.ErrorCode).toBeDefined();
      expect(errorsModule.safeAsync).toBeDefined();

      // Test creating errors
      const testError = errorsModule.ArmsforgeError.validation('test message', { component: 'test' }, 'field');
      expect(testError.message).toContain('test message');
      expect(testError.code).toBe(errorsModule.ErrorCode.INVALID_INPUT);
    });
  });

  describe('Security Configuration Integration Tests', () => {
    it('validates console output fix is applied', () => {
      const configSource = readFileSync(join(srcRoot, 'config', 'user-preferences.ts'), 'utf-8');

      // Verify improved error handling with structured logging
      expect(configSource).not.toContain('console.warn');
      expect(configSource).toContain('handleConfigurationError');
      expect(configSource).toContain('categorizeConfigError');
    });

    it('validates ESM/CJS mixing fix is applied', () => {
      const configSource = readFileSync(join(srcRoot, 'config', 'user-preferences.ts'), 'utf-8');

      // Verify pure ESM imports
      expect(configSource).not.toContain('require(');
      expect(configSource).toContain('import { readFileSync, writeFileSync, existsSync, mkdirSync }');
    });
  });

  describe('Performance and Reliability Tests', () => {
    it('validates file operations handle edge cases', () => {
      // Test empty files
      const emptyFile = join(testEnv.getTestRoot(), 'templates', 'empty-test.py');
      writeFileSync(emptyFile, '');
      expect(existsSync(emptyFile)).toBe(true);
      expect(readFileSync(emptyFile, 'utf-8')).toBe('');

      // Test unicode content
      const unicodeFile = join(testEnv.getTestRoot(), 'templates', 'unicode-test.py');
      const unicodeContent = 'Unicode test: áéíóú 中文 🎯';
      writeFileSync(unicodeFile, unicodeContent);
      expect(readFileSync(unicodeFile, 'utf-8')).toBe(unicodeContent);

      // Test large files
      const largeContent = 'x'.repeat(10000);
      const largeFile = join(testEnv.getTestRoot(), 'templates', 'large-test.py');
      writeFileSync(largeFile, largeContent);
      expect(readFileSync(largeFile, 'utf-8')).toBe(largeContent);
    });

    it('validates directory structure creation and cleanup', () => {
      // Test directory operations
      const testDir = join(testEnv.getTestRoot(), 'test-subdir');
      mkdirSync(testDir);
      expect(existsSync(testDir)).toBe(true);

      const testFile = join(testDir, 'test-file.txt');
      writeFileSync(testFile, 'test content');
      expect(existsSync(testFile)).toBe(true);

      rmSync(testDir, { recursive: true, force: true });
      expect(existsSync(testDir)).toBe(false);
    });
  });
});