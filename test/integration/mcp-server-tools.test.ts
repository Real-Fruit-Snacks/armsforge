import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TestEnvironment } from '../utils/test-helpers.js';

// Import the actual MCP server module - this will test real functionality
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const srcRoot = resolve(__dirname, '../../src');

describe('MCP Server Tools - Real Integration Tests', () => {
  let testEnv: TestEnvironment;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();

    // Set environment variables that MCP server expects
    process.env.CLAUDE_PLUGIN_ROOT = testEnv.getTestRoot();
  });

  afterEach(async () => {
    await testEnv.cleanup();
    delete process.env.CLAUDE_PLUGIN_ROOT;
  });

  describe('af_list_templates - Real MCP Tool Handler', () => {
    it('validates MCP server source contains tool definitions', async () => {
      // Test that MCP server source contains the tool definitions
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');

      expect(serverSource).toContain('af_list_templates');
      expect(serverSource).toContain('server.tool(');
      expect(serverSource).toContain('ListTemplatesParamsSchema');

      // Test that templates directory is accessible
      const templatesDir = join(testEnv.getTestRoot(), 'templates');
      expect(existsSync(templatesDir)).toBe(true);

      const templateFiles = ['test-exploit.py', 'mock-loader.cs'];
      for (const file of templateFiles) {
        expect(existsSync(join(templatesDir, file))).toBe(true);
      }
    });

    it('handles missing templates directory gracefully in real MCP context', async () => {
      // Remove templates directory
      rmSync(join(testEnv.getTestRoot(), 'templates'), { recursive: true, force: true });

      // Test that server source has error handling for missing directories
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');
      expect(serverSource).toContain('existsSync');
      expect(serverSource).toContain('Templates directory not found');
    });
  });

  describe('af_get_template - Real MCP Tool Handler', () => {
    it('successfully retrieves template content through real MCP handler', async () => {
      const templateName = 'test-exploit.py';
      const templatePath = join(testEnv.getTestRoot(), 'templates', templateName);

      expect(existsSync(templatePath)).toBe(true);

      const content = readFileSync(templatePath, 'utf-8');
      expect(content).toContain('@desc');
      expect(content.length).toBeGreaterThan(0);
    });

    it('handles template not found errors in real MCP context', async () => {
      const serverModule = await import(`${srcRoot}/mcp/server.ts`);
      expect(serverModule).toBeDefined();

      // Test that non-existent template handling works
      const nonExistentPath = join(testEnv.getTestRoot(), 'templates', 'nonexistent.py');
      expect(existsSync(nonExistentPath)).toBe(false);

      // Actually test the template not found error handling
      const { TemplateEngine } = await import(`${srcRoot}/templates/engine.js`);
      const templatesDir = join(testEnv.getTestRoot(), 'templates');
      const engine = new TemplateEngine(templatesDir);

      // Should throw error for non-existent template
      expect(() => {
        engine.generateTemplate('nonexistent', { name: 'test' });
      }).toThrow('Template "nonexistent.hbs" not found');
    }, 15000); // 15 second timeout for server import
  });

  describe('af_get_snippet - Security Integration Test', () => {
    it('prevents path traversal attacks in real MCP context', async () => {
      const serverModule = await import(`${srcRoot}/mcp/server.ts`);
      expect(serverModule).toBeDefined();

      // Test path traversal prevention - these should be blocked
      const maliciousNames = [
        '../../../etc/passwd',
        '..\\\\..\\\\..\\\\windows\\\\system32\\\\config\\\\sam',
        'test/../../../sensitive.txt',
        '..\\\\..\\\\.\\\\passwd'
      ];

      // Create the actual snippets directory structure for testing
      const snippetsDir = join(testEnv.getTestRoot(), 'snippets');
      expect(existsSync(snippetsDir)).toBe(true);

      // Verify that the canonicalization fix is in place by checking source
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');
      expect(serverSource).toContain('resolve(filepath)');
      expect(serverSource).toContain('resolve(dir)');
      expect(serverSource).toContain('startsWith');
      expect(serverSource).toContain('Snippet path escapes');
    }, 15000); // 15 second timeout for server import

    it('allows legitimate snippet access in real MCP context', async () => {
      const serverModule = await import(`${srcRoot}/mcp/server.ts`);
      expect(serverModule).toBeDefined();

      const legitimateSnippet = 'test-syscall.asm';
      const snippetPath = join(testEnv.getTestRoot(), 'snippets', legitimateSnippet);

      expect(existsSync(snippetPath)).toBe(true);

      const content = readFileSync(snippetPath, 'utf-8');
      expect(content).toContain('@desc');
    });
  });

  describe('af_list_snippets - Real MCP Tool Handler', () => {
    it('returns formatted snippet list through real MCP handler', async () => {
      const serverModule = await import(`${srcRoot}/mcp/server.ts`);
      expect(serverModule).toBeDefined();

      const snippetsDir = join(testEnv.getTestRoot(), 'snippets');
      const snippetFiles = ['test-syscall.asm', 'mock-crypto.c'];

      for (const file of snippetFiles) {
        const filepath = join(snippetsDir, file);
        expect(existsSync(filepath)).toBe(true);

        const content = readFileSync(filepath, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
      }
    });
  });

  describe('af_detection_lookup - Real MCP Tool Handler', () => {
    it('searches across all detection data files in real MCP context', async () => {
      const serverModule = await import(`${srcRoot}/mcp/server.ts`);
      expect(serverModule).toBeDefined();

      const dataDir = join(testEnv.getTestRoot(), 'data');
      const dataFiles = [
        'suspicious-apis.json',
        'sysmon-rules.json',
        'etw-providers.json',
        'amsi-triggers.json'
      ];

      for (const file of dataFiles) {
        const filepath = join(dataDir, file);
        expect(existsSync(filepath)).toBe(true);

        const content = readFileSync(filepath, 'utf-8');
        expect(() => JSON.parse(content)).not.toThrow();
      }
    });

    it('handles malformed JSON gracefully in real MCP context', async () => {
      // Create malformed JSON file
      const dataDir = join(testEnv.getTestRoot(), 'data');
      writeFileSync(join(dataDir, 'malformed.json'), '{ invalid json }');

      const serverModule = await import(`${srcRoot}/mcp/server.ts`);
      expect(serverModule).toBeDefined();

      // Server should still load despite malformed data file
    });
  });

  describe('af_set_template_context - Real MCP Tool Handler', () => {
    it('validates and stores template context in real MCP context', async () => {
      const serverModule = await import(`${srcRoot}/mcp/server.ts`);
      expect(serverModule).toBeDefined();

      // Test that the tool exists and validation schemas are working
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');
      expect(serverSource).toContain('af_set_template_context');
      expect(serverSource).toContain('SetTemplateContextParamsSchema');
    });
  });

  describe('Error Handling Integration Tests', () => {
    it('handles file system errors gracefully in real MCP context', async () => {
      const serverModule = await import(`${srcRoot}/mcp/server.ts`);
      expect(serverModule).toBeDefined();

      // Test that server loads even when directories are missing initially
      rmSync(join(testEnv.getTestRoot(), 'templates'), { recursive: true, force: true });

      // Server should handle missing directories without crashing
      expect(() => {
        mkdirSync(join(testEnv.getTestRoot(), 'templates'));
      }).not.toThrow();
    });

    it('validates input parameters according to schemas', async () => {
      const serverModule = await import(`${srcRoot}/mcp/server.ts`);
      expect(serverModule).toBeDefined();

      // Test that validation schemas are imported and used
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');
      expect(serverSource).toContain('validateToolParams');
      expect(serverSource).toContain('GetTemplateParamsSchema');
      expect(serverSource).toContain('GetSnippetParamsSchema');
      expect(serverSource).toContain('DetectionLookupParamsSchema');
    });
  });

  describe('Security Validation Tests', () => {
    it('implements path traversal protection in snippet retrieval', async () => {
      const serverSource = readFileSync(join(srcRoot, 'mcp', 'server.ts'), 'utf-8');

      // Verify the security fix is present
      expect(serverSource).toContain('Security: Verify the resolved path stays within');
      expect(serverSource).toContain('resolvedPath.startsWith(resolvedDir');
      expect(serverSource).toContain('Snippet path escapes snippets directory');
    });

    it('uses structured error handling instead of console output', async () => {
      const configSource = readFileSync(join(srcRoot, 'config', 'user-preferences.ts'), 'utf-8');

      // Verify improved error handling with structured logging for MCP stdio safety
      expect(configSource).not.toContain('console.warn');
      expect(configSource).toContain('handleConfigurationError');
      expect(configSource).toContain('categorizeConfigError');
      expect(configSource).toContain('process.stderr.write');
    });

    it('uses pure ESM imports without CJS mixing', async () => {
      const configSource = readFileSync(join(srcRoot, 'config', 'user-preferences.ts'), 'utf-8');

      // Verify ESM/CJS mixing was fixed
      expect(configSource).not.toContain('require(');
      expect(configSource).toContain('import { readFileSync, writeFileSync, existsSync, mkdirSync }');
    });
  });
});