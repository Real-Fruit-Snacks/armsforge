<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Real-Fruit-Snacks/armsforge/main/docs/assets/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Real-Fruit-Snacks/armsforge/main/docs/assets/logo-light.svg">
  <img alt="Armsforge" src="https://raw.githubusercontent.com/Real-Fruit-Snacks/armsforge/main/docs/assets/logo-dark.svg" width="420">
</picture>

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Claude](https://img.shields.io/badge/Claude-MCP-orange?style=flat)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**AI-powered security platform with Claude Code integration**

Exploit development with automated shellcode generation. Payload engineering with evasion techniques. Implant scaffolding with C2 channels. OPSEC analysis with detection risk assessment. MCP tool integration for workflow automation. Template and snippet system for rapid development.

[Quick Start](#quick-start) · [Features](#features) · [Architecture](#architecture) · [Platform Support](#platform-support)

</div>

---

## Quick Start

```bash
git clone https://github.com/Real-Fruit-Snacks/armsforge.git
cd armsforge
npm install
npm run build
```

```bash
# Development with watch mode
npm run dev

# Run tests
npm test
```

### Verify MCP integration

```bash
# In Claude Code
af_list_templates
af_get_template name="bof-exploit" target_os="windows"

# Skill invocation
/armsforge:exploit buffer-overflow
/armsforge:opsec-review
```

---

## Features

### MCP Tools

Six core tools registered via the Model Context Protocol with Zod-validated parameters and structured output.

| Tool | Purpose |
|---|---|
| `af_list_templates` | Browse exploit template catalog by category, language, arch |
| `af_get_template` | Retrieve customized exploit code with target parameters |
| `af_list_snippets` | Browse reusable code snippets by language and technique |
| `af_get_snippet` | Retrieve specific code patterns |
| `af_detection_lookup` | Analyze detection risk for APIs, Sysmon events, patterns |
| `af_template_info` | Get detailed template capability metadata |

```bash
# List templates filtered by category
af_list_templates category="exploit" language="python" arch="x64"

# Generate a customized exploit
af_get_template name="bof-exploit" target_os="windows" target_arch="x64"

# Look up detection risk
af_detection_lookup type="suspicious_api" pattern="VirtualAllocEx"
```

### Template System

50+ exploit templates covering buffer overflows, process injection, HTTP stagers, and C2 implant skeletons. 25+ reusable code snippets for syscalls, encryption, injection, and API hooks. Language-specific scaffolds for Python, C#, Rust, and Go.

```bash
# Process injection snippet
af_get_snippet name="process-injection" language="csharp"

# Encryption utility
af_get_snippet name="aes-decrypt" language="c"
```

### Agent Orchestration

Specialized AI agents for every offensive discipline, invoked through Claude Code skills.

| Agent | Focus | Model |
|---|---|---|
| `exploit-dev` | Buffer overflows, format strings, web exploits | Sonnet |
| `payload-eng` | Shellcode, loaders, multi-stage payloads | Sonnet |
| `implant-dev` | C2 frameworks, persistence, communication | Sonnet |
| `opsec-reviewer` | Detection analysis, evasion guidance | Opus |
| `finding-writer` | Report generation, documentation | Haiku |
| `privesc-analyst` | Privilege escalation research | Sonnet |

```bash
/armsforge:exploit buffer-overflow --target windows --arch x64
/armsforge:opsec-review --code ./payload.c --target enterprise
/armsforge:privesc --os windows --method service
/armsforge:payload shellcode --format exe --evasion 2
```

### OPSEC Analysis

Comprehensive detection risk assessment across AV, EDR, SIEM, and SOC controls. Suspicious API pattern matching against known signatures. Sysmon event correlation, ETW provider analysis, and AMSI trigger identification with bypass guidance.

### Exploit Development

AI-accelerated exploit framework covering buffer overflows, format strings, web exploits, and deserialization attacks. Automated shellcode generation with target-specific customization. Smart ROP chain construction and templates for every major vulnerability class.

### Payload Engineering

Advanced payload generation with multi-stage delivery systems. Custom encoders and polymorphic engines. Shellcode loaders in C, C#, Rust, Go, and Nim. Evasion techniques that adapt to target defensive posture.

### Implant Development

C2 framework scaffolding with persistent access modules. Stealth communication channels using domain fronting and beacon jitter. Process injection techniques with OPSEC-safe patterns. Memory-only operation support.

---

## Architecture

```
armsforge/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── agents/
│   │   ├── exploit-dev.ts        # Exploit development agent
│   │   ├── payload-eng.ts        # Payload engineering agent
│   │   ├── implant-dev.ts        # Implant development agent
│   │   ├── opsec-reviewer.ts     # OPSEC analysis agent
│   │   ├── finding-writer.ts     # Report generation agent
│   │   └── privesc-analyst.ts    # Privilege escalation agent
│   ├── mcp/
│   │   ├── server.ts             # MCP server bridge
│   │   ├── tools.ts              # Tool definitions (af_*)
│   │   └── validation.ts         # Zod schema validation
│   ├── templates/
│   │   ├── engine.ts             # Template matching and generation
│   │   ├── loader.ts             # Template file loading
│   │   └── customizer.ts         # Parameter injection
│   ├── config/                   # Configuration management
│   ├── theme/                    # Catppuccin styling
│   └── utils/                    # Utility functions
├── data/
│   ├── templates/                # 50+ exploit templates
│   ├── snippets/                 # 25+ reusable code snippets
│   └── detection/                # Detection pattern database
├── test/
│   ├── integration/              # MCP integration tests
│   └── unit/                     # Unit tests
├── skills/
│   ├── exploit.md                # Exploit development skill
│   ├── payload.md                # Payload generation skill
│   ├── loader.md                 # Loader scaffolding skill
│   ├── opsec-review.md           # OPSEC review skill
│   ├── privesc.md                # Privilege escalation skill
│   └── methodology.md           # Exam methodology skill
├── docs/
│   ├── index.html
│   └── assets/
│       ├── logo-dark.svg
│       └── logo-light.svg
└── .github/workflows/
    └── ci.yml                    # CI pipeline
```

The MCP server initializes with six Zod-validated tools, indexes the template and snippet catalogs from the data directory, and configures specialized agents with model routing. Requests flow through the template engine for matching, parameter injection, and OPSEC review before delivery.

---

## Platform Support

| Capability | Windows | Linux | macOS |
|---|---|---|---|
| MCP Tools | Full | Full | Full |
| Template Engine | Full | Full | Full |
| Exploit Templates | Full (primary) | Full | Full |
| Payload Generation | Full (primary) | Full | Limited |
| Process Injection | Full (Win32) | ptrace-based | Limited |
| Implant Templates | Full | Full | Partial |
| Detection Database | Full (Sysmon, ETW, AMSI) | Partial (auditd) | Partial |
| OPSEC Review | Full | Full | Full |
| Agent Orchestration | Full | Full | Full |

---

## License

[MIT](LICENSE) -- Copyright 2026 Real-Fruit-Snacks
