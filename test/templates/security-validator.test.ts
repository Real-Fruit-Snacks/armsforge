/**
 * Comprehensive tests for template security validation
 * Tests AST parsing, deep security analysis, and attack vector detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateSecurityValidator, SecurityLevel, ValidationResult } from '../../src/templates/security-validator.js';

describe('TemplateSecurityValidator', () => {
  let validator: TemplateSecurityValidator;

  beforeEach(() => {
    validator = new TemplateSecurityValidator();
  });

  describe('Placeholder Detection', () => {
    it('should detect dangerous placeholder patterns', () => {
      const content = `
        int offset = 0;
        char* ret_addr = 0x00000000;
        // TODO: Add shellcode here
        char placeholder_data[] = "CHANGE_ME";
        char* target = "<TARGET_IP>";
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.isSecure).toBe(false);
      expect(result.violations.length).toBeGreaterThan(4); // More violations detected due to improved patterns
      expect(result.violations.some(v => v.type === 'placeholder')).toBe(true);
    });

    it('should allow placeholders when configured', () => {
      validator.setSecurityLevel({
        level: 'basic',
        allowPlaceholders: true,
        enableSandboxing: false,
        checkObfuscation: false
      });

      const content = `
        int offset = 0;
        // TODO: Configure this
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.violations.filter(v => v.type === 'placeholder')).toHaveLength(0);
    });
  });

  describe('Sensitive Data Detection', () => {
    it('should detect hardcoded credentials', () => {
      const content = `
        const password = "MySecretPass123";
        const api_key = "sk-1234567890abcdef";
        const secret = "super_secret_token";
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.isSecure).toBe(false);
      expect(result.violations.some(v => v.type === 'hardcoded_sensitive')).toBe(true);
    });

    it('should detect hardcoded URLs and IPs', () => {
      const content = `
        const c2_server = "https://evil.com/beacon";
        const target_ip = "192.168.1.100";
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.isSecure).toBe(false);
      expect(result.violations.some(v => v.description.includes('Hardcoded URL'))).toBe(true);
      expect(result.violations.some(v => v.description.includes('IP address'))).toBe(true);
    });

    it('should detect cryptographic material', () => {
      const content = `
        const cert = "-----BEGIN PRIVATE KEY-----\\nMIIEvQ...\\n-----END PRIVATE KEY-----";
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.violations.some(v => v.description.includes('cryptographic material'))).toBe(true);
    });
  });

  describe('Dangerous API Detection', () => {
    it('should detect process injection APIs', () => {
      const content = `
        HANDLE proc = OpenProcess(PROCESS_ALL_ACCESS, FALSE, pid);
        LPVOID mem = VirtualAllocEx(proc, NULL, size, MEM_COMMIT, PAGE_EXECUTE_READWRITE);
        WriteProcessMemory(proc, mem, shellcode, size, NULL);
        CreateRemoteThread(proc, NULL, 0, mem, NULL, 0, NULL);
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.violations.filter(v => v.type === 'dangerous_api')).toHaveLength(3); // OpenProcess not in our patterns, only the 3 injection APIs
      expect(result.violations.some(v => v.severity === 'critical')).toBe(true);
    });

    it('should detect direct syscall usage', () => {
      const content = `
        NTSTATUS status = ZwAllocateVirtualMemory(proc, &addr, 0, &size, MEM_COMMIT, PAGE_EXECUTE_READWRITE);
        ZwWriteVirtualMemory(proc, addr, shellcode, size, NULL);
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.violations.some(v => v.description.includes('Direct syscall'))).toBe(true);
      expect(result.violations.some(v => v.severity === 'critical')).toBe(true);
    });

    it('should detect privilege escalation APIs', () => {
      const content = `
        HANDLE token;
        OpenProcessToken(GetCurrentProcess(), TOKEN_ALL_ACCESS, &token);
        AdjustTokenPrivileges(token, FALSE, &privs, 0, NULL, NULL);
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.violations.some(v => v.description.includes('Token manipulation'))).toBe(true);
    });

    it('should detect anti-debugging techniques', () => {
      const content = `
        if (IsDebuggerPresent()) exit(0);
        if (CheckRemoteDebuggerPresent(GetCurrentProcess(), &debug)) exit(0);
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.violations.some(v => v.description.includes('Anti-debugging'))).toBe(true);
    });
  });

  describe('Code Injection Detection', () => {
    it('should detect command injection patterns', () => {
      const content = `
        system("cmd.exe /c " + userInput + "");
        exec("rm -rf " + targetDir + "");
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.violations.some(v => v.type === 'code_injection')).toBe(true);
      expect(result.violations.some(v => v.severity === 'critical')).toBe(true);
    });

    it('should detect dynamic code execution', () => {
      const content = `
        eval("var result = " + userInput + ";");
        const func = new Function("return " + code);
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.violations.some(v => v.description.includes('Dynamic code execution'))).toBe(true);
    });

    it('should detect SQL injection patterns', () => {
      const content = `
        const query = "SELECT * FROM users WHERE id = " + userId + ";";
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.violations.some(v => v.description.includes('SQL injection'))).toBe(true);
    });
  });

  describe('Obfuscation Detection', () => {
    it('should detect string obfuscation', () => {
      const content = `
        const decoded = String.fromCharCode(0x48, 0x65, 0x6c, 0x6c, 0x6f);
        const payload = unescape("%48%65%6c%6c%6f");
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.violations.some(v => v.type === 'obfuscation_attempt')).toBe(true);
    });

    it('should detect base64 obfuscation', () => {
      const content = `
        const payload = atob("SGVsbG8gV29ybGQ=");
        const encoded = base64_decode(data);
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.violations.some(v => v.description.includes('Base64 obfuscation'))).toBe(true);
    });

    it('should detect XOR obfuscation', () => {
      const content = `
        for (int i = 0; i < len; i++) {
          data[i] = data[i] ^ 0xAA;
        }
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.violations.some(v => v.description.includes('XOR obfuscation'))).toBe(true);
    });
  });

  describe('Malicious Payload Detection', () => {
    it('should detect framework references', () => {
      const content = `
        // Using meterpreter for persistence
        const payload = meterpreter.generate();
        // Cobalt Strike beacon configuration
        const beacon_config = { ... };
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.violations.some(v => v.description.includes('Metasploit'))).toBe(true);
      expect(result.violations.some(v => v.description.includes('Cobalt Strike'))).toBe(true);
    });

    it('should detect system binary references', () => {
      const content = `
        const cmd = "cmd.exe /c whoami";
        exec("powershell.exe -Command Get-Process");
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.violations.some(v => v.description.includes('System binary reference'))).toBe(true);
    });
  });

  describe('Security Levels', () => {
    it('should apply different thresholds based on security level', () => {
      const content = `
        const password = "test123"; // One minor violation
      `;

      // Basic level should pass
      validator.setSecurityLevel({
        level: 'basic',
        allowPlaceholders: true,
        enableSandboxing: false,
        checkObfuscation: false
      });
      let result = validator.validateTemplate('test', content);
      expect(result.isSecure).toBe(true);

      // Strict level should fail
      validator.setSecurityLevel({
        level: 'strict',
        allowPlaceholders: false,
        enableSandboxing: true,
        checkObfuscation: true
      });
      result = validator.validateTemplate('test', content);
      expect(result.isSecure).toBe(false);
    });
  });

  describe('AST Analysis', () => {
    it('should detect dynamic function calls in strict mode', () => {
      validator.setSecurityLevel({
        level: 'strict',
        allowPlaceholders: true,
        enableSandboxing: true,
        checkObfuscation: true
      });

      const content = `
        function processInput(input) {
          eval(input); // Dangerous
        }
      `;

      const result = validator.validateTemplate('test', content);
      expect(result.violations.some(v => v.description.includes('Dynamic code execution with user input'))).toBe(true);
    });
  });

  describe('Security Scoring', () => {
    it('should calculate correct security scores', () => {
      // Clean template should score high
      const cleanContent = `
        function safeFunction() {
          console.log("Hello World");
        }
      `;
      let result = validator.validateTemplate('test', cleanContent);
      expect(result.score).toBeGreaterThan(90);

      // Template with violations should score lower
      const unsafeContent = `
        const password = "hardcoded123";
        system("rm -rf " + userInput + "");
        VirtualAllocEx(proc, NULL, size, MEM_COMMIT, PAGE_EXECUTE_READWRITE);
      `;
      result = validator.validateTemplate('test', unsafeContent);
      expect(result.score).toBeLessThan(70); // Adjusted for new scoring system
    });

    it('should give bonus points for complex secure templates', () => {
      const complexSecureContent = "safe_content ".repeat(200); // Long but secure content
      const result = validator.validateTemplate('test', complexSecureContent);
      expect(result.score).toBe(100); // Should get bonus points
    });
  });

  describe('Security Report Generation', () => {
    it('should generate comprehensive security reports', () => {
      const content = `
        const password = "secret123";
        VirtualAllocEx(proc, NULL, size, MEM_COMMIT, PAGE_EXECUTE_READWRITE);
        // TODO: Add more code
      `;

      const result = validator.validateTemplate('test', content);
      const report = validator.generateSecurityReport(result, 'test-template');

      expect(report).toContain('SECURITY VALIDATION REPORT');
      expect(report).toContain('Template: test-template');
      expect(report).toContain('Security Score:');
      expect(report).toContain('SECURITY ISSUES DETECTED');
      expect(report).toContain('HIGH SEVERITY');
      expect(report).toContain('MEDIUM SEVERITY');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const result = validator.validateTemplate('test', '');
      expect(result.isSecure).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.score).toBe(100);
    });

    it('should handle malformed content gracefully', () => {
      const content = `
        function incomplete(
        const malformed =
      `;

      expect(() => {
        validator.validateTemplate('test', content);
      }).not.toThrow();
    });

    it('should handle very large content', () => {
      const largeContent = "safe_content ".repeat(10000);
      const result = validator.validateTemplate('test', largeContent);
      expect(result.isSecure).toBe(true);
    });
  });

  describe('Configuration Updates', () => {
    it('should allow security level updates', () => {
      const newLevel: SecurityLevel = {
        level: 'strict',
        allowPlaceholders: false,
        enableSandboxing: true,
        checkObfuscation: true
      };

      validator.setSecurityLevel(newLevel);
      expect(validator['securityLevel']).toEqual(newLevel);
    });
  });
});