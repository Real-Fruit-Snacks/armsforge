/**
 * Integration tests for TemplateEngine with security validation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { TemplateEngine } from '../../src/templates/engine.js';
import { TemplateContext } from '../../src/templates/context.js';
import { ArmsforgeError, ErrorCode } from '../../src/utils/errors.js';

describe('TemplateEngine Security Integration', () => {
  let engine: TemplateEngine;
  let tempDir: string;
  let context: TemplateContext;

  beforeEach(() => {
    tempDir = join(process.cwd(), 'test-templates-' + Date.now());
    mkdirSync(tempDir, { recursive: true });

    engine = new TemplateEngine(tempDir, {
      level: 'intermediate',
      allowPlaceholders: false,
      enableSandboxing: true,
      checkObfuscation: true
    });

    context = {
      target_arch: 'x64',
      target_os: 'windows',
      evasion_level: 2,
      payload_format: 'exe',
      language: 'c'
    };
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Template Generation with Security Validation', () => {
    it('should generate secure templates successfully', () => {
      const templateContent = `
// {{!-- @desc Secure template example --}}
#include <stdio.h>

{{#ifArch "x64"}}
// 64-bit specific code
typedef unsigned long long QWORD;
{{/ifArch}}

{{#ifOS "windows"}}
#include <windows.h>
{{/ifOS}}

int main() {
    printf("Hello from {{language}} on {{target_os}} {{target_arch}}\\n");

    {{#ifEvasionLevel 2}}
    // Add intermediate evasion techniques
    Sleep({{randomSleep}});
    {{/ifEvasionLevel}}

    return 0;
}
      `;

      writeFileSync(join(tempDir, 'secure-template.hbs'), templateContent);

      const result = engine.generateTemplate('secure-template', context);
      expect(result).toContain('Hello from c on windows x64');
      expect(result).toContain('#include <windows.h>');
      expect(result).toContain('typedef unsigned long long QWORD');
    });

    it('should reject templates with hardcoded credentials', () => {
      const templateContent = `
#include <stdio.h>

int main() {
    const char* password = "MySecretPassword123";
    const char* api_key = "sk-1234567890abcdef";
    printf("Connecting with credentials\\n");
    return 0;
}
      `;

      writeFileSync(join(tempDir, 'unsafe-creds.hbs'), templateContent);

      expect(() => {
        engine.generateTemplate('unsafe-creds', context);
      }).toThrow(ArmsforgeError);
    });

    it('should reject templates with dangerous API sequences', () => {
      const templateContent = `
#include <windows.h>

int inject_payload() {
    HANDLE proc = OpenProcess(PROCESS_ALL_ACCESS, FALSE, 1234);
    LPVOID mem = VirtualAllocEx(proc, NULL, 1024, MEM_COMMIT, PAGE_EXECUTE_READWRITE);
    WriteProcessMemory(proc, mem, shellcode, 1024, NULL);
    CreateRemoteThread(proc, NULL, 0, (LPTHREAD_START_ROUTINE)mem, NULL, 0, NULL);
    return 0;
}
      `;

      writeFileSync(join(tempDir, 'process-injection.hbs'), templateContent);

      expect(() => {
        engine.generateTemplate('process-injection', context);
      }).toThrow(ArmsforgeError);
    });

    it('should reject templates with placeholder violations', () => {
      const templateContent = `
#include <stdio.h>

int main() {
    int offset = 0; // TODO: Calculate buffer offset
    char* target_ip = "<TARGET_IP>";
    char shellcode[] = ""; // CHANGE_ME: Add your shellcode
    return 0;
}
      `;

      writeFileSync(join(tempDir, 'placeholders.hbs'), templateContent);

      expect(() => {
        engine.generateTemplate('placeholders', context);
      }).toThrow(ArmsforgeError);

      // Should succeed with placeholders allowed
      const result = engine.generateTemplate('placeholders', context, { allowPlaceholders: true });
      expect(result).toContain('TODO: Calculate buffer offset');
    });

    it('should allow bypass with skipValidation option', () => {
      const templateContent = `
#include <windows.h>

int main() {
    const char* password = "hardcoded123";
    VirtualAllocEx(NULL, NULL, 1024, MEM_COMMIT, PAGE_EXECUTE_READWRITE);
    return 0;
}
      `;

      writeFileSync(join(tempDir, 'bypass-validation.hbs'), templateContent);

      // Should fail with validation
      expect(() => {
        engine.generateTemplate('bypass-validation', context);
      }).toThrow();

      // Should succeed with validation skipped
      const result = engine.generateTemplate('bypass-validation', context, { skipValidation: true });
      expect(result).toContain('const char* password = "hardcoded123"');
    });
  });

  describe('Security Level Configuration', () => {
    it('should apply different security levels correctly', () => {
      const templateContent = `
#include <stdio.h>

int main() {
    const char* password = "test123"; // Minor violation
    return 0;
}
      `;

      writeFileSync(join(tempDir, 'security-levels.hbs'), templateContent);

      // Should pass with basic security level
      const result1 = engine.generateTemplate('security-levels', context, {
        securityLevel: {
          level: 'basic',
          allowPlaceholders: true,
          enableSandboxing: false,
          checkObfuscation: false
        }
      });
      expect(result1).toContain('const char* password = "test123"');

      // Should fail with strict security level
      expect(() => {
        engine.generateTemplate('security-levels', context, {
          securityLevel: {
            level: 'strict',
            allowPlaceholders: false,
            enableSandboxing: true,
            checkObfuscation: true
          }
        });
      }).toThrow();
    });
  });

  describe('Security Reporting', () => {
    it('should generate detailed security reports', () => {
      const templateContent = `
#include <windows.h>

int main() {
    const char* password = "secret123";
    HANDLE proc = OpenProcess(PROCESS_ALL_ACCESS, FALSE, 1234);
    // TODO: Add more functionality
    return 0;
}
      `;

      const report = engine.generateSecurityReport('test-template', templateContent);
      expect(report).toContain('SECURITY VALIDATION REPORT');
      expect(report).toContain('Template: test-template');
      expect(report).toContain('Security Score:');
      expect(report).toContain('HIGH SEVERITY');
      expect(report).toContain('MEDIUM SEVERITY');
    });

    it('should validate template security separately', () => {
      const templateContent = `
#include <stdio.h>
int main() { return 0; }
      `;

      const result = engine.validateTemplateSecurity('test', templateContent);
      expect(result.isSecure).toBe(true);
      expect(result.score).toBeGreaterThan(90);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Template Caching with Security', () => {
    it('should cache templates and maintain security validation', () => {
      const templateContent = `
#include <stdio.h>
int main() {
    printf("Test {{language}}\\n");
    return 0;
}
      `;

      writeFileSync(join(tempDir, 'cached-template.hbs'), templateContent);

      // First generation - should compile and cache
      const result1 = engine.generateTemplate('cached-template', context);
      expect(result1).toContain('Test c');

      // Second generation - should use cache and still validate
      const result2 = engine.generateTemplate('cached-template', context);
      expect(result2).toEqual(result1);

      // Cache stats should show cached template
      const stats = engine.getCacheStats();
      expect(stats.size).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should throw appropriate errors for missing templates', () => {
      expect(() => {
        engine.generateTemplate('nonexistent', context);
      }).toThrow('Template "nonexistent.hbs" not found');
    });

    it('should handle compilation errors gracefully', () => {
      const templateContent = '{{#each items}}{{#if}}{{/each}}'; // Malformed handlebars
      writeFileSync(join(tempDir, 'compilation-error.hbs'), templateContent);

      expect(() => {
        engine.generateTemplate('compilation-error', context, { skipValidation: true });
      }).toThrow(); // Should throw due to malformed handlebars template
    });

    it('should provide detailed error messages for security violations', () => {
      const templateContent = `
const password = "hardcoded123";
VirtualAllocEx(proc, NULL, size, MEM_COMMIT, PAGE_EXECUTE_READWRITE);
      `;

      writeFileSync(join(tempDir, 'security-error.hbs'), templateContent);

      try {
        engine.generateTemplate('security-error', context);
        fail('Should have thrown security error');
      } catch (error) {
        expect(error).toBeInstanceOf(ArmsforgeError);
        expect(error.code).toBe(ErrorCode.TEMPLATE_GENERATION_ERROR);
        expect(error.message).toContain('failed security validation');
      }
    });
  });

  describe('Security Level Management', () => {
    it('should update security levels dynamically', () => {
      const newLevel = {
        level: 'strict' as const,
        allowPlaceholders: false,
        enableSandboxing: true,
        checkObfuscation: true
      };

      engine.setSecurityLevel(newLevel);
      const currentLevel = engine.getSecurityLevel();
      expect(currentLevel).toEqual(newLevel);
    });
  });

  describe('Handlebars Helpers Integration', () => {
    it('should work with all custom helpers', () => {
      const templateContent = `
{{#ifArch "x64"}}64-bit code{{/ifArch}}
{{#ifOS "windows"}}Windows code{{/ifOS}}
{{#ifLang "c"}}C language code{{/ifLang}}
{{#ifEvasionLevel 2}}Evasion level 2+{{/ifEvasionLevel}}
{{#ifPayloadFormat "exe"}}Executable format{{/ifPayloadFormat}}
Random var: {{randomVar}}
Random sleep: {{randomSleep}}ms
      `;

      writeFileSync(join(tempDir, 'helpers-test.hbs'), templateContent);

      const result = engine.generateTemplate('helpers-test', context);
      expect(result).toContain('64-bit code');
      expect(result).toContain('Windows code');
      expect(result).toContain('C language code');
      expect(result).toContain('Evasion level 2+');
      expect(result).toContain('Executable format');
      expect(result).toMatch(/Random var: \w+\d+/);
      expect(result).toMatch(/Random sleep: \d+ms/);
    });
  });
});