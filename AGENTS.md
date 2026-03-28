# Armsforge Specialized Agents

Armsforge includes 8 specialized Claude agents optimized for different aspects of offensive security operations. Each agent is fine-tuned with domain-specific knowledge and workflows.

## Agent Overview

| Agent | Model | Purpose | Invocation |
|-------|-------|---------|------------|
| **exploit-dev** | Sonnet | Buffer overflows, web exploits, deserialization | `/armsforge:exploit` |
| **payload-eng** | Sonnet | Shellcode generation, stagers, multi-stage payloads | `/armsforge:payload` |
| **implant-dev** | Sonnet | C2 implants, beacons, persistence mechanisms | `/armsforge:loader` |
| **recon-analyst** | Sonnet | Information gathering, network enumeration | Direct agent call |
| **privesc-analyst** | Sonnet | Windows/Linux privilege escalation vectors | `/armsforge:privesc` |
| **opsec-reviewer** | Opus | Detection risk analysis, AV/EDR evasion review | `/armsforge:opsec-review` |
| **finding-writer** | Haiku | Penetration test finding documentation | Direct agent call |
| **report-writer** | Haiku | Engagement report writing | Direct agent call |

## Detailed Agent Descriptions

### 🔥 exploit-dev (Sonnet)
**Specialization**: Exploit development for known vulnerability classes
**File**: `agents/exploit-dev.md`

**Capabilities**:
- Buffer overflows (stack-based, SEH-based, egghunter techniques)
- Format string vulnerabilities
- Deserialization attacks (Java, .NET, Python pickle)
- Web application exploits (SQLi, XSS, SSTI, XXE, SSRF)
- Authentication bypass techniques
- Custom exploit code development

**Best For**: OSCP/OSEP exam prep, CTF challenges, vulnerability research

---

### 🚀 payload-eng (Sonnet)
**Specialization**: Shellcode generation and payload engineering
**File**: `agents/payload-eng.md`

**Capabilities**:
- Shellcode generation for Windows/Linux (x86/x64/ARM)
- Multi-stage payload architectures
- Encoder/decoder implementations (XOR, Caesar, custom)
- Stager development (HTTP/HTTPS, DNS, SMB)
- Anti-analysis and sandbox evasion
- Payload size optimization

**Best For**: Red team operations, advanced payload delivery, AV evasion

---

### 🏗️ implant-dev (Sonnet)
**Specialization**: C2 implant and persistence mechanism development
**File**: `agents/implant-dev.md`

**Capabilities**:
- Command & Control implant development
- Beacon implementations (C2 communication)
- Persistence mechanisms (registry, services, tasks, startup)
- Process injection techniques (DLL injection, process hollowing)
- Communication protocols (HTTP/HTTPS, DNS, named pipes)
- OPSEC-focused implant design

**Best For**: Long-term access, persistence establishment, C2 infrastructure

---

### 🔍 recon-analyst (Sonnet)
**Specialization**: Information gathering and network reconnaissance
**File**: `agents/recon-analyst.md`

**Capabilities**:
- Network enumeration and discovery
- Service fingerprinting and banner grabbing
- Web application reconnaissance
- OSINT techniques and tools
- Target profiling and attack surface analysis
- Domain and subdomain enumeration

**Best For**: Initial access planning, target assessment, intelligence gathering

---

### ⬆️ privesc-analyst (Sonnet)
**Specialization**: Privilege escalation analysis and exploitation
**File**: `agents/privesc-analyst.md`

**Capabilities**:
- Windows privilege escalation (tokens, services, registry, UAC bypass)
- Linux privilege escalation (SUID/SGID, cron jobs, capabilities, kernel exploits)
- Container escape techniques
- Credential harvesting and lateral movement
- Systematic enumeration workflows
- Automated escalation tool usage

**Best For**: OSCP preparation, post-exploitation, lateral movement

---

### 🛡️ opsec-reviewer (Opus)
**Specialization**: Detection risk analysis and OPSEC review
**File**: `agents/opsec-reviewer.md`

**Capabilities**:
- AV/EDR detection pattern analysis
- Code signature and behavioral analysis
- SIEM/SOC detection rule assessment
- Network traffic analysis for anomalies
- Forensic artifact identification
- OPSEC recommendations and mitigation strategies

**Best For**: Red team OPSEC, detection evasion, operational security

---

### 📝 finding-writer (Haiku)
**Specialization**: Technical finding documentation for penetration tests
**File**: `agents/finding-writer.md`

**Capabilities**:
- Vulnerability finding documentation
- Risk rating and CVSS scoring
- Proof-of-concept development
- Remediation recommendations
- Executive summary writing
- Technical detail compilation

**Best For**: Pentest reporting, vulnerability documentation, client deliverables

---

### 📊 report-writer (Haiku)
**Specialization**: Comprehensive engagement report compilation
**File**: `agents/report-writer.md`

**Capabilities**:
- Executive summary creation
- Technical methodology documentation
- Finding compilation and organization
- Risk assessment and business impact analysis
- Appendix and supporting evidence organization
- Report formatting and presentation

**Best For**: Final deliverables, client presentations, executive briefings

## Usage Patterns

### OSCP/OSEP Exam Preparation
1. **exploit-dev** → Develop reliable exploits for common vulnerability types
2. **privesc-analyst** → Master privilege escalation techniques
3. **payload-eng** → Create custom payloads when Metasploit is restricted
4. **opsec-reviewer** → Understand detection patterns for exam environments

### Red Team Operations
1. **recon-analyst** → Gather intelligence on target environment
2. **payload-eng** → Develop custom, evasive payloads
3. **implant-dev** → Establish persistent access mechanisms
4. **opsec-reviewer** → Review all tools/techniques for detection risks

### Penetration Testing Engagements
1. **recon-analyst** → Enumerate attack surface
2. **exploit-dev** → Develop proofs-of-concept for findings
3. **finding-writer** → Document vulnerabilities professionally
4. **report-writer** → Compile comprehensive client deliverable

## Agent Integration

### Template System Integration
All agents have access to the Armsforge template system and can:
- Generate code from templates with proper context
- Customize templates for specific target environments
- Apply evasion techniques appropriate to the engagement

### Detection Reference Integration
All agents can query the detection reference database for:
- Suspicious API usage patterns
- Sysmon event triggers
- ETW provider monitoring
- AMSI bypass techniques

### Workflow Integration
Agents are designed to work together in common offensive security workflows:
- **Planning Phase**: recon-analyst → opsec-reviewer
- **Development Phase**: exploit-dev → payload-eng → implant-dev
- **Deployment Phase**: opsec-reviewer → implant-dev
- **Documentation Phase**: finding-writer → report-writer

## Direct Agent Usage

To use agents directly (without skill shortcuts):
```bash
# Use Task tool with subagent_type
Task(subagent_type="oh-my-claudecode:exploit-dev",
     model="sonnet",
     prompt="Develop a stack-based buffer overflow exploit for...")

# Or use Agent tool
Agent(subagent_type="oh-my-claudecode:payload-eng",
      description="Generate shellcode",
      prompt="Create Windows x64 reverse TCP shellcode...")
```

## Agent File Structure

Each agent file contains:
- **YAML Frontmatter**: name, description, model specification
- **Agent Prompt**: Detailed role definition and capabilities
- **Context Guidelines**: Domain-specific knowledge and best practices
- **Output Formats**: Expected deliverable formats and structures

See individual agent files in the `agents/` directory for complete prompt definitions and usage guidelines.

---

**Last Updated**: March 2026
**Version**: 0.1.0
**Total Agents**: 8