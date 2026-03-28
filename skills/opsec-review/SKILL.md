---
name: opsec-review
description: Analyze offensive code for detection risks across AV/EDR/SIEM/SOC detection mechanisms
---

# OPSEC Review Skill

## Purpose
Comprehensive analysis of offensive tools for detection risks. Reviews code against static analysis, behavioral detection, network signatures, and forensic artifacts.

## Use When
- Before deploying custom tools in monitored environments
- After writing loaders, implants, or payloads
- User asks "will this get caught" or "is this safe to run"
- Want to understand detection surface of existing tools

## Detection Categories Analyzed

### Static Analysis
- **Signatures**: Known malware patterns, YARA rules, hash-based detection
- **Imports**: Suspicious Win32 API combinations (VirtualAlloc + WriteProcessMemory + CreateRemoteThread)
- **Strings**: Hardcoded C2 URLs, tool names, default passwords, debug messages
- **PE Metadata**: Compilation timestamps, digital signatures, entropy analysis
- **Code Patterns**: Known exploit techniques, shellcode signatures

### Behavioral Detection
- **API Sequences**: Patterns that match known attack techniques
- **Process Relationships**: Unusual parent-child process trees
- **Memory Operations**: Cross-process memory allocation, RWX regions
- **ETW Events**: Specific Event Tracing for Windows patterns
- **AMSI Triggers**: PowerShell and .NET content that triggers AMSI

### Network Detection
- **C2 Signatures**: Known framework patterns (Cobalt Strike, Metasploit)
- **Beacon Timing**: Regular intervals indicating automated communication
- **TLS Fingerprints**: JA3/JA4 signatures that identify tools
- **DNS Patterns**: Unusual query patterns, long subdomains (tunneling)
- **User Agents**: Default or suspicious HTTP user agents

### Forensic Artifacts
- **Event Logs**: Windows Event Log entries that reveal activity
- **Sysmon Events**: Specific Event IDs triggered by techniques
- **Registry**: Persistence mechanisms, configuration changes
- **File System**: Dropped files, timestamp modifications, prefetch entries

## Execution Workflow

1. **Identify Code Scope**: Determine all files to review
2. **Gather Context**: Target environment, defensive tools present, deployment method
3. **Detection Reference**: Use `af_detection_lookup` to research specific APIs/techniques
4. **Comprehensive Review**:
   - Delegate to `opsec-reviewer` agent (Opus model for thoroughness)
   - Provide all source files and deployment context
   - Request findings with severity ratings and mitigations
5. **Apply Mitigations**: Implement recommended fixes based on findings

## Reference Data Integration
The skill leverages Armsforge's detection reference data:
- **Suspicious APIs** (`suspicious-apis.json`): Win32 APIs that trigger EDR
- **Sysmon Rules** (`sysmon-rules.json`): Event IDs and offensive triggers
- **ETW Providers** (`etw-providers.json`): Logging mechanisms to avoid
- **AMSI Triggers** (`amsi-triggers.json`): PowerShell patterns that get caught

## Agent Instructions
When delegating to `opsec-reviewer`:
- Provide complete source code context
- Describe target environment (AV/EDR products, monitoring tools)
- Specify deployment method (phishing, web exploit, physical access)
- Request severity ratings: HIGH (will trigger), MEDIUM (may trigger), LOW (unlikely)
- Ask for specific mitigations for each finding
- Note techniques that are "burned" (widely detected with no good evasion)

## Output Format
Expects structured review with:
- **Overall Risk Assessment**: HIGH/MEDIUM/LOW with justification
- **Detailed Findings**: Each issue with detection mechanism and mitigation
- **Priority Recommendations**: Most critical fixes first
- **What's Already Good**: Positive OPSEC practices already implemented

## Skill Invocation

**Explicit**: `/armsforge:opsec-review`

**Auto-detection**:
- "OPSEC check"
- "will EDR catch this"
- "check for detection"
- "detection risk analysis"
- "will this get caught"
- "AV evasion review"