<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Real-Fruit-Snacks/armsforge/main/docs/assets/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Real-Fruit-Snacks/armsforge/main/docs/assets/logo-light.svg">
  <img alt="Armsforge" src="https://raw.githubusercontent.com/Real-Fruit-Snacks/armsforge/main/docs/assets/logo-dark.svg" width="520">
</picture>

![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows%20%7C%20macOS-lightgrey)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**AI-powered security platform for offensive operations — intelligent automation, Claude Code integration, workflow orchestration**

Exploit development with automated shellcode generation. Payload engineering with advanced evasion techniques. Implant development with stealth C2 channels. OPSEC analysis with detection risk assessment. MCP tool integration for workflow automation. Template and snippet system for rapid development.

> **Authorization Required**: This tool is designed exclusively for authorized security testing with explicit written permission. Unauthorized access to computer systems is illegal and may result in criminal prosecution.

[Quick Start](#quick-start) • [Features](#features) • [MCP Tools](#mcp-tools) • [Architecture](#architecture) • [Agents](#agents) • [Security](#security)

</div>

---

## Highlights

<table>
<tr>
<td width="50%">

**Exploit Development**
AI-accelerated exploit framework covering buffer overflows, format strings, web exploits, and deserialization attacks. Automated shellcode generation with target-specific customization. Smart ROP chain construction. Templates for every major vulnerability class.

**Payload Engineering**
Advanced payload generation with multi-stage delivery systems. Custom encoders and polymorphic engines. Shellcode loaders in C, C#, Rust, Go, and Nim. Evasion techniques that adapt to target defensive posture. AV/EDR bypass through alternative API sequences.

**Implant Development**
C2 framework scaffolding with persistent access modules. Stealth communication channels using domain fronting and beacon jitter. Process injection techniques with OPSEC-safe patterns. Memory-only operation with zero disk footprint.

**OPSEC Analysis**
Comprehensive detection risk assessment across AV, EDR, SIEM, and SOC controls. Suspicious API pattern matching against known signatures. Sysmon event correlation. ETW provider analysis. AMSI trigger identification with bypass guidance.

</td>
<td width="50%">

**MCP Tool Integration**
Seamless Model Context Protocol bridge for Claude Code. Six core tools for template retrieval, snippet integration, and detection intelligence. Zod-validated parameters with structured output. Context-aware customization for every operation.

**Template System**
50+ exploit templates covering buffer overflows, process injection, HTTP stagers, and C2 implant skeletons. 25+ reusable code snippets for syscalls, encryption, injection, and API hooks. Language-specific scaffolds for Python, C#, Rust, and Go.

**Agent Orchestration**
Specialized AI agents for every offensive discipline. Exploit-dev, payload-eng, and implant-dev for development. OPSEC reviewer for detection analysis. Finding writer for report generation. Privesc analyst for escalation research. Skill-based invocation through Claude Code.

**Certification Support**
Structured methodologies for OSCP and OSEP preparation. Exam-focused workflows with practice scenarios. Privilege escalation checklists for Windows and Linux. Professional report frameworks. Time-pressured exploit development training with templates.

</td>
</tr>
</table>

---

## Quick Start

### Prerequisites

<table>
<tr>
<th>Requirement</th>
<th>Version</th>
<th>Purpose</th>
</tr>
<tr>
<td>Node.js</td>
<td>20+</td>
<td>Runtime environment</td>
</tr>
<tr>
<td>npm</td>
<td>9+</td>
<td>Package management</td>
</tr>
<tr>
<td>Claude Code</td>
<td>Latest</td>
<td>MCP integration and agent orchestration</td>
</tr>
<tr>
<td>Git</td>
<td>Latest</td>
<td>Version control</td>
</tr>
</table>

### Build

```bash
# Clone repository
git clone https://github.com/Real-Fruit-Snacks/armsforge.git
cd armsforge

# Install dependencies and build
npm install
npm run build

# Verify
npm test
```

### Verification

```bash
# Test MCP integration (in Claude Code)
af_list_templates

# Test skill integration (in Claude Code)
/armsforge:exploit buffer-overflow
/armsforge:opsec-review
```

### Development

```bash
# Development with watch mode
npm run dev

# Production build
npm run build

# Full test suite
npm test

# Lint and format
npm run lint
npm run format
```

---

## Features

### MCP Tools

<table>
<tr>
<th>Tool</th>
<th>Purpose</th>
<th>Parameters</th>
<th>Output</th>
</tr>
<tr>
<td><code>af_list_templates</code></td>
<td>Browse exploit template catalog</td>
<td><code>category</code>, <code>language</code>, <code>arch</code></td>
<td>Template catalog with metadata</td>
</tr>
<tr>
<td><code>af_get_template</code></td>
<td>Retrieve customized exploit code</td>
<td><code>name</code>, <code>target_os</code>, <code>evasion_level</code></td>
<td>Parameterized exploit code</td>
</tr>
<tr>
<td><code>af_list_snippets</code></td>
<td>Browse reusable code snippets</td>
<td><code>language</code>, <code>technique</code></td>
<td>Snippet catalog</td>
</tr>
<tr>
<td><code>af_get_snippet</code></td>
<td>Retrieve specific code pattern</td>
<td><code>name</code>, <code>language</code></td>
<td>Reusable code block</td>
</tr>
<tr>
<td><code>af_detection_lookup</code></td>
<td>Analyze detection risk patterns</td>
<td><code>type</code>, <code>pattern</code>, <code>event_id</code></td>
<td>Detection intelligence</td>
</tr>
<tr>
<td><code>af_template_info</code></td>
<td>Get template capability details</td>
<td><code>name</code></td>
<td>Capability metadata</td>
</tr>
</table>

### Tool Parameters

<table>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Values</th>
<th>Default</th>
<th>Description</th>
</tr>
<tr>
<td><code>target_os</code></td>
<td>string</td>
<td><code>windows</code>, <code>linux</code>, <code>macos</code></td>
<td><code>windows</code></td>
<td>Target operating system</td>
</tr>
<tr>
<td><code>target_arch</code></td>
<td>string</td>
<td><code>x86</code>, <code>x64</code>, <code>arm64</code></td>
<td><code>x64</code></td>
<td>Target architecture</td>
</tr>
<tr>
<td><code>evasion_level</code></td>
<td>integer</td>
<td><code>1</code>, <code>2</code>, <code>3</code></td>
<td><code>1</code></td>
<td>Evasion sophistication level</td>
</tr>
<tr>
<td><code>payload_format</code></td>
<td>string</td>
<td><code>exe</code>, <code>dll</code>, <code>shellcode</code>, <code>script</code></td>
<td><code>exe</code></td>
<td>Output format</td>
</tr>
<tr>
<td><code>language</code></td>
<td>string</td>
<td><code>c</code>, <code>cpp</code>, <code>csharp</code>, <code>python</code>, <code>rust</code></td>
<td><code>c</code></td>
<td>Programming language</td>
</tr>
</table>

### Template Retrieval

```bash
# List available templates
af_list_templates
af_list_templates category="exploit" language="python" arch="x64"

# Generate exploit
af_get_template name="bof-exploit" target_os="windows" target_arch="x64"

# Web application exploit
af_get_template name="sqli-exploit" format="python" evasion_level=2
```

### Snippet Integration

```bash
# Process injection techniques
af_get_snippet name="process-injection" language="csharp"

# Encryption utilities
af_get_snippet name="aes-decrypt" language="c"
```

### Detection Analysis

```bash
# Suspicious API usage
af_detection_lookup type="suspicious_api" pattern="VirtualAllocEx"

# Sysmon detection patterns
af_detection_lookup type="sysmon" event_id="1"
```

---

## Agents

### Specialized Agents

<table>
<tr>
<th>Agent</th>
<th>Capability</th>
<th>Model</th>
<th>Focus</th>
</tr>
<tr>
<td><code>exploit-dev</code></td>
<td>Buffer overflows, format strings, web exploits</td>
<td>Sonnet</td>
<td>Vulnerability development</td>
</tr>
<tr>
<td><code>payload-eng</code></td>
<td>Shellcode, loaders, multi-stage payloads</td>
<td>Sonnet</td>
<td>Payload engineering</td>
</tr>
<tr>
<td><code>implant-dev</code></td>
<td>C2 frameworks, persistence, communication</td>
<td>Sonnet</td>
<td>Implant architecture</td>
</tr>
<tr>
<td><code>opsec-reviewer</code></td>
<td>Detection analysis, evasion guidance</td>
<td>Opus</td>
<td>Operational security</td>
</tr>
<tr>
<td><code>finding-writer</code></td>
<td>Report generation, documentation</td>
<td>Haiku</td>
<td>Technical writing</td>
</tr>
<tr>
<td><code>privesc-analyst</code></td>
<td>Privilege escalation research</td>
<td>Sonnet</td>
<td>Escalation techniques</td>
</tr>
</table>

### Agent Invocation

```bash
# Exploit development
/armsforge:exploit buffer-overflow --target windows --arch x64

# OPSEC review
/armsforge:opsec-review --code ./payload.c --target enterprise

# Privilege escalation research
/armsforge:privesc --os windows --method service

# Payload generation
/armsforge:payload shellcode --format exe --evasion 2

# Loader scaffolding
/armsforge:loader rust --technique process-hollowing
```

---

## Architecture

```
armsforge/
├── package.json                      # Dependencies, scripts, metadata
├── tsconfig.json                     # TypeScript compiler configuration
├── vitest.config.ts                  # Test runner configuration
│
├── src/                              # ── Source Code ──
│   ├── agents/                       # Specialized AI agents
│   │   ├── exploit-dev.ts            # Exploit development agent
│   │   ├── payload-eng.ts            # Payload engineering agent
│   │   ├── implant-dev.ts            # Implant development agent
│   │   ├── opsec-reviewer.ts         # OPSEC analysis agent
│   │   ├── finding-writer.ts         # Report generation agent
│   │   └── privesc-analyst.ts        # Privilege escalation agent
│   │
│   ├── mcp/                          # ── MCP Server ──
│   │   ├── server.ts                 # MCP server bridge
│   │   ├── tools.ts                  # Tool handler definitions (af_*)
│   │   └── validation.ts             # Zod schema validation
│   │
│   ├── templates/                    # ── Template Engine ──
│   │   ├── engine.ts                 # Template matching and generation
│   │   ├── loader.ts                 # Template file loading
│   │   └── customizer.ts             # Parameter injection
│   │
│   ├── config/                       # Configuration management
│   ├── theme/                        # Catppuccin styling
│   └── utils/                        # Utility functions
│
├── data/                             # ── Content ──
│   ├── templates/                    # 50+ exploit templates
│   ├── snippets/                     # 25+ reusable code snippets
│   └── detection/                    # Detection pattern database
│
├── test/                             # ── Tests ──
│   ├── integration/                  # MCP integration tests
│   └── unit/                         # Unit tests
│
├── skills/                           # ── Claude Code Skills ──
│   ├── exploit.md                    # Exploit development skill
│   ├── payload.md                    # Payload generation skill
│   ├── loader.md                     # Loader scaffolding skill
│   ├── opsec-review.md               # OPSEC review skill
│   ├── privesc.md                    # Privilege escalation skill
│   └── methodology.md               # Exam methodology skill
│
├── bridge/                           # CLI bridge
│
├── docs/                             # ── GitHub Pages ──
│   ├── index.html                    # Project website
│   └── assets/
│       ├── logo-dark.svg             # Logo for dark theme
│       └── logo-light.svg            # Logo for light theme
│
└── .github/
    ├── workflows/
    │   └── ci.yml                    # CI pipeline
    ├── ISSUE_TEMPLATE/
    │   ├── bug_report.yml            # Bug report form
    │   └── feature_request.yml       # Feature request form
    └── PULL_REQUEST_TEMPLATE.md      # PR checklist
```

### Execution Flow

### Stage 1: Initialization
1. **MCP Server Startup** — Node.js runtime initializes the MCP server bridge
2. **Tool Registration** — Six core tools registered with Zod-validated schemas
3. **Template Loading** — Template and snippet catalogs indexed from data directory
4. **Agent Configuration** — Specialized agents configured with model routing

### Stage 2: Request Processing
```
                   Claude Code CLI
                         │
         ┌───────┬───────┼───────┬───────┐
         │       │       │       │       │
      MCP Tools  Skills  Agents  Config
         │       │       │       │
         └───────┴───────┼───────┘
                         │
                  Template Engine
              Matching + Generation
                   + Validation
                         │
                    OPSEC Review
              Detection Risk Analysis
                + Evasion Guidance
```

### Stage 3: Code Generation
- Template engine matches request criteria to appropriate scaffold
- Parameter injection customizes code for target OS, arch, and evasion level
- Snippet integration adds reusable patterns (syscalls, crypto, injection)
- OPSEC review analyzes generated code against detection database
- Output formatted and validated before delivery

---

## OPSEC Guidelines

### Static Analysis Evasion

<table>
<tr>
<th>Technique</th>
<th>Description</th>
</tr>
<tr>
<td>String Encryption</td>
<td>No hardcoded strings — C2 URLs, credentials, and tool names encrypted at rest</td>
</tr>
<tr>
<td>Import Obfuscation</td>
<td>Suspicious Win32 API calls resolved dynamically to avoid static detection</td>
</tr>
<tr>
<td>Signature Avoidance</td>
<td>Code patterns avoid known malware signatures and YARA rule matches</td>
</tr>
<tr>
<td>Anti-Analysis</td>
<td>Sandbox detection, debugger checks, and timing-based evasion techniques</td>
</tr>
</table>

### Behavioral Evasion

<table>
<tr>
<th>Technique</th>
<th>Description</th>
</tr>
<tr>
<td>Alternative APIs</td>
<td>Avoid classic VirtualAllocEx/WriteProcessMemory/CreateRemoteThread sequences</td>
</tr>
<tr>
<td>Sleep/Jitter</td>
<td>Randomized delays to avoid rapid-fire behavioral detection</td>
</tr>
<tr>
<td>Memory Discipline</td>
<td>Minimize RWX allocations, prefer RW then RX transitions</td>
</tr>
<tr>
<td>Parent Spoofing</td>
<td>Process parent masquerading for legitimate-looking process trees</td>
</tr>
</table>

### Network Evasion

<table>
<tr>
<th>Technique</th>
<th>Description</th>
</tr>
<tr>
<td>Traffic Blending</td>
<td>Randomized user agents, headers, and legitimate-looking request patterns</td>
</tr>
<tr>
<td>Domain Fronting</td>
<td>CDN-based C2 communication hiding behind legitimate domains</td>
</tr>
<tr>
<td>Beacon Jitter</td>
<td>Randomized callback intervals to avoid periodic communication detection</td>
</tr>
<tr>
<td>Protocol Mimicry</td>
<td>C2 traffic disguised as normal HTTPS, DNS, or websocket communication</td>
</tr>
</table>

---

## Platform Support

<table>
<tr>
<th>Capability</th>
<th>Windows</th>
<th>Linux</th>
<th>macOS</th>
</tr>
<tr>
<td>MCP Tools</td>
<td>Full</td>
<td>Full</td>
<td>Full</td>
</tr>
<tr>
<td>Template Engine</td>
<td>Full</td>
<td>Full</td>
<td>Full</td>
</tr>
<tr>
<td>Exploit Templates</td>
<td>Full (primary target)</td>
<td>Full</td>
<td>Full</td>
</tr>
<tr>
<td>Payload Generation</td>
<td>Full (primary target)</td>
<td>Full</td>
<td>Limited</td>
</tr>
<tr>
<td>Process Injection</td>
<td>Full (Win32 APIs)</td>
<td>ptrace-based</td>
<td>Limited</td>
</tr>
<tr>
<td>Implant Templates</td>
<td>Full</td>
<td>Full</td>
<td>Partial</td>
</tr>
<tr>
<td>Detection Database</td>
<td>Full (Sysmon, ETW, AMSI)</td>
<td>Partial (auditd)</td>
<td>Partial</td>
</tr>
<tr>
<td>OPSEC Review</td>
<td>Full</td>
<td>Full</td>
<td>Full</td>
</tr>
<tr>
<td>Skill Commands</td>
<td>Full</td>
<td>Full</td>
<td>Full</td>
</tr>
<tr>
<td>Agent Orchestration</td>
<td>Full</td>
<td>Full</td>
<td>Full</td>
</tr>
</table>

---

## Security

### Vulnerability Reporting

**Report security issues via:**
- GitHub Security Advisories (preferred)
- Private disclosure to maintainers
- Responsible disclosure timeline (90 days)

**Do NOT:**
- Open public GitHub issues for vulnerabilities
- Disclose before coordination with maintainers
- Exploit vulnerabilities in unauthorized contexts

### What Armsforge Does NOT Do

Armsforge is a **development platform**, not an autonomous attack system:

- **Not an exploit kit** — Generates scaffolds and templates, not weaponized payloads
- **Not a C2 server** — Provides implant templates, does not host infrastructure
- **Not a scanner** — No active network reconnaissance or vulnerability scanning
- **Not autonomous** — Requires human operator judgment for all operations
- **Not a bypass guarantee** — OPSEC guidance is advisory, not a detection evasion guarantee

---

## License

MIT License

Copyright &copy; 2026 Real-Fruit-Snacks

```
THIS SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.
THE AUTHORS ARE NOT LIABLE FOR ANY DAMAGES ARISING FROM USE.
USE AT YOUR OWN RISK AND ONLY WITH PROPER AUTHORIZATION.
```

---

## Resources

- **GitHub**: [github.com/Real-Fruit-Snacks/armsforge](https://github.com/Real-Fruit-Snacks/armsforge)
- **Issues**: [Report a Bug](https://github.com/Real-Fruit-Snacks/armsforge/issues)
- **Security**: [SECURITY.md](SECURITY.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)

---

<div align="center">

**Part of the Real-Fruit-Snacks security toolkit**

[Tidepool](https://github.com/Real-Fruit-Snacks/Tidepool) • [Riptide](https://github.com/Real-Fruit-Snacks/Riptide) • [Cascade](https://github.com/Real-Fruit-Snacks/Cascade) • [Slipstream](https://github.com/Real-Fruit-Snacks/Slipstream) • [HydroShot](https://github.com/Real-Fruit-Snacks/HydroShot) • [Aquifer](https://github.com/Real-Fruit-Snacks/Aquifer) • [Conduit](https://github.com/Real-Fruit-Snacks/Conduit) • [Flux](https://github.com/Real-Fruit-Snacks/Flux) • **Armsforge**

*Remember: With great power comes great responsibility.*

</div>
