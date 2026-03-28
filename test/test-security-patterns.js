#!/usr/bin/env node

// Quick test of regex patterns for security validation
console.log('🔒 Testing Security Regex Patterns...\n');

// Test placeholder patterns
const placeholderPatterns = [
  { pattern: /OFFSET\s*=\s*0(?![0-9a-fA-F])/gi, description: "OFFSET = 0 (needs pattern_offset calculation)" },
  { pattern: /RET_ADDR\s*=\s*0x0+(?![0-9a-fA-F])/gi, description: "RET_ADDR = 0x00000000 (needs JMP ESP gadget)" },
  { pattern: /TODO:/gi, description: "TODO comments (need customization)" },
  { pattern: /placeholder/gi, description: "Placeholder text" },
  { pattern: /CHANGE_ME/gi, description: "CHANGE_ME markers" }
];

// Test dangerous API patterns
const dangerousApiPatterns = [
  { pattern: /\b(VirtualAllocEx|WriteProcessMemory|CreateRemoteThread|NtCreateThreadEx)\b/g, type: 'Process injection sequence detected' },
  { pattern: /\b(ZwAllocateVirtualMemory|ZwWriteVirtualMemory|ZwCreateThread)\b/g, type: 'Direct syscall injection detected' },
  { pattern: /\b(AdjustTokenPrivileges|LookupPrivilegeValue|OpenProcessToken)\b/g, type: 'Token manipulation detected' }
];

// Test content with placeholders
const placeholderContent = `
  int offset = 0;
  char* ret_addr = 0x00000000;
  // TODO: Add shellcode here
  char placeholder_data[] = "CHANGE_ME";
`;

console.log('Testing placeholder detection:');
for (const { pattern, description } of placeholderPatterns) {
  const matches = Array.from(placeholderContent.matchAll(pattern));
  if (matches.length > 0) {
    console.log(`✅ Found: ${description} - ${matches.length} matches`);
  }
}

// Test content with dangerous APIs
const dangerousContent = `
  HANDLE proc = OpenProcess(PROCESS_ALL_ACCESS, FALSE, 1234);
  LPVOID mem = VirtualAllocEx(proc, NULL, 1024, MEM_COMMIT, PAGE_EXECUTE_READWRITE);
  WriteProcessMemory(proc, mem, shellcode, 1024, NULL);
  AdjustTokenPrivileges(token, FALSE, &privs, 0, NULL, NULL);
`;

console.log('\nTesting dangerous API detection:');
for (const { pattern, type } of dangerousApiPatterns) {
  const matches = Array.from(dangerousContent.matchAll(pattern));
  if (matches.length > 0) {
    console.log(`✅ Found: ${type} - ${matches.length} matches`);
    matches.forEach(match => console.log(`   - ${match[1]}`));
  }
}

// Test clean content
const cleanContent = `
#include <stdio.h>
int main() {
    printf("Hello World\\n");
    return 0;
}
`;

console.log('\nTesting clean content:');
let hasViolations = false;
for (const { pattern } of [...placeholderPatterns, ...dangerousApiPatterns]) {
  const matches = Array.from(cleanContent.matchAll(pattern));
  if (matches.length > 0) {
    hasViolations = true;
  }
}

if (!hasViolations) {
  console.log('✅ Clean content passed - no security violations detected');
} else {
  console.log('❌ Clean content failed - unexpected violations detected');
}

console.log('\n🔒 Pattern testing completed!');