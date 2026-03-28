// Mock data for testing

export const mockTemplates = {
  'test-exploit.py': {
    content: `#!/usr/bin/env python3
# @desc Test exploit template for unit testing
"""
Test Exploit Template
====================
This is a mock template for testing purposes.
"""

import socket

def exploit():
    print("Mock exploit code")
    return True
`,
    description: 'Test exploit template for unit testing'
  },
  'mock-loader.cs': {
    content: `// @desc Mock C# loader for testing
using System;

namespace MockLoader
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Mock loader");
        }
    }
}`,
    description: 'Mock C# loader for testing'
  }
};

export const mockSnippets = {
  'test-syscall.asm': {
    content: `; @desc Test syscall stub for unit testing
section .text
global _start

_start:
    ; Mock syscall stub
    mov rax, 60
    mov rdi, 0
    syscall
`,
    description: 'Test syscall stub for unit testing'
  },
  'mock-crypto.c': {
    content: `// @desc Mock encryption routine for testing
#include <stdio.h>

void mock_encrypt(char* data, size_t len) {
    for (size_t i = 0; i < len; i++) {
        data[i] ^= 0x42; // Mock XOR encryption
    }
}
`,
    description: 'Mock encryption routine for testing'
  }
};

export const mockDetectionData = {
  'suspicious-apis.json': {
    description: "Mock suspicious APIs for testing",
    categories: {
      process_injection: {
        description: "Mock process injection APIs",
        apis: [
          {
            name: "VirtualAllocEx",
            risk: "high",
            description: "Mock API for testing",
            detection_patterns: ["VirtualAllocEx → WriteProcessMemory → CreateRemoteThread sequence", "PAGE_EXECUTE_READWRITE permissions on cross-process allocation"],
            evasion_notes: "Use indirect syscalls and manual DLL loading to avoid detection"
          },
          {
            name: "CreateRemoteThread",
            risk: "critical",
            description: "Mock remote thread API",
            detection_patterns: ["Thread pattern"],
            alternatives: ["QueueUserAPC"]
          }
        ]
      }
    }
  },
  'sysmon-rules.json': {
    description: "Mock Sysmon rules for testing",
    events: [
      {
        id: 1,
        name: "ProcessCreate",
        description: "Mock process creation event",
        detection_logic: "Mock detection logic"
      },
      {
        id: 8,
        name: "CreateRemoteThread",
        description: "Mock remote thread event",
        detection_logic: "Remote thread detection"
      }
    ]
  },
  'etw-providers.json': {
    description: "Mock ETW providers for testing",
    providers: [
      {
        name: "Microsoft-Windows-Kernel-Process",
        guid: "{22fb2cd6-0e7b-422b-a0c7-2fad1fd0e716}",
        description: "Mock process provider",
        events: ["ProcessStart", "ProcessStop"]
      }
    ]
  },
  'amsi-triggers.json': {
    description: "Mock AMSI triggers for testing",
    trigger_patterns: {
      powershell: {
        description: "Mock PowerShell triggers",
        patterns: [
          {
            pattern: "Invoke-Expression",
            risk: "high",
            description: "Mock IEX trigger"
          },
          {
            pattern: "DownloadString",
            risk: "medium",
            description: "Mock download trigger"
          }
        ]
      }
    }
  }
};

export const expectedResponses = {
  templateList: `## Available Templates

  test-exploit.py — Test exploit template for unit testing
  mock-loader.cs — Mock C# loader for testing`,

  snippetList: `## Available Snippets

  test-syscall.asm — Test syscall stub for unit testing
  mock-crypto.c — Mock encryption routine for testing`,

  detectionResult: `## Detection Info: VirtualAllocEx

### Suspicious API
\`\`\`json
{
  "name": "VirtualAllocEx",
  "risk": "high",
  "description": "Mock API for testing",
  "detection_patterns": [
    "Pattern 1",
    "Pattern 2"
  ],
  "evasion_notes": "Use indirect syscalls and manual DLL loading to avoid detection"
}
\`\`\``
};