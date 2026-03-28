---
name: questioner
description: Structured requirement gathering for complex offensive projects with QCDC workflow
---

# Questioner Skill

## Purpose
Implements structured requirement-gathering sessions for complex offensive security projects. Ensures comprehensive understanding through systematic questioning before project execution begins.

## Use When
- User provides vague or ambiguous project requests
- Complex multi-stage offensive projects requiring planning
- When QCDC workflow enforcement suggests clarification needed
- Beginning new engagement or development work
- Planning tool/implant/exploit development with unclear requirements

## QCDC Implementation
This skill embodies the **QUESTION** phase of the Question-Check-Do-Check workflow. It asks one focused question at a time and builds comprehensive understanding before handoff.

## Workflow Protocol

### Phase 1: Target Environment Analysis
- [ ] What is the target environment? (Windows/Linux/macOS/Network/Web App)
- [ ] What version/patch level? (OS version, service pack, application version)
- [ ] What security controls are present? (AV/EDR/SIEM/WAF/Network monitoring)
- [ ] What is the network topology? (DMZ/Internal/Air-gapped/Cloud)
- [ ] What privilege level do you currently have? (None/User/Admin/Root)

### Phase 2: Objective Clarification
- [ ] What is the primary objective? (Initial access/Persistence/Lateral movement/Data exfiltration/DoS)
- [ ] What are the secondary objectives? (Credential harvesting/System enumeration/Network mapping)
- [ ] What is the engagement timeline? (Time constraints/Persistence duration)
- [ ] What are the success criteria? (Specific files/systems/access levels)
- [ ] Are there any restrictions? (Stealth requirements/Non-destructive only)

### Phase 3: Technical Constraints
- [ ] What delivery method is preferred? (Phishing/Physical/Web exploit/Service exploit)
- [ ] What payload format is required? (EXE/DLL/Shellcode/Script/Web shell)
- [ ] What architecture is the target? (x86/x64/ARM)
- [ ] What programming language preference? (C/C#/Rust/Go/Python)
- [ ] What evasion level is needed? (Basic/Intermediate/Advanced)

### Phase 4: OPSEC Requirements
- [ ] What is the detection tolerance? (Stealth required/Detection acceptable)
- [ ] What attribution concerns exist? (TTPs to avoid/Specific techniques preferred)
- [ ] What cleanup is required? (Logs/Files/Registry/Network artifacts)
- [ ] What monitoring evasion is needed? (Process/Network/File system)

## Question Protocol

**One question at a time** - Wait for complete answer before next question
**Build understanding incrementally** - Use previous answers to inform next questions
**Validate understanding** - Repeat back key requirements for confirmation
**Document thoroughly** - Maintain session notes throughout

## Completion Criteria

The questioner session ends when:
1. All relevant phases are completed
2. User confirms understanding is complete
3. Clear project specification can be generated
4. Appropriate skill can be identified for execution

## CHECK Phase Summary

Upon completion, provide a comprehensive summary:

```
## Project Specification Summary

**Target Environment:**
- Platform: [OS/Service]
- Security Controls: [AV/EDR/etc.]
- Network: [topology]

**Objectives:**
- Primary: [main goal]
- Secondary: [additional goals]
- Success: [criteria]

**Technical Requirements:**
- Delivery: [method]
- Payload: [format]
- Architecture: [x86/x64]
- Language: [preference]
- Evasion: [level]

**OPSEC Requirements:**
- Detection: [tolerance]
- Attribution: [concerns]
- Cleanup: [requirements]

**Recommended Next Steps:**
Use `/armsforge:[skill]` to begin implementation
```

## Skill Invocation

**Explicit**: `/armsforge:questioner`

**Auto-detection**:
- "clarify requirements"
- "need more details"
- "what information do you need"
- "help me plan"
- "unclear objectives"
- "complex project"

## Integration

After questioner completion, common next steps:
- `/armsforge:exploit` - for exploit development
- `/armsforge:payload` - for payload generation
- `/armsforge:loader` - for loader development
- `/armsforge:methodology` - for systematic approach
- `/armsforge:qa-loop` - for iterative development