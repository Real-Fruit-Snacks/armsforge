---
name: loader
description: Scaffold shellcode loaders in C, C#, Rust, Go, or Nim with process injection techniques
---

# Loader Skill

## Purpose
Generate shellcode loaders with various injection techniques and evasion capabilities. Loaders execute shellcode in memory without dropping files to disk.

## Use When
- Need to execute shellcode on a target system
- Building custom delivery mechanism for payloads
- Want to wrap msfvenom output in evasive loader
- Developing modular C2 component

## Supported Languages

### C
- **Pros**: Smallest footprint, maximum control, easy cross-compilation
- **Cons**: Manual memory management, more verbose
- **Use for**: Size-constrained environments, maximum stealth

### C#
- **Pros**: .NET integration, P/Invoke for Win32, familiar syntax
- **Cons**: Requires .NET runtime, larger binaries
- **Use for**: Windows environments with .NET, rapid development

### Rust
- **Pros**: Memory safety, excellent cross-compilation, growing red team adoption
- **Cons**: Larger learning curve, larger binaries than C
- **Use for**: Modern projects, cross-platform deployment

### Go
- **Pros**: Easy cross-compilation, static binaries, good networking
- **Cons**: Large binary size, garbage collector
- **Use for**: Network-heavy tools, cross-platform deployment

### Nim
- **Pros**: Small binaries, Python-like syntax, good OPSEC track record
- **Cons**: Smaller ecosystem, less common
- **Use for**: Evasion-focused projects, smaller binaries

## Injection Techniques

### Process Injection (Cross-Process)
- **CreateRemoteThread**: Classic but heavily monitored
- **QueueUserAPC**: Alternative to CRT, less suspicious
- **NtMapViewOfSection**: Module stomping technique
- **Thread Pool Injection**: Modern alternative using thread pools

### Self-Injection (Same Process)
- **VirtualAlloc + Execute**: Simple in-process execution
- **Callback-based**: EnumWindows, EnumFonts, CertEnumSystemStore callbacks
- **Fiber-based**: Using Windows fiber API for execution
- **Exception Handler**: Vectored exception handler execution

### Advanced Techniques
- **Process Hollowing**: Replace legitimate process memory
- **Module Stomping**: Overwrite loaded DLL in memory
- **Reflective DLL Injection**: Load DLL from memory without file
- **Manual PE Mapping**: Custom PE loader implementation

## Execution Workflow

1. **Select Template**: Use `af_get_template` for appropriate loader skeleton
2. **Choose Language**: Based on target environment and size requirements
3. **Select Injection Method**: Based on detection risks and target process
4. **Generate Loader**:
   - Delegate to `payload-eng` agent
   - Specify language, technique, and evasion requirements
   - Request complete source with build instructions
5. **Add Snippets**: Integrate `af_get_snippet` for common patterns (crypto, syscalls)
6. **OPSEC Review**: Use `/armsforge:opsec-review` to identify detection risks

## Template Integration
Available templates:
- `loader-injection.cs` — C# CreateRemoteThread injection
- `implant-skeleton.rs` — Rust implant structure (can be adapted for loading)
- Check `af_list_templates` for current options

## Snippet Integration
Useful snippets:
- `direct-syscall.asm` — Bypass EDR hooks
- `aes-decrypt.cs` — Decrypt embedded shellcode
- `process-injection.c` — Classic injection pattern
- Check `af_list_snippets` for current options

## Agent Instructions
When delegating to `payload-eng`:
- Specify target language and injection technique
- Provide shellcode format (raw bytes, base64, encrypted)
- Note target architecture (x86/x64)
- Request evasion features based on threat model
- Ask for build instructions and dependencies

## Skill Invocation

**Explicit**: `/armsforge:loader [language]`
Examples:
- `/armsforge:loader rust` — Rust shellcode loader
- `/armsforge:loader cs` — C# loader with P/Invoke
- `/armsforge:loader c` — Minimal C loader
- `/armsforge:loader go` — Go cross-platform loader

**Auto-detection**:
- "build a loader"
- "shellcode runner"
- "process injection loader"
- "execute shellcode"