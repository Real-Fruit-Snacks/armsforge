#!/usr/bin/env node

// Quick verification script for security validator
import { TemplateSecurityValidator } from './src/templates/security-validator.js';

console.log('🔒 Testing Template Security Validator...\n');

const validator = new TemplateSecurityValidator({
  level: 'intermediate',
  allowPlaceholders: false,
  enableSandboxing: true,
  checkObfuscation: true
});

// Test 1: Clean template should pass
console.log('Test 1: Clean template');
const cleanTemplate = `
#include <stdio.h>
int main() {
    printf("Hello World\\n");
    return 0;
}
`;

const result1 = validator.validateTemplate('clean', cleanTemplate);
console.log(`✅ Clean template - Secure: ${result1.isSecure}, Score: ${result1.score}/100`);

// Test 2: Template with hardcoded credentials should fail
console.log('\nTest 2: Template with hardcoded credentials');
const unsafeTemplate = `
#include <stdio.h>
int main() {
    const char* password = "MySecretPassword123";
    const char* api_key = "sk-1234567890abcdef";
    return 0;
}
`;

const result2 = validator.validateTemplate('unsafe', unsafeTemplate);
console.log(`❌ Unsafe template - Secure: ${result2.isSecure}, Score: ${result2.score}/100`);
console.log(`   Violations: ${result2.violations.length}`);

// Test 3: Template with dangerous APIs should fail
console.log('\nTest 3: Template with dangerous APIs');
const dangerousTemplate = `
#include <windows.h>
int main() {
    HANDLE proc = OpenProcess(PROCESS_ALL_ACCESS, FALSE, 1234);
    LPVOID mem = VirtualAllocEx(proc, NULL, 1024, MEM_COMMIT, PAGE_EXECUTE_READWRITE);
    WriteProcessMemory(proc, mem, shellcode, 1024, NULL);
    return 0;
}
`;

const result3 = validator.validateTemplate('dangerous', dangerousTemplate);
console.log(`❌ Dangerous template - Secure: ${result3.isSecure}, Score: ${result3.score}/100`);
console.log(`   Violations: ${result3.violations.length}`);

// Test 4: Template with placeholders should fail (unless allowed)
console.log('\nTest 4: Template with placeholders');
const placeholderTemplate = `
int main() {
    int offset = 0; // TODO: Calculate this
    char* target = "<TARGET_IP>";
    return 0;
}
`;

const result4 = validator.validateTemplate('placeholder', placeholderTemplate);
console.log(`❌ Placeholder template - Secure: ${result4.isSecure}, Score: ${result4.score}/100`);

// Test 5: Same template with placeholders allowed
validator.setSecurityLevel({
  level: 'intermediate',
  allowPlaceholders: true,
  enableSandboxing: true,
  checkObfuscation: true
});

const result5 = validator.validateTemplate('placeholder', placeholderTemplate);
console.log(`✅ Placeholder template (allowed) - Secure: ${result5.isSecure}, Score: ${result5.score}/100`);

console.log('\n🔒 Security validation tests completed!');