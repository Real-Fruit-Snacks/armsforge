---
name: privesc
description: Privilege escalation methodology and analysis for Windows and Linux systems
---

# Privesc Skill

## Purpose
Systematic approach to privilege escalation on Windows and Linux. Analyzes enumeration output and provides ranked escalation vectors with exact exploitation commands.

## Use When
- Have low-privilege shell and need to escalate
- Analyzing linpeas/winpeas/PowerUp output for escalation paths
- OSCP/OSEP exam — need structured escalation approach
- Want comprehensive privesc methodology checklist

## Supported Platforms

### Windows
- **Local Exploits**: CVE-based kernel/privilege escalation
- **Service Misconfiguration**: Unquoted paths, weak permissions, DLL hijacking
- **Registry Issues**: AutoLogon, stored credentials, weak ACLs
- **Scheduled Tasks**: Writable task files, path hijacking
- **Token Abuse**: SeImpersonatePrivilege (Potato attacks), SeBackupPrivilege
- **AD Escalation**: Kerberoasting, AS-REP roasting, delegation abuse, ACL abuse

### Linux
- **SUID/SGID Binaries**: GTFOBins exploitation, capabilities abuse
- **Cron Jobs**: Writable scripts, PATH hijacking, wildcard injection
- **Service Exploitation**: Writable service files, systemd abuse
- **Sudo Misconfiguration**: ALL privileges, command injection, library loading
- **Container Escapes**: Docker group, privileged containers, mounted volumes
- **Kernel Exploits**: DirtyCow, DirtyPipe, local root exploits

## Execution Workflow

1. **OS Detection**: Determine Windows or Linux target
2. **Enumeration**: Run appropriate tools if not done already
3. **Analysis**:
   - If enumeration output provided: Delegate to `privesc-analyst`
   - If no enumeration: Provide enumeration guidance
4. **Ranking**: Receive escalation paths ranked by reliability and stealth
5. **Exploitation**: Execute most promising path with exact commands

## Enumeration Tools

### Windows
- **winPEAS**: Comprehensive Windows privilege escalation scanner
- **PowerUp**: PowerShell privilege escalation framework
- **SharpUp**: C# version of PowerUp, AMSI-resistant
- **Seatbelt**: Security-focused system information gathering
- **Watson**: Windows exploit suggester
- **JAWS**: Just Another Windows (enum) Script

### Linux
- **linPEAS**: Comprehensive Linux privilege escalation scanner
- **LinEnum**: Linux enumeration script
- **linux-exploit-suggester**: Kernel exploit identification
- **pspy**: Process monitoring without root
- **unix-privesc-check**: Unix privilege escalation scanner

### Active Directory
- **BloodHound**: AD attack path analysis
- **SharpHound**: BloodHound data collector
- **PowerView**: AD enumeration and exploitation
- **Certify/Certipy**: AD Certificate Services abuse

## Agent Instructions
When delegating to `privesc-analyst`:
- Provide enumeration output or available system information
- Specify target OS (Windows/Linux) and version if known
- Note current user privileges and group memberships
- Request ranked escalation paths with exact commands
- Ask for reliability assessment (stable vs risky techniques)

## Escalation Path Format
Expected output format:
```
## Path 1: [Name] — [Reliability: HIGH/MEDIUM/LOW]
**Vector**: [Category - e.g., Service Misconfiguration]
**Evidence**: [What enumeration found]
**Exploitation**:
```
[exact commands]
```
**Risk**: [What could go wrong]
```

## OSCP/OSEP Focus
For exam scenarios:
- Emphasizes reliable, well-documented techniques
- Avoids kernel exploits (unstable, use as last resort)
- Focuses on misconfigurations over zero-days
- Provides step-by-step methodology checklists
- Includes common gotchas and troubleshooting

## Skill Invocation

**Explicit**: `/armsforge:privesc [os]`
Examples:
- `/armsforge:privesc windows` — Windows escalation analysis
- `/armsforge:privesc linux` — Linux escalation analysis
- `/armsforge:privesc ad` — Active Directory escalation

**Auto-detection**:
- "privilege escalation"
- "escalate privileges"
- "get root"
- "get SYSTEM"
- "privesc"
- "become administrator"