---
name: methodology
description: OSCP/OSEP exam methodology checklists and structured penetration testing workflows
---

# Methodology Skill

## Purpose
Provides structured methodology checklists for penetration testing and certification exams. Ensures comprehensive coverage and helps when feeling stuck.

## Use When
- Starting OSCP or OSEP exam
- Need structured approach for new penetration test
- Feeling stuck and want to review what hasn't been tried
- Want to ensure thorough methodology coverage
- Learning structured penetration testing approach

## Available Methodologies

### OSCP Exam Methodology
Time management and systematic approach for the OSCP exam environment.

### OSEP Exam Methodology
Advanced evasion-focused methodology for OSEP exam challenges.

### General Penetration Testing
Standard penetration testing methodology for real-world engagements.

### Red Team Operations
Methodology for longer-term adversarial simulations.

## OSCP Methodology

### Exam Preparation (First 30 minutes)
- [ ] Read exam instructions completely
- [ ] Set up documentation template
- [ ] Start AutoRecon/nmapAutomator against all targets
- [ ] Review Active Directory set (if present)
- [ ] Plan time allocation per target

### Per-Target Workflow
1. **Initial Enumeration** (15-30 minutes)
   - [ ] Full port scan results review
   - [ ] Service version identification
   - [ ] Web application discovery (if HTTP/HTTPS)
   - [ ] SMB enumeration (if port 445)
   - [ ] Check searchsploit for service versions

2. **Deep Enumeration** (30-60 minutes)
   - [ ] Directory/file bruteforcing (if web)
   - [ ] Anonymous access testing (FTP, SMB, etc.)
   - [ ] Default credential testing
   - [ ] Manual service interaction
   - [ ] UDP scan if TCP unsuccessful

3. **Exploitation** (Variable)
   - [ ] Exploit development if needed
   - [ ] Payload generation and testing
   - [ ] Shell stabilization
   - [ ] Proof collection (user.txt/local.txt)

4. **Privilege Escalation** (30-90 minutes)
   - [ ] System enumeration (OS, patches, users)
   - [ ] Automated privilege escalation scan
   - [ ] Manual privilege escalation checks
   - [ ] Proof collection (root.txt/proof.txt)

5. **Documentation**
   - [ ] Screenshot proof files immediately
   - [ ] Document full attack chain
   - [ ] Note IP addresses and hostnames
   - [ ] Record all commands used

### Stuck Protocol (15-minute rule)
When stuck for 15+ minutes:
- [ ] Re-read enumeration output — did you miss something?
- [ ] Try different wordlists for bruteforcing
- [ ] Check UDP ports if only TCP scanned
- [ ] Google service versions + "exploit"
- [ ] Look for configuration files or hidden directories
- [ ] Try different authentication methods
- [ ] Move to another target and return later

## OSEP Methodology

### Evasion-First Approach
- [ ] Test all payloads against Windows Defender before deployment
- [ ] Use custom loaders instead of msfvenom defaults
- [ ] Implement AMSI bypass for PowerShell/C# payloads
- [ ] Consider ETW evasion for advanced techniques
- [ ] Test network detection with custom C2 profiles

### Client-Side Attacks
- [ ] Macro development and testing
- [ ] DLL hijacking opportunities
- [ ] Application allowlist bypasses
- [ ] Social engineering context development
- [ ] Delivery method selection and testing

### Active Directory Focus
- [ ] Domain mapping with BloodHound
- [ ] Certificate Services enumeration (Certipy)
- [ ] Kerberoasting and AS-REP roasting
- [ ] Delegation abuse opportunities
- [ ] ACL abuse identification
- [ ] Cross-domain trust analysis

### Post-Exploitation
- [ ] Credential harvesting with evasion
- [ ] Lateral movement planning
- [ ] Persistence mechanism deployment
- [ ] Data exfiltration simulation
- [ ] Evidence cleanup

## Tool Development Methodology
For custom tool creation:

1. **Requirements Analysis**
   - [ ] Define tool purpose and scope
   - [ ] Identify target platforms and constraints
   - [ ] Determine evasion requirements

2. **Design Phase**
   - [ ] Select appropriate language and libraries
   - [ ] Plan architecture and data flow
   - [ ] Identify reusable templates and snippets
   - [ ] Design error handling and logging

3. **Implementation**
   - [ ] Use `/armsforge:exploit|payload|loader` for scaffolding
   - [ ] Integrate snippets for common patterns
   - [ ] Build incrementally with frequent testing
   - [ ] Document code for future maintenance

4. **Testing & Validation**
   - [ ] Unit testing for individual components
   - [ ] Integration testing in target environment
   - [ ] OPSEC review with `/armsforge:opsec-review`
   - [ ] Performance and reliability testing

5. **Deployment**
   - [ ] Final evasion validation
   - [ ] Delivery method preparation
   - [ ] Backup plan development
   - [ ] Post-deployment monitoring plan

## Time Management Tips

### OSCP Exam (23.75 hours)
- **AD Set**: 6-8 hours (if present)
- **Standalone targets**: 3-4 hours each
- **Buffer time**: 2-3 hours for stuck targets
- **Documentation**: 2-3 hours for report
- **Breaks**: Regular 15-minute breaks every 2 hours

### OSEP Exam (47.75 hours)
- **Day 1**: Focus on initial access and enumeration
- **Day 2**: Focus on privilege escalation and lateral movement
- **Documentation**: Continuous throughout, final 4-6 hours

## Skill Invocation

**Explicit**: `/armsforge:methodology [type]`
Examples:
- `/armsforge:methodology oscp` — OSCP exam methodology
- `/armsforge:methodology osep` — OSEP exam methodology
- `/armsforge:methodology pentest` — General penetration testing
- `/armsforge:methodology redteam` — Red team methodology

**Auto-detection**:
- "exam methodology"
- "OSCP approach"
- "what haven't I tried"
- "stuck on target"
- "need checklist"