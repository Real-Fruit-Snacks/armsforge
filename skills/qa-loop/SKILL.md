---
name: qa-loop
description: Automated test-verify-fix cycling for offensive tools and exploits with QCDC workflow
---

# QA Loop Skill

## Purpose
Implements automated test-verify-fix cycling for offensive security tools, exploits, and implants. Ensures quality and reliability through systematic testing and validation loops.

## Use When
- After developing exploits, payloads, or loaders
- When tools fail in target environment
- For iterative improvement of offensive code
- Before deploying tools in live engagement
- When OPSEC review reveals issues requiring fixes

## QCDC Implementation
This skill embodies both **CHECK** phases of the Question-Check-Do-Check workflow, providing automated verification and validation loops.

## Loop Phases

### DO Phase: Execute/Test
- [ ] Run exploit against target environment
- [ ] Execute payload delivery mechanism
- [ ] Test loader functionality
- [ ] Validate implant communication
- [ ] Verify persistence mechanisms

### CHECK Phase: Validate Results
- [ ] Analyze execution output
- [ ] Check error messages and logs
- [ ] Validate expected behavior
- [ ] Confirm success criteria met
- [ ] Document issues discovered

### FIX Phase: Address Issues
- [ ] Identify root cause of failures
- [ ] Implement targeted fixes
- [ ] Update error handling
- [ ] Improve reliability
- [ ] Enhance compatibility

### Iteration Control
- **Default max iterations**: 3
- **Success condition**: All tests pass
- **Failure condition**: Max iterations reached
- **Manual override**: User can extend or terminate

## Testing Categories

### Functional Testing
- **Basic execution**: Tool runs without crashes
- **Parameter handling**: Accepts and processes inputs correctly
- **Error conditions**: Graceful handling of invalid inputs
- **Output validation**: Produces expected results

### Environment Testing
- **Target compatibility**: Works on intended platform
- **Version compatibility**: Functions across OS/service versions
- **Privilege testing**: Operates at expected privilege levels
- **Network conditions**: Functions under network constraints

### OPSEC Testing
- **Detection analysis**: Review with `/armsforge:opsec-review`
- **Artifact validation**: Check for unwanted file/registry artifacts
- **Process behavior**: Validate process execution patterns
- **Network signatures**: Analyze communication patterns

### Reliability Testing
- **Stress testing**: Multiple executions
- **Edge case handling**: Boundary conditions
- **Race condition testing**: Concurrent execution scenarios
- **Memory/resource usage**: Performance validation

## Loop Protocol

```
ITERATION N (max 3):

1. [DO] Execute test suite
2. [CHECK] Analyze results
   - ✓ PASS: Continue to next test
   - ✗ FAIL: Proceed to FIX phase
3. [FIX] Address identified issues
4. [CHECK] Validate fix effectiveness
   - ✓ FIXED: Next iteration
   - ✗ PERSISTENT: Document and continue or escalate

END CONDITIONS:
- All tests pass → EXIT SUCCESS
- Max iterations reached → EXIT WITH ISSUES
- User termination → EXIT MANUAL
```

## Test Environment Setup

### Controlled Environment
- Isolated test networks
- Virtual machines with snapshots
- Containerized target applications
- Mock service implementations

### Target Simulation
- Representative OS/service versions
- Realistic security control presence
- Network topology simulation
- Authentic user behavior patterns

## Failure Analysis

### Common Failure Categories
- **Syntax/compilation errors**: Code-level issues
- **Runtime exceptions**: Execution-time failures
- **Logic errors**: Incorrect behavior
- **Compatibility issues**: Platform/version problems
- **Detection issues**: OPSEC failures

### Fix Strategy Priority
1. **Critical failures**: Crashes, compilation errors
2. **Logic errors**: Incorrect behavior/output
3. **Compatibility issues**: Platform-specific problems
4. **Performance issues**: Optimization opportunities
5. **Enhancement opportunities**: Feature additions

## OPSEC Integration

Each iteration includes automated OPSEC review:

```
[CHECK] OPSEC Validation:
- Static analysis for detection signatures
- Runtime behavior analysis
- Network pattern evaluation
- Artifact creation assessment
- Recommendation: PROCEED/REVISE/ABANDON
```

## Quality Metrics

### Success Criteria
- **Functionality**: 100% core features working
- **Reliability**: >95% success rate across iterations
- **Compatibility**: Works on all target platforms
- **OPSEC**: Passes detection analysis
- **Performance**: Meets response time requirements

### Reporting
```
## QA Loop Summary

**Total Iterations**: N
**Tests Passed**: X/Y
**Issues Fixed**: N
**OPSEC Status**: PASS/REVIEW/FAIL
**Overall Quality**: PRODUCTION_READY/NEEDS_WORK/FAILED

### Key Issues Addressed:
- Issue 1: Description + Fix
- Issue 2: Description + Fix

### Remaining Concerns:
- Concern 1: Risk assessment
- Concern 2: Mitigation strategy
```

## Skill Invocation

**Explicit**: `/armsforge:qa-loop [tool_name]`

**Auto-detection**:
- "test this tool"
- "validate exploit"
- "check if it works"
- "iterative testing"
- "quality assurance"
- "fix and retry"

## Integration

Common workflows:
- **Post-development**: `exploit` → `qa-loop` → deploy
- **Issue resolution**: `opsec-review` → `qa-loop` → validate
- **Improvement cycle**: `qa-loop` → `enhance` → `qa-loop`
- **Pre-deployment**: `qa-loop` → `methodology` → execute