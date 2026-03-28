---
name: payload
description: Generate payloads with evasion techniques — shellcode, stagers, loaders, encoders
---

# Payload Skill

## Purpose
Generate custom payloads with appropriate evasion techniques based on target environment and defensive posture.

## Use When
- Need shellcode for an exploit
- Building staged or stageless payloads
- Require specific payload format (exe, dll, ps1, raw shellcode)
- Need to bypass specific AV/EDR solutions
- Developing C2 beacons or implant communication

## Payload Types

### Shellcode
- **Reverse Shell**: TCP/HTTP/HTTPS callback to attacker
- **Bind Shell**: Listen on target for incoming connections
- **Meterpreter**: Full-featured post-exploitation agent
- **Custom**: Application-specific payloads

### Executable Formats
- **PE Executable**: Windows .exe with various injection techniques
- **DLL**: Windows library for DLL hijacking/injection
- **PowerShell**: .ps1 script with various encoding/obfuscation
- **HTA/VBS/JS**: Web-delivered script payloads

### Staged Payloads
- **Stager**: Small initial payload that downloads larger second stage
- **Stage**: Full-featured payload downloaded by stager
- **Multi-Stage**: Chain of increasingly complex stages

## Evasion Tiers

### Tier 1 (Basic) — No AV/EDR
- XOR or simple encryption of shellcode
- Basic string obfuscation
- Standard msfvenom with encoding

### Tier 2 (AV Present) — Consumer/Enterprise AV
- AES encryption of shellcode/strings
- Process injection techniques (CreateRemoteThread, QueueUserAPC)
- API hashing and dynamic resolution
- Sleep-based sandbox evasion
- AMSI bypass for PowerShell

### Tier 3 (EDR Present) — Advanced Detection
- Direct syscalls (bypass userland hooks)
- Module stomping/phantom DLL hollowing
- ETW patching to disable logging
- Unhooking ntdll from disk
- Return-oriented programming for API calls
- Hardware breakpoint hooking
- Callback-based execution (EnumWindows, etc.)

## Execution Workflow

1. **Assess Target Environment**:
   - Operating system and architecture
   - AV/EDR solution present
   - Network egress filtering
   - Application allowlisting (AppLocker, etc.)

2. **Select Template**: Use `af_get_template` for appropriate stager/loader

3. **Generate Base Payload**:
   - Delegate to `payload-eng` agent with requirements
   - Specify evasion tier based on defensive posture
   - Request source code + compilation instructions

4. **OPSEC Review**: Use `/armsforge:opsec-review` to identify detection risks

5. **Apply Additional Evasion**: Based on OPSEC review findings

## Agent Instructions
When delegating to `payload-eng`:
- Specify target OS/architecture (Windows 10 x64, Linux x86, etc.)
- Describe callback type and destination
- Note defensive measures present
- Request appropriate evasion tier
- Ask for source code with build instructions
- Request detection notes (what might still catch it)

## Skill Invocation

**Explicit**: `/armsforge:payload <format>`
Examples:
- `/armsforge:payload exe` — Windows executable
- `/armsforge:payload dll` — Windows DLL
- `/armsforge:payload shellcode` — Raw position-independent code
- `/armsforge:payload ps1` — PowerShell script
- `/armsforge:payload stager` — Small first-stage payload

**Auto-detection**:
- "generate payload"
- "create shellcode"
- "build a stager"
- "need reverse shell"
- "msfvenom alternative"