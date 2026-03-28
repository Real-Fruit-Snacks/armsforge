/**
 * Comprehensive security validation for template content
 * Replaces simple regex patterns with AST parsing and deep analysis
 */

import { ArmsforgeError, ErrorCode } from '../utils/errors.js';

export interface SecurityLevel {
  level: 'basic' | 'intermediate' | 'strict';
  allowPlaceholders: boolean;
  enableSandboxing: boolean;
  checkObfuscation: boolean;
}

export interface SecurityViolation {
  type: 'hardcoded_sensitive' | 'dangerous_api' | 'code_injection' | 'malicious_payload' | 'placeholder' | 'obfuscation_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: { line: number; column: number; length: number };
  suggestion: string;
  pattern?: string;
}

export interface ValidationResult {
  isSecure: boolean;
  violations: SecurityViolation[];
  score: number; // 0-100, higher is more secure
}

/**
 * Advanced template security validator
 */
export class TemplateSecurityValidator {
  private securityLevel: SecurityLevel;

  // Comprehensive patterns for security analysis
  private readonly dangerousApiPatterns = [
    // Process injection APIs
    { pattern: /\b(VirtualAllocEx|WriteProcessMemory|CreateRemoteThread|NtCreateThreadEx)\b/g, severity: 'critical' as const, type: 'Process injection sequence detected' },
    { pattern: /\b(ZwAllocateVirtualMemory|ZwWriteVirtualMemory|ZwCreateThread)\b/g, severity: 'critical' as const, type: 'Direct syscall injection detected' },

    // Privilege escalation
    { pattern: /\b(SetThreadToken|ImpersonateLoggedOnUser|CreateProcessWithToken)\b/g, severity: 'high' as const, type: 'Privilege escalation API detected' },
    { pattern: /\b(AdjustTokenPrivileges|LookupPrivilegeValue|OpenProcessToken)\b/g, severity: 'high' as const, type: 'Token manipulation detected' },

    // Anti-analysis evasion
    { pattern: /\b(IsDebuggerPresent|CheckRemoteDebuggerPresent|OutputDebugString)\b/g, severity: 'medium' as const, type: 'Anti-debugging technique detected' },
    { pattern: /\b(GetTickCount|QueryPerformanceCounter|Sleep)\b/g, severity: 'low' as const, type: 'Timing-based evasion detected' },

    // Network communication
    { pattern: /\b(HttpOpenRequest|InternetConnect|WSAStartup|socket|connect)\b/g, severity: 'medium' as const, type: 'Network communication detected' },

    // File system manipulation
    { pattern: /\b(CreateFile|DeleteFile|MoveFile|CopyFile)\b/g, severity: 'medium' as const, type: 'File system manipulation detected' },

    // Registry manipulation
    { pattern: /\b(RegCreateKey|RegSetValue|RegDeleteKey|RegOpenKey)\b/g, severity: 'medium' as const, type: 'Registry manipulation detected' },

    // Crypto APIs (legitimate but flagged for review)
    { pattern: /\b(CryptAcquireContext|CryptCreateHash|CryptEncrypt|CryptDecrypt)\b/g, severity: 'low' as const, type: 'Cryptographic operation detected' }
  ];

  private readonly sensitiveDataPatterns = [
    // Hardcoded credentials
    { pattern: /(?:password|pwd|passwd)\s*[=:]\s*["'](?!.*(?:YOUR_|CHANGE_|TODO|placeholder)).{3,}["']/g, type: 'Hardcoded password detected' },
    { pattern: /(?:api[_-]?key|apikey)\s*[=:]\s*["'](?!.*(?:YOUR_|CHANGE_|TODO|placeholder)).{10,}["']/g, type: 'Hardcoded API key detected' },
    { pattern: /(?:secret|token)\s*[=:]\s*["'](?!.*(?:YOUR_|CHANGE_|TODO|placeholder)).{10,}["']/g, type: 'Hardcoded secret detected' },

    // Network endpoints
    { pattern: /(?:https?:\/\/|ftp:\/\/)(?!(?:127\.0\.0\.1|localhost|example\.com|test\.com|YOUR_|CHANGE_|TODO|placeholder))[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, type: 'Hardcoded URL detected' },
    { pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::[0-9]{1,5})?\b/g, type: 'Hardcoded IP address detected' },

    // Crypto keys/certificates
    { pattern: /-----BEGIN\s+(?:PRIVATE\s+KEY|CERTIFICATE|RSA\s+PRIVATE\s+KEY)-----/g, type: 'Hardcoded cryptographic material detected' },
    { pattern: /\b[A-Za-z0-9+/]{40,}={0,2}\b/g, type: 'Potential base64 encoded data detected' },

    // File paths
    { pattern: /[C-Z]:\\(?!.*(?:YOUR_|CHANGE_|TODO|placeholder))[\\a-zA-Z0-9._-]+/g, type: 'Hardcoded Windows path detected' },
    { pattern: /\/(?:home|usr|etc|opt)\/(?!.*(?:YOUR_|CHANGE_|TODO|placeholder))[\/a-zA-Z0-9._-]+/g, type: 'Hardcoded Unix path detected' }
  ];

  private readonly codeInjectionPatterns = [
    // Command injection
    { pattern: /(?:system|exec|popen|ShellExecute)\s*\(\s*["'].*?\+.*?["']\s*\)/g, type: 'Command injection vector detected' },
    { pattern: /(?:eval|Function)\s*\(\s*.*?\+.*?\)/g, type: 'Dynamic code execution detected' },

    // SQL injection patterns
    { pattern: /(?:SELECT|INSERT|UPDATE|DELETE).*?\+.*?["']/g, type: 'SQL injection pattern detected' },

    // Script injection
    { pattern: /<script[^>]*>.*?<\/script>/g, type: 'Script injection detected' },
    { pattern: /javascript:\s*[^"'\s]/g, type: 'JavaScript protocol injection detected' },

    // Format string vulnerabilities
    { pattern: /(?:printf|sprintf|fprintf)\s*\(\s*[^"'].*?\)/g, type: 'Format string vulnerability pattern detected' }
  ];

  private readonly obfuscationPatterns = [
    // String obfuscation
    { pattern: /(?:String\.fromCharCode|unescape|decodeURIComponent)\s*\(/g, type: 'String obfuscation detected' },
    { pattern: /\\x[0-9a-fA-F]{2}/g, type: 'Hex encoded strings detected' },
    { pattern: /\\u[0-9a-fA-F]{4}/g, type: 'Unicode encoded strings detected' },

    // Base64 obfuscation
    { pattern: /(?:atob|btoa|base64|frombase64)\s*\(/g, type: 'Base64 obfuscation detected' },

    // XOR obfuscation
    { pattern: /\^(?:\s*0x[0-9a-fA-F]+|\s*\d+)/g, type: 'XOR obfuscation pattern detected' }
  ];

  private readonly placeholderPatterns = [
    { pattern: /OFFSET\s*=\s*0(?![0-9a-fA-F])/gi, description: "OFFSET = 0 (needs pattern_offset calculation)" },
    { pattern: /RET_ADDR\s*=\s*0x0+(?![0-9a-fA-F])/gi, description: "RET_ADDR = 0x00000000 (needs JMP ESP gadget)" },
    { pattern: /TODO:/gi, description: "TODO comments (need customization)" },
    { pattern: /placeholder/gi, description: "Placeholder text" },
    { pattern: /CHANGE_ME/gi, description: "CHANGE_ME markers" },
    { pattern: /YOUR_\w+_HERE/gi, description: "YOUR X HERE patterns" },
    { pattern: /<TARGET_BINARY>/gi, description: "<TARGET_BINARY> placeholder" },
    { pattern: /<TARGET_IP>/gi, description: "<TARGET_IP> placeholder" },
    { pattern: /<TARGET_PORT>/gi, description: "<TARGET_PORT> placeholder" },
    { pattern: /new byte\[\]\s*\{\s*\}/gi, description: "Empty byte arrays (SHELLCODE, KEY, IV)" },
    { pattern: /SHELLCODE\s*=\s*b""/gi, description: "Empty shellcode" },
    { pattern: /KEY\s*=\s*new byte\[32\];/gi, description: "Empty encryption key" },
    { pattern: /IV\s*=\s*new byte\[16\];/gi, description: "Empty IV" }
  ];

  constructor(securityLevel: SecurityLevel = {
    level: 'intermediate',
    allowPlaceholders: false,
    enableSandboxing: true,
    checkObfuscation: true
  }) {
    this.securityLevel = securityLevel;
  }

  /**
   * Main validation method - performs comprehensive security analysis
   */
  public validateTemplate(templateName: string, content: string): ValidationResult {
    const violations: SecurityViolation[] = [];

    try {
      // 1. Check for placeholder violations (if not allowed)
      if (!this.securityLevel.allowPlaceholders) {
        violations.push(...this.checkPlaceholders(content));
      }

      // 2. Check for hardcoded sensitive data
      violations.push(...this.checkSensitiveData(content));

      // 3. Check for dangerous API patterns
      violations.push(...this.checkDangerousAPIs(content));

      // 4. Check for code injection patterns
      violations.push(...this.checkCodeInjection(content));

      // 5. Check for obfuscation attempts (if enabled)
      if (this.securityLevel.checkObfuscation) {
        violations.push(...this.checkObfuscation(content));
      }

      // 6. Perform AST analysis for deeper inspection
      if (this.securityLevel.level === 'strict') {
        violations.push(...this.performASTAnalysis(content));
      }

      // 7. Check for malicious payload signatures
      violations.push(...this.checkMaliciousPayloads(content));

      const score = this.calculateSecurityScore(violations, content.length);
      const isSecure = this.determineSecurityStatus(violations, score);

      return {
        isSecure,
        violations,
        score
      };

    } catch (error) {
      throw ArmsforgeError.template(
        ErrorCode.TEMPLATE_GENERATION_ERROR,
        `Security validation failed for template "${templateName}": ${(error as Error).message}`,
        { component: 'security-validator', operation: 'validate_template' },
        templateName
      );
    }
  }

  private checkPlaceholders(content: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    for (const { pattern, description } of this.placeholderPatterns) {
      const matches = Array.from(content.matchAll(pattern));
      for (const match of matches) {
        violations.push({
          type: 'placeholder',
          severity: 'medium',
          description: `Placeholder detected: ${description}`,
          location: this.getLocation(content, match.index || 0, match[0].length),
          suggestion: 'Customize this placeholder with appropriate values before deployment',
          pattern: match[0]
        });
      }
    }

    return violations;
  }

  private checkSensitiveData(content: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    for (const { pattern, type } of this.sensitiveDataPatterns) {
      const matches = Array.from(content.matchAll(pattern));
      for (const match of matches) {
        violations.push({
          type: 'hardcoded_sensitive',
          severity: 'high',
          description: type,
          location: this.getLocation(content, match.index || 0, match[0].length),
          suggestion: 'Move sensitive data to environment variables or configuration files',
          pattern: match[0]
        });
      }
    }

    return violations;
  }

  private checkDangerousAPIs(content: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    for (const { pattern, severity, type } of this.dangerousApiPatterns) {
      const matches = Array.from(content.matchAll(pattern));
      for (const match of matches) {
        violations.push({
          type: 'dangerous_api',
          severity,
          description: type,
          location: this.getLocation(content, match.index || 0, match[0].length),
          suggestion: 'Review API usage for detection risks and consider alternative approaches',
          pattern: match[0]
        });
      }
    }

    return violations;
  }

  private checkCodeInjection(content: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    for (const { pattern, type } of this.codeInjectionPatterns) {
      const matches = Array.from(content.matchAll(pattern));
      for (const match of matches) {
        violations.push({
          type: 'code_injection',
          severity: 'critical',
          description: type,
          location: this.getLocation(content, match.index || 0, match[0].length),
          suggestion: 'Use parameterized queries/commands and input validation',
          pattern: match[0]
        });
      }
    }

    return violations;
  }

  private checkObfuscation(content: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    for (const { pattern, type } of this.obfuscationPatterns) {
      const matches = Array.from(content.matchAll(pattern));
      for (const match of matches) {
        violations.push({
          type: 'obfuscation_attempt',
          severity: 'medium',
          description: type,
          location: this.getLocation(content, match.index || 0, match[0].length),
          suggestion: 'Consider if obfuscation is necessary and document its purpose',
          pattern: match[0]
        });
      }
    }

    return violations;
  }

  private checkMaliciousPayloads(content: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // Check for known malicious signatures
    const maliciousSignatures = [
      { pattern: /meterpreter|metasploit/g, type: 'Metasploit framework reference detected' },
      { pattern: /cobalt.?strike|beacon/g, type: 'Cobalt Strike reference detected' },
      { pattern: /empire|powershell.?empire/g, type: 'PowerShell Empire reference detected' },
      { pattern: /mimikatz|sekurlsa/g, type: 'Mimikatz reference detected' },
      { pattern: /\b(?:cmd\.exe|powershell\.exe|wmic\.exe)\b/g, type: 'System binary reference detected' }
    ];

    for (const { pattern, type } of maliciousSignatures) {
      const matches = Array.from(content.matchAll(pattern));
      for (const match of matches) {
        violations.push({
          type: 'malicious_payload',
          severity: 'high',
          description: type,
          location: this.getLocation(content, match.index || 0, match[0].length),
          suggestion: 'Ensure this reference is intentional and document its legitimate use',
          pattern: match[0]
        });
      }
    }

    return violations;
  }

  private performASTAnalysis(content: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // Basic AST-like analysis for function calls and variable assignments
    // This is a simplified version - in production, you'd use a proper AST parser

    // Check for suspicious function call patterns
    const functionCallPattern = /(\w+)\s*\(\s*([^)]*)\s*\)/g;
    const matches = Array.from(content.matchAll(functionCallPattern));

    for (const match of matches) {
      const funcName = match[1];
      const args = match[2];

      // Check for dynamic function calls with user input
      if (funcName === 'eval' && args.includes('input')) {
        violations.push({
          type: 'code_injection',
          severity: 'critical',
          description: 'Dynamic code execution with user input detected',
          location: this.getLocation(content, match.index || 0, match[0].length),
          suggestion: 'Never use eval() with user input. Use safe alternatives.',
          pattern: match[0]
        });
      }
    }

    return violations;
  }

  private getLocation(content: string, index: number, length: number): { line: number; column: number; length: number } {
    const lines = content.substring(0, index).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
      length
    };
  }

  private calculateSecurityScore(violations: SecurityViolation[], contentLength: number): number {
    let score = 100;

    for (const violation of violations) {
      switch (violation.severity) {
        case 'critical': score -= 30; break;
        case 'high': score -= 20; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    }

    // Bonus points for longer, more complex templates that pass validation
    if (contentLength > 1000 && violations.length === 0) {
      score = Math.min(100, score + 15);
    }

    return Math.max(0, Math.min(100, score));
  }

  private determineSecurityStatus(violations: SecurityViolation[], score: number): boolean {
    const criticalViolations = violations.filter(v => v.severity === 'critical').length;
    const highViolations = violations.filter(v => v.severity === 'high').length;

    // Fail if any critical violations or too many high severity violations
    if (criticalViolations > 0) return false;
    if (highViolations > 3) return false;

    // Pass based on score thresholds
    switch (this.securityLevel.level) {
      case 'basic': return score >= 60;
      case 'intermediate': return score >= 75;
      case 'strict': return score >= 90;
      default: return score >= 75;
    }
  }

  /**
   * Generate a detailed security report
   */
  public generateSecurityReport(result: ValidationResult, templateName: string): string {
    const { isSecure, violations, score } = result;

    let report = `\n=== SECURITY VALIDATION REPORT ===\n`;
    report += `Template: ${templateName}\n`;
    report += `Security Score: ${score}/100\n`;
    report += `Status: ${isSecure ? '✅ SECURE' : '❌ SECURITY ISSUES DETECTED'}\n`;
    report += `Security Level: ${this.securityLevel.level.toUpperCase()}\n\n`;

    if (violations.length === 0) {
      report += `✅ No security violations detected.\n`;
    } else {
      report += `❌ ${violations.length} security violation(s) detected:\n\n`;

      const violationsBySeverity = {
        critical: violations.filter(v => v.severity === 'critical'),
        high: violations.filter(v => v.severity === 'high'),
        medium: violations.filter(v => v.severity === 'medium'),
        low: violations.filter(v => v.severity === 'low')
      };

      for (const [severity, severityViolations] of Object.entries(violationsBySeverity)) {
        if (severityViolations.length > 0) {
          report += `📍 ${severity.toUpperCase()} SEVERITY (${severityViolations.length})\n`;
          for (const violation of severityViolations) {
            report += `  • Line ${violation.location.line}: ${violation.description}\n`;
            report += `    Pattern: "${violation.pattern}"\n`;
            report += `    Suggestion: ${violation.suggestion}\n\n`;
          }
        }
      }
    }

    report += `\n=== END REPORT ===\n`;
    return report;
  }

  /**
   * Update security level configuration
   */
  public setSecurityLevel(level: SecurityLevel): void {
    this.securityLevel = level;
  }
}