# Armsforge Documentation Index

Complete guide to all Armsforge documentation files and how to use them.

## Quick Navigation

### For First-Time Users
Start here:
1. **[README.md](./README.md)** — Overview, features, installation
2. **[API.md](./API.md)** — Available MCP tools and how to use them
3. **[TEMPLATES.md](./TEMPLATES.md)** — Code templates and customization

### For Active Users
Common references:
1. **[WORKFLOWS.md](./WORKFLOWS.md)** — Step-by-step guides for real tasks
2. **[API.md](./API.md)** — Tool reference for MCP tools
3. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** — Problem solving

### For Red Teamers
Specialized documentation:
1. **[WORKFLOWS.md](./WORKFLOWS.md)** → Workflow 2: Red Team Process Injection
2. **[TEMPLATES.md](./TEMPLATES.md)** → Loader Templates section
3. **[SECURITY.md](./SECURITY.md)** → Legal and ethical guidelines

### For OSCP/OSEP Preparation
Exam preparation:
1. **[WORKFLOWS.md](./WORKFLOWS.md)** → Workflow 1: OSCP Buffer Overflow
2. **[TEMPLATES.md](./TEMPLATES.md)** → Exploit Templates section
3. **[API.md](./API.md)** → Detection Lookup for understanding detection patterns

### For Contributors
Development:
1. **[CONTRIBUTING.md](./CONTRIBUTING.md)** — How to contribute
2. **[DEVELOPMENT.md](./DEVELOPMENT.md)** — Setup and architecture
3. **[README.md](./README.md)** → Architecture section

### For Legal/Compliance
Authorization and ethics:
1. **[SECURITY.md](./SECURITY.md)** — Legal framework and authorization
2. **[README.md](./README.md)** → Important Notes section

---

## Documentation Files

### 1. README.md (331 lines)
**Purpose**: Main entry point and overview

**Contains**:
- Feature list
- Installation instructions (3 methods)
- Quick start guide
- Architecture overview
- MCP tools summary (table)
- 8 specialized agents summary
- Code organization structure
- 3 detailed usage examples
- Legal disclaimers
- Safe lab setup instructions
- Catppuccin theme reference
- Workflow overview (OSCP, Red Team, Pentest)
- Support and feedback information

**Read this if you**:
- Are installing Armsforge for the first time
- Need a high-level overview
- Want to understand what's available
- Need installation troubleshooting

### 2. API.md (526 lines)
**Purpose**: Complete MCP tool reference

**Contains**:
- Overview of 5 MCP tools
- Detailed reference for each tool:
  - af_list_templates
  - af_get_template
  - af_list_snippets
  - af_get_snippet
  - af_detection_lookup
- Input/output specifications
- Usage examples for each tool
- Error handling guide
- Integration patterns (4 patterns)
- Rate limiting info
- Troubleshooting for tool issues
- 3 comprehensive examples by security domain

**Read this if you**:
- Need to understand specific MCP tools
- Want to know what parameters tools accept
- Looking for integration patterns
- Need tool examples

### 3. TEMPLATES.md (564 lines)
**Purpose**: Complete template system guide

**Contains**:
- Overview of template system
- 6 template descriptions:
  - bof-exploit.py (Buffer Overflow)
  - python-exploit.py (Advanced Python)
  - loader-injection.cs (C# Process Injection)
  - implant-skeleton.rs (Rust C2)
  - stager-http.go (HTTP Stager)
- Customization workflow (7 steps)
- Common customization examples (3 examples)
- Template + snippet integration workflow
- Build instructions for each language
- Testing templates (unit + integration)
- Template versioning info
- Custom template creation guide
- Best practices checklist

**Read this if you**:
- Want to use a template
- Need to customize a template
- Want to build binaries from templates
- Need integration examples
- Planning to create custom templates

### 4. WORKFLOWS.md (781 lines)
**Purpose**: Real-world step-by-step guides

**Contains**:
- 5 complete workflows:
  1. OSCP Buffer Overflow Preparation (8 steps)
  2. Red Team Process Injection (12 steps)
  3. OSEP Privilege Escalation Research (8 steps)
  4. OPSEC Review Process (10 steps)
  5. Detection Evasion Research (6 steps)
- Each workflow includes:
  - Goal and time estimate
  - Prerequisites
  - Detailed step-by-step instructions
  - Tool invocations (exact commands)
  - Lab setup guidance
  - Verification steps
  - Troubleshooting tips
- Quick reference section
- Integration patterns table

**Read this if you**:
- Want to perform a specific task
- Need step-by-step guidance
- Preparing for OSCP/OSEP
- Conducting red team operations
- Setting up lab environment

### 5. SECURITY.md (573 lines)
**Purpose**: Legal, ethical, and responsible use guidelines

**Contains**:
- Mission statement
- Legal framework:
  - Authorized use requirements
  - US laws (CFAA)
  - International laws (UK, Canada, EU, Australia)
- Authorization checklist (10 items)
- Responsible disclosure:
  - Documentation steps
  - Severity classification
  - Disclosure timeline
  - Notification process
  - Example email template
- Ethical use guidelines (DO/DON'T lists)
- Safe lab environment setup:
  - Network isolation
  - VM setup
  - Monitoring and logging
  - Snapshots and recovery
- Data protection and privacy:
  - Handling sensitive data
  - GDPR, CCPA, HIPAA, PCI-DSS compliance
- Incident response procedures
- Tool responsibility guidelines
- Industry certifications (OSCP, OSEP, CEH, PTES)
- Professional ethics and code of conduct
- Quick reference checklist

**Read this if you**:
- Are conducting authorized testing
- Need to understand legal requirements
- Want to set up safe lab
- Need compliance guidance
- Planning security disclosure
- Starting in offensive security

### 6. TROUBLESHOOTING.md (826 lines)
**Purpose**: Common issues and solutions

**Contains**:
- Installation issues (5 scenarios):
  - Plugin not appearing
  - Manual installation failed
  - Node.js/npm problems
  - Permission issues
- Template/snippet issues (6 scenarios):
  - File not found
  - Filename case sensitivity
  - Permission problems
- Detection lookup issues (4 scenarios):
  - Data not found
  - Corrupted data
  - Query too specific
- Development issues:
  - Python template problems
  - C# compilation failures
  - Rust build errors
  - Go compilation issues
- Execution issues:
  - Exploit doesn't connect
  - Shellcode doesn't execute
  - Loader injection fails
  - AV detection
- OPSEC review issues (2 scenarios)
- Lab environment issues (2 scenarios):
  - Sysmon not logging
  - Process Monitor empty
- Template customization issues (3 scenarios)
- Each issue includes:
  - Symptom description
  - 3-5 solution steps
  - Verification steps

**Read this if you**:
- Encounter an error
- Something isn't working
- Need to debug installation
- Getting "not found" errors
- Binaries don't execute

### 7. CONTRIBUTING.md (571 lines)
**Purpose**: Contribution guidelines for developers

**Contains**:
- Code of conduct
- Getting started:
  - Prerequisites (Node.js, git, etc.)
  - Development environment setup
  - Project structure overview
- Contributing templates:
  - Template requirements
  - Adding new templates (4 steps)
  - Template checklist (9 items)
- Contributing snippets:
  - Snippet requirements
  - Adding snippets (4 steps)
- Contributing detection data:
  - Data file format
  - Research and addition process
  - Quality guidelines
- Contributing agents:
  - Agent file format
  - Agent creation (5 steps)
- Code changes:
  - Running tests
  - Code style guidelines
  - Making changes (4 steps)
  - PR requirements (7 items)
- Security issue reporting
- Documentation improvements
- Community guidelines
- Contributor license agreement
- Review process (checklist and timeline)
- Release process
- Recognition for contributors

**Read this if you**:
- Want to contribute code
- Planning to add templates/snippets
- Want to improve documentation
- Developing new features
- Reporting security issues

---

## Usage Patterns

### Pattern 1: "I want to learn Armsforge"
1. Read: README.md → Overview and features
2. Read: README.md → Architecture section
3. Read: API.md → Overview section
4. Try: API.md → Example 1 (Get template)

### Pattern 2: "I need to do [specific task]"
1. Go to: WORKFLOWS.md
2. Find: Relevant workflow for your task
3. Follow: Step-by-step instructions
4. Use: Tools as instructed
5. Reference: API.md if tools unclear

### Pattern 3: "Something isn't working"
1. Go to: TROUBLESHOOTING.md
2. Find: Relevant symptom section
3. Try: Solutions listed
4. Check: Verification steps
5. If still broken: Check README → Support section

### Pattern 4: "I'm preparing for OSCP"
1. Read: README.md → OSCP support section
2. Study: WORKFLOWS.md → Workflow 1
3. Practice: Using bof-exploit.py template
4. Research: API.md → Detection Lookup
5. Review: SECURITY.md → Ethical guidelines

### Pattern 5: "I'm doing red team ops"
1. Read: SECURITY.md → Authorization section
2. Study: WORKFLOWS.md → Workflow 2
3. Use: TEMPLATES.md → Loader templates
4. Research: API.md → Detection lookup
5. Review: WORKFLOWS.md → Workflow 4 (OPSEC)

### Pattern 6: "I want to contribute"
1. Read: CONTRIBUTING.md → Getting started
2. Choose: What to contribute (template/snippet/code)
3. Follow: Relevant contribution section
4. Submit: Pull request with description
5. Wait: For review feedback

---

## Key Concepts by Document

### README.md Key Concepts
- What Armsforge is and what it does
- How to install it
- What specialized agents are available
- How to use the MCP tools
- Safe testing environment setup
- Legal disclaimers

### API.md Key Concepts
- 5 MCP tools available
- What each tool does and accepts
- Detection reference data sources
- Integration patterns for common tasks
- Error handling and recovery
- Real-world examples

### TEMPLATES.md Key Concepts
- Template-based development approach
- How to customize templates
- Build procedures for different languages
- Integration with snippets
- Testing and verification
- OPSEC considerations in templates

### WORKFLOWS.md Key Concepts
- Step-by-step task completion
- Real-world scenario examples
- Lab environment requirements
- Verification and testing procedures
- Integration of multiple tools
- OPSEC analysis and evasion

### SECURITY.md Key Concepts
- Legal authorization requirements
- Responsible disclosure practices
- Ethical use guidelines
- Lab isolation requirements
- Data protection and compliance
- Professional standards and conduct

### TROUBLESHOOTING.md Key Concepts
- Common failure modes
- Systematic debugging approach
- Recovery procedures
- Verification methods
- When and how to get help

### CONTRIBUTING.md Key Concepts
- Code quality standards
- Testing requirements
- Documentation standards
- Community guidelines
- Contribution process
- Review expectations

---

## Document Statistics

| Document | Lines | Size | Focus |
|----------|-------|------|-------|
| README.md | 331 | 11K | Overview, installation, features |
| API.md | 526 | 15K | Tool reference, examples |
| TEMPLATES.md | 564 | 14K | Template system, customization |
| WORKFLOWS.md | 781 | 18K | Real-world step-by-step guides |
| SECURITY.md | 573 | 15K | Legal, ethical, responsible use |
| TROUBLESHOOTING.md | 826 | 18K | Problem-solving, debugging |
| CONTRIBUTING.md | 571 | 12K | Contribution guidelines |
| **TOTAL** | **4,172** | **103K** | **Complete Armsforge documentation** |

---

## Recommended Reading Order

### For New Users
1. README.md (15 min)
2. API.md → Overview (5 min)
3. WORKFLOWS.md → Intro (5 min)
4. Try first example from README.md (10 min)
5. API.md → Example usage (10 min)

**Total: 45 minutes to productive use**

### For Operators
1. SECURITY.md → Authorization (10 min)
2. WORKFLOWS.md → Relevant workflow (30 min)
3. API.md → Tool reference as needed (5 min per lookup)
4. TEMPLATES.md → Customization as needed (10 min per template)

### For Security Researchers
1. SECURITY.md → Complete (20 min)
2. WORKFLOWS.md → Workflow 5 (20 min)
3. API.md → Detection Lookup section (10 min)
4. TEMPLATES.md → Advanced examples (15 min)

### For Contributors
1. CONTRIBUTING.md → Complete (30 min)
2. README.md → Architecture (10 min)
3. TEMPLATES.md → Template requirements (10 min)
4. Code review of existing contribution (15 min)

---

## File Locations

All documentation files are in the project root:

```
armsforge/
├── README.md                    # Start here
├── API.md                       # Tool reference
├── TEMPLATES.md                 # Template guide
├── WORKFLOWS.md                 # Step-by-step guides
├── SECURITY.md                  # Legal & ethics
├── TROUBLESHOOTING.md           # Problem solving
├── CONTRIBUTING.md              # For contributors
├── DOCUMENTATION_INDEX.md       # This file
├── CLAUDE.md                    # Development context
└── [other files]
```

---

## Getting Help

### For Different Questions

| Question | Start Here |
|----------|-----------|
| "How do I install?" | README.md → Installation |
| "How do I use X tool?" | API.md → Tool reference |
| "How do I [task]?" | WORKFLOWS.md → Find workflow |
| "It's not working" | TROUBLESHOOTING.md |
| "Is this legal?" | SECURITY.md |
| "How do I contribute?" | CONTRIBUTING.md |
| "What's this for?" | README.md → Overview |
| "How does X work?" | API.md or TEMPLATES.md |

### Support Channels

1. **Documentation**: Start with this index
2. **Troubleshooting**: See TROUBLESHOOTING.md
3. **GitHub Issues**: Report bugs or request features
4. **GitHub Discussions**: Ask questions
5. **Code Review**: Submit PRs following CONTRIBUTING.md

---

## Quick Checklists

### Before Using Armsforge
- [ ] Read SECURITY.md → Authorization section
- [ ] Obtained written authorization
- [ ] Set up isolated lab environment
- [ ] Understand legal requirements in your jurisdiction
- [ ] Read README.md → Important Notes

### Before Running an Exploit
- [ ] Lab environment isolated from production
- [ ] Monitoring enabled (Sysmon, Process Monitor)
- [ ] Listener configured and running
- [ ] Target accessible
- [ ] Bad characters identified
- [ ] OPSEC review completed
- [ ] Backup plan if detection occurs

### Before Deploying to Production
- [ ] Authorization verified and documented
- [ ] Scope clearly defined
- [ ] Incident response plan in place
- [ ] Client communication established
- [ ] Legal review completed (if required)
- [ ] Insurance/liability confirmed
- [ ] Comprehensive OPSEC analysis done

---

## Version Information

- **Documentation Version**: 1.0
- **Last Updated**: March 2026
- **Armsforge Version**: 0.1.0
- **Compatible with**: Node.js >= 20.0.0

---

**This index provides a complete map of Armsforge documentation. Start with README.md and follow the recommended reading order for your use case.**

For questions: See Support section in README.md
