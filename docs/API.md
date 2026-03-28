# Armsforge MCP Server API Reference

Complete reference for all MCP tools provided by Armsforge.

## Overview

Armsforge provides 5 MCP tools for code retrieval and detection lookups. All tools are accessed through the Model Context Protocol and are available in Claude Code conversations.

## Tools

### af_list_templates

List all available offensive code templates.

**Description**: Returns a formatted list of all exploit, loader, implant, and stager templates with descriptions.

**Input**: None

**Output**: Formatted list of template filenames with descriptions

**Example Usage**:
```
Tool: af_list_templates
Output:
═══ Available Templates ═══
  bof-exploit.py — Buffer overflow exploit template — stack-based with bad char analysis
  buffer-overflow-template.py — Advanced BOF template with ROP gadget support
  implant-skeleton.rs — Rust-based C2 implant skeleton with modular design
  loader-injection.cs — C# process injection loader — CreateRemoteThread with AES-encrypted shellcode
  python-exploit.py — Python exploit framework with built-in badchar analysis
  stager-http.go — HTTP stager with domain fronting support
```

**Use Cases**:
- Browse available exploit templates
- Find the right template for your vulnerability class
- Discover new exploitation techniques

---

### af_get_template

Retrieve a specific exploit or loader template.

**Description**: Loads and returns the full content of a template file by name.

**Input**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Template filename (e.g., 'bof-exploit.py', 'loader-injection.cs') |

**Output**: Full template code with comments and configuration instructions

**Example Usage**:
```
Tool: af_get_template
Parameters: name = "bof-exploit.py"

Output: [Full Python exploit template with sections for:]
  - CONFIGURATION (OFFSET, RET_ADDR, BAD_CHARS, SHELLCODE)
  - BAD CHARACTER TEST PAYLOAD
  - EXPLOIT FUNCTION
  - MAIN FUNCTION with usage instructions
```

**Error Handling**:
- Returns "Template not found" with list of available templates if filename doesn't exist
- Available templates are listed in error message

**Use Cases**:
- Start developing a buffer overflow exploit
- Retrieve a C# injection loader template
- Get an HTTP stager skeleton in Go
- Copy-paste template for rapid development

**Workflow Example - BOF Development**:
1. Call `af_get_template` with name "bof-exploit.py"
2. Copy template to your workspace
3. Customize sections:
   - Find OFFSET using pattern_create/pattern_offset
   - Set RET_ADDR to your gadget address
   - Identify BAD_CHARS
   - Replace SHELLCODE with your payload
4. Test against target

---

### af_list_snippets

List all available code snippets.

**Description**: Returns a formatted list of reusable code snippets for common offensive techniques.

**Input**: None

**Output**: Formatted list of snippet filenames with descriptions

**Example Snippets**:
- Direct syscall stubs (x86/x64 assembly)
- AES encryption/decryption routines (C#, Python, Rust)
- Process injection patterns (Windows API, direct syscall)
- API hooking implementations
- Shellcode loaders
- Beacon communication patterns

**Use Cases**:
- Find reusable code for common tasks
- Discover evasion technique implementations
- Access encryption and encoding utilities

---

### af_get_snippet

Retrieve a specific code snippet.

**Description**: Loads and returns the full content of a snippet file.

**Input**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Snippet filename (e.g., 'direct-syscall.asm', 'aes-decrypt.cs') |

**Output**: Full snippet code with usage comments

**Example Snippets Available**:

**C# AES Decryption**:
```csharp
// @desc AES-256-CBC decryption helper for encrypted payloads
using System.Security.Cryptography;

static byte[] DecryptAES(byte[] encrypted, byte[] key, byte[] iv)
{
    using (Aes aes = Aes.Create())
    {
        aes.Key = key;
        aes.IV = iv;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using (var decryptor = aes.CreateDecryptor())
        {
            return decryptor.TransformFinalBlock(encrypted, 0, encrypted.Length);
        }
    }
}
```

**Direct Syscall (x86-64 Assembly)**:
```asm
; @desc Direct syscall for NtAllocateVirtualMemory (bypasses user-mode hooks)
mov rax, 0x18          ; NtAllocateVirtualMemory syscall number
syscall
```

**Error Handling**:
- Returns "Snippet not found" if filename doesn't exist
- Lists available snippets in error message

**Use Cases**:
- Integrate AES decryption into a shellcode loader
- Add direct syscalls for EDR evasion
- Copy process injection pattern
- Integrate API hooking for stealth

**Workflow Example - Secure Loader**:
1. Get loader template: `af_get_template` "loader-injection.cs"
2. Get AES snippet: `af_get_snippet` "aes-decrypt.cs"
3. Integrate decryption function into loader
4. Encrypt your shellcode with AES-256
5. Set KEY and IV in loader configuration
6. Compile and test

---

### af_detection_lookup

Search detection reference data for Win32 APIs, Sysmon rules, ETW providers, and AMSI patterns.

**Description**: Queries a comprehensive database of detection patterns including:
- Win32 APIs commonly monitored by EDR/AV
- Sysmon event IDs and detection rules
- ETW (Event Tracing for Windows) providers and event IDs
- AMSI (Antimalware Scan Interface) trigger patterns

**Input**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | API name, technique name, or keyword (e.g., 'VirtualAllocEx', 'process creation', 'CreateRemoteThread') |

**Output**: Formatted detection information from all matching data sources

**Example Usage 1 - API Detection**:
```
Tool: af_detection_lookup
Parameters: query = "VirtualAllocEx"

Output:
═══ Detection Info: VirtualAllocEx ═══

### Suspicious API
{
  "name": "VirtualAllocEx",
  "risk": "high",
  "description": "Allocates memory in another process. When combined with WriteProcessMemory + CreateRemoteThread = classic injection pattern.",
  "detection_patterns": [
    "VirtualAllocEx → WriteProcessMemory → CreateRemoteThread sequence",
    "PAGE_EXECUTE_READWRITE permissions on cross-process allocation"
  ],
  "evasion_notes": "Use VirtualProtectEx to change from RW to RX after writing. Consider alternative allocation methods."
}

### Sysmon Rule
{
  "event_id": 10,
  "name": "Process access",
  "triggered_by": "Any process opening another process with suspicious access rights",
  "detection_logic": "Monitor OpenProcess calls with PROCESS_ALL_ACCESS"
}

### ETW Provider
{
  "provider_name": "Microsoft-Windows-Kernel-Memory",
  "event_id": 98,
  "description": "VirtualAllocEx and related memory operations"
}
```

**Example Usage 2 - Technique Search**:
```
Tool: af_detection_lookup
Parameters: query = "process injection"

Output: Lists all APIs, rules, and providers related to process injection detection
```

**Example Usage 3 - AMSI Patterns**:
```
Tool: af_detection_lookup
Parameters: query = "CreateRemoteThread"

Output:
### AMSI Trigger
{
  "pattern": "CreateRemoteThread",
  "category": "process_injection",
  "confidence": "high",
  "bypass_notes": "Direct syscalls or alternative APIs (NtCreateThreadEx)"
}
```

**Data Sources**:

| Data File | Description | Content |
|-----------|-------------|---------|
| `suspicious-apis.json` | Win32 APIs monitored by EDR/AV | Function names, risk levels, detection patterns, evasion notes |
| `sysmon-rules.json` | Sysmon event monitoring rules | Event IDs, conditions, what triggers them |
| `etw-providers.json` | Event Tracing for Windows providers | Provider names, event IDs, monitored activities |
| `amsi-triggers.json` | AMSI pattern detection triggers | PowerShell signatures, technique patterns, bypass info |

**Search Tips**:
- Search by API name (e.g., "VirtualAllocEx", "CreateRemoteThread")
- Search by technique (e.g., "process injection", "token manipulation")
- Search by tool/framework name (e.g., "Mimikatz", "Cobalt Strike")
- Search by Sysmon event ID (e.g., "Event ID 10" or "process access")
- Search by keyword (e.g., "bypass", "evasion", "detection")

**Error Handling**:
- Returns "No detection data found" if query doesn't match anything
- Provides search tips to help refine your query

**Use Cases**:

1. **OPSEC Planning**:
   ```
   Query: "WriteProcessMemory"
   → Understand what detects this technique
   → Plan alternative approaches
   ```

2. **Detection Evasion**:
   ```
   Query: "VirtualAllocEx → WriteProcessMemory → CreateRemoteThread"
   → See why classic injection is detected
   → Learn evasion techniques (RW → RX transition, alternative APIs)
   ```

3. **EDR Bypassing**:
   ```
   Query: "NtCreateThreadEx"
   → Find alternative to CreateRemoteThread
   → Check if it's less monitored
   ```

4. **Exam Preparation**:
   ```
   Query: "process creation"
   → Learn what Sysmon rules detect
   → Understand ETW providers involved
   → Prepare for stealthy exploitation
   ```

---

## Error Handling

All tools provide helpful error messages:

| Error | Cause | Solution |
|-------|-------|----------|
| "Template/Snippet not found" | File doesn't exist | Use `af_list_templates` or `af_list_snippets` to see available files |
| "No detection data found" | Query doesn't match any data | Try different keywords; see search tips above |
| "Templates directory not found" | Installation error | Reinstall Armsforge: `npm install -g armsforge` |

---

## Integration Patterns

### Pattern 1: Quick Template + Customization

```
1. af_list_templates  → Browse what's available
2. af_get_template    → Retrieve your target template
3. [Customize locally with values specific to your target]
4. [Test in lab environment]
```

### Pattern 2: Template + Snippet Integration

```
1. af_get_template    → Get loader framework
2. af_get_snippet     → Get AES decryption code
3. [Integrate snippet into template]
4. af_detection_lookup → Check for detection risks
5. [Apply evasion techniques based on lookup results]
```

### Pattern 3: Detection-Driven Development

```
1. af_detection_lookup → Research your planned technique
2. [Choose alternative API based on detection patterns]
3. af_get_snippet      → Get alternative implementation
4. af_get_template     → Get framework using alternatives
5. af_detection_lookup → Verify new approach has lower detection risk
```

### Pattern 4: OSCP/OSEP Preparation

```
1. af_list_templates  → Find BOF template
2. af_get_template    → Retrieve template
3. [Solve 10 BOF challenges using template]
4. af_detection_lookup → Study detection patterns
5. [Practice writing exploits without template reference]
```

---

## Rate Limiting and Considerations

- **No rate limiting**: Tools can be called as frequently as needed
- **Performance**: All data is pre-loaded from disk on plugin initialization
- **Data size**: Detection data (~20KB) is loaded once at startup
- **Caching**: Tool results are not cached; each call reads fresh data

---

## Plugin Configuration

Armsforge is configured via `.mcp.json`:

```json
{
  "mcpServers": {
    "af": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/bridge/mcp-server.cjs"]
    }
  }
}
```

The MCP server listens on stdio and is managed by Claude Code automatically.

---

## Troubleshooting

### Tools not appearing in Claude Code

1. Check plugin is installed: Settings → Plugins → search "Armsforge"
2. Verify MCP configuration: `.mcp.json` exists in plugin root
3. Restart Claude Code
4. Check console for errors: View → Toggle Developer Tools

### Template/snippet files missing

1. Verify plugin installation: `npm list -g armsforge`
2. Check files exist: `ls $(npm list -g armsforge)/templates/`
3. Reinstall: `npm install -g armsforge@latest`

### Detection data not found

1. Verify data files exist: `ls $(npm list -g armsforge)/data/`
2. Check JSON syntax: `cat $(npm list -g armsforge)/data/suspicious-apis.json | jq .`
3. Reinstall plugin: `npm install -g armsforge@latest`

---

## Examples by Security Domain

### Example 1: Process Injection (Red Team)

```
1. af_list_templates
   → Find "loader-injection.cs"

2. af_get_template with name="loader-injection.cs"
   → Download C# loader template

3. af_detection_lookup with query="CreateRemoteThread"
   → See why it's detected

4. af_detection_lookup with query="NtCreateThreadEx"
   → Research alternative API

5. af_get_snippet with name="syscall-NtCreateThreadEx.asm"
   → Get direct syscall implementation

6. [Integrate into C# loader using P/Invoke]

7. af_detection_lookup with query="WriteProcessMemory"
   → Check memory writing detection

8. af_get_snippet with name="aes-encrypt.cs"
   → Encrypt shellcode before injection
```

### Example 2: Buffer Overflow (OSCP)

```
1. af_get_template with name="bof-exploit.py"
   → Get BOF template

2. [Solve: Find offset, bad chars, RET address]

3. af_detection_lookup with query="shellcode"
   → Understand detection patterns

4. af_get_snippet with name="bad-char-finder.py"
   → Automated bad char testing

5. [Run exploit against lab target]

6. [Document for exam report]
```

### Example 3: OSEP Privilege Escalation

```
1. af_detection_lookup with query="token impersonation"
   → Understand what detects it

2. af_detection_lookup with query="SeImpersonatePrivilege"
   → Learn ETW monitoring

3. af_get_template with name="privesc-impersonation.cs"
   → Get starter code

4. [Customize for target]

5. af_detection_lookup with query="process creation"
   → Verify cleanup strategy
```

---

## Advanced Usage

### Custom Query Patterns

For comprehensive OPSEC analysis, chain multiple lookups:

```
# Research complete process injection OPSEC
1. af_detection_lookup "VirtualAllocEx"
2. af_detection_lookup "WriteProcessMemory"
3. af_detection_lookup "CreateRemoteThread"
4. af_detection_lookup "memory protection"
5. af_detection_lookup "ETW process"

# Compare techniques
6. af_detection_lookup "NtCreateThreadEx"
7. af_detection_lookup "SetWindowsHookEx"
8. af_detection_lookup "QueueUserAPC"
```

### Building Detection Evasion Timeline

```
1. af_detection_lookup "Classic injection pattern"
   → Understand monitored sequence

2. af_detection_lookup "RWX memory"
   → Why it's detected

3. af_detection_lookup "indirect syscall"
   → Learn newer evasion

4. af_get_snippet "indirect-syscall"
   → Get implementation

5. af_detection_lookup "indirect syscall detection"
   → Check if already detected

6. af_get_template "loader-indirect-syscall.cs"
   → Use new approach
```

---

**Last Updated**: March 2026
**API Version**: 1.0
**MCP Protocol**: 1.26.0+
