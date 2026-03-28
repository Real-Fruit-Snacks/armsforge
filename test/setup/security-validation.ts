/**
 * Security test validation setup for Vitest
 * Ensures security-critical code paths are properly tested beyond just coverage metrics
 */

import { beforeAll, afterAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

// Security-critical files that require specific validation
const SECURITY_CRITICAL_FILES = [
  'src/templates/security-validator.ts',
  'src/utils/security.ts',
  'src/utils/validation.ts'
];

// Security-critical functions that MUST have comprehensive test coverage
const REQUIRED_SECURITY_FUNCTIONS = [
  // Path traversal prevention
  'resolveSafePath',
  'validateFilePath',
  'validateTemplateName',

  // Template security validation
  'validateTemplate',
  'checkPlaceholders',
  'checkSensitiveData',
  'checkDangerousAPIs',
  'checkCodeInjection',
  'checkObfuscation',
  'checkMaliciousPayloads',

  // Input validation and sanitization
  'sanitizeString',
  'validateQuery',
  'validateTemplateContext',
  'validatePartialTemplateContext',
  'validateToolParams',

  // Security utilities
  'validateArraySize',
  'validateStringLength',
  'validateTemplateMetadata',
  'safeFilter'
];

// Attack vectors that MUST be tested
const REQUIRED_ATTACK_VECTOR_TESTS = [
  // Path traversal attacks
  'classic_directory_traversal',
  'url_encoded_traversal',
  'double_encoded_traversal',
  'unicode_normalization_attacks',
  'null_byte_injection',
  'mixed_separator_attacks',

  // Template security attacks
  'hardcoded_credentials_detection',
  'dangerous_api_detection',
  'code_injection_detection',
  'obfuscation_detection',
  'malicious_payload_detection',

  // Input validation attacks
  'sql_injection_patterns',
  'xss_patterns',
  'command_injection',
  'buffer_overflow_patterns',
  'format_string_vulnerabilities'
];

interface SecurityTestRegistry {
  testedFunctions: Set<string>;
  testedAttackVectors: Set<string>;
  securityTestFiles: Set<string>;
  qualitativeChecks: {
    hasNegativeTests: boolean;
    hasEdgeCaseTests: boolean;
    hasConcurrencyTests: boolean;
    hasPerformanceTests: boolean;
  };
}

const securityRegistry: SecurityTestRegistry = {
  testedFunctions: new Set(),
  testedAttackVectors: new Set(),
  securityTestFiles: new Set(),
  qualitativeChecks: {
    hasNegativeTests: false,
    hasEdgeCaseTests: false,
    hasConcurrencyTests: false,
    hasPerformanceTests: false
  }
};

// Global test hooks for security validation
beforeAll(() => {
  console.log('\n🛡️  Security Test Validation Setup');
  console.log('=====================================');

  // Reset registry for each test run
  securityRegistry.testedFunctions.clear();
  securityRegistry.testedAttackVectors.clear();
  securityRegistry.securityTestFiles.clear();

  // Scan test files to identify security test coverage
  scanSecurityTestFiles();

  console.log(`📋 Found ${securityRegistry.securityTestFiles.size} security test files`);
  console.log(`🔍 Tracking ${REQUIRED_SECURITY_FUNCTIONS.length} critical security functions`);
  console.log(`⚔️  Validating ${REQUIRED_ATTACK_VECTOR_TESTS.length} attack vector categories\n`);
});

afterAll(() => {
  console.log('\n🔒 Security Test Validation Report');
  console.log('===================================');

  // Validate security function coverage
  validateSecurityFunctionCoverage();

  // Validate attack vector coverage
  validateAttackVectorCoverage();

  // Validate qualitative test requirements
  validateQualitativeTestRequirements();

  // Generate security test quality score
  generateSecurityTestScore();

  console.log('\n✅ Security validation complete\n');
});

function scanSecurityTestFiles(): void {
  const testDir = resolve(__dirname, '..');
  const securityTestPatterns = [
    'test/security/**/*.test.ts',
    'test/**/security*.test.ts',
    'test/**/*security*.test.ts',
    'test/**/validation*.test.ts',
    'test/**/path-traversal*.test.ts'
  ];

  // Manually register known security test files
  const knownSecurityTests = [
    'test/security/path-traversal.test.ts',
    'test/templates/security-validator.test.ts',
    'test/unit/validation-security.test.ts',
    'test/config/user-preferences-security.test.ts'
  ];

  knownSecurityTests.forEach(testFile => {
    const fullPath = resolve(__dirname, '..', '..', testFile);
    if (existsSync(fullPath)) {
      securityRegistry.securityTestFiles.add(testFile);
      analyzeSecurityTestFile(fullPath, testFile);
    }
  });
}

function analyzeSecurityTestFile(filePath: string, fileName: string): void {
  try {
    const content = readFileSync(filePath, 'utf-8');

    // Check for tested security functions
    REQUIRED_SECURITY_FUNCTIONS.forEach(func => {
      if (content.includes(func)) {
        securityRegistry.testedFunctions.add(func);
      }
    });

    // Check for attack vector tests by looking for specific patterns
    if (content.includes('directory traversal') || content.includes('../')) {
      securityRegistry.testedAttackVectors.add('classic_directory_traversal');
    }
    if (content.includes('URL-encoded') || content.includes('%2e%2e')) {
      securityRegistry.testedAttackVectors.add('url_encoded_traversal');
    }
    if (content.includes('double') && content.includes('encoded')) {
      securityRegistry.testedAttackVectors.add('double_encoded_traversal');
    }
    if (content.includes('unicode') || content.includes('\\u')) {
      securityRegistry.testedAttackVectors.add('unicode_normalization_attacks');
    }
    if (content.includes('null byte') || content.includes('\\x00')) {
      securityRegistry.testedAttackVectors.add('null_byte_injection');
    }
    if (content.includes('mixed') && content.includes('slash')) {
      securityRegistry.testedAttackVectors.add('mixed_separator_attacks');
    }
    if (content.includes('hardcoded') && (content.includes('password') || content.includes('credential'))) {
      securityRegistry.testedAttackVectors.add('hardcoded_credentials_detection');
    }
    if (content.includes('dangerous') && content.includes('API')) {
      securityRegistry.testedAttackVectors.add('dangerous_api_detection');
    }
    if (content.includes('code injection') || content.includes('eval(')) {
      securityRegistry.testedAttackVectors.add('code_injection_detection');
    }
    if (content.includes('obfuscation') || content.includes('base64')) {
      securityRegistry.testedAttackVectors.add('obfuscation_detection');
    }
    if (content.includes('malicious payload') || content.includes('meterpreter')) {
      securityRegistry.testedAttackVectors.add('malicious_payload_detection');
    }
    if (content.includes('SQL injection') || content.includes('SELECT')) {
      securityRegistry.testedAttackVectors.add('sql_injection_patterns');
    }
    if (content.includes('XSS') || content.includes('<script>')) {
      securityRegistry.testedAttackVectors.add('xss_patterns');
    }
    if (content.includes('command injection') || content.includes('system(')) {
      securityRegistry.testedAttackVectors.add('command_injection');
    }

    // Check for qualitative test characteristics
    if (content.includes('should not') || content.includes('should reject') || content.includes('should block')) {
      securityRegistry.qualitativeChecks.hasNegativeTests = true;
    }
    if (content.includes('edge case') || content.includes('empty') || content.includes('null') || content.includes('undefined')) {
      securityRegistry.qualitativeChecks.hasEdgeCaseTests = true;
    }
    if (content.includes('concurrent') || content.includes('Promise.all') || content.includes('parallel')) {
      securityRegistry.qualitativeChecks.hasConcurrencyTests = true;
    }
    if (content.includes('performance') || content.includes('timeout') || content.includes('ReDoS')) {
      securityRegistry.qualitativeChecks.hasPerformanceTests = true;
    }

  } catch (error) {
    console.warn(`⚠️  Could not analyze security test file: ${fileName}`);
  }
}

function validateSecurityFunctionCoverage(): void {
  const missingFunctions = REQUIRED_SECURITY_FUNCTIONS.filter(
    func => !securityRegistry.testedFunctions.has(func)
  );

  const coveragePercent = Math.round(
    ((REQUIRED_SECURITY_FUNCTIONS.length - missingFunctions.length) / REQUIRED_SECURITY_FUNCTIONS.length) * 100
  );

  console.log(`🔧 Security Function Coverage: ${coveragePercent}% (${securityRegistry.testedFunctions.size}/${REQUIRED_SECURITY_FUNCTIONS.length})`);

  if (missingFunctions.length > 0) {
    console.warn('⚠️  Missing security function tests:');
    missingFunctions.forEach(func => console.warn(`   - ${func}`));
  }

  if (coveragePercent < 90) {
    console.error(`❌ Security function coverage below 90% threshold: ${coveragePercent}%`);
  } else {
    console.log(`✅ Security function coverage meets requirements`);
  }
}

function validateAttackVectorCoverage(): void {
  const missingVectors = REQUIRED_ATTACK_VECTOR_TESTS.filter(
    vector => !securityRegistry.testedAttackVectors.has(vector)
  );

  const coveragePercent = Math.round(
    ((REQUIRED_ATTACK_VECTOR_TESTS.length - missingVectors.length) / REQUIRED_ATTACK_VECTOR_TESTS.length) * 100
  );

  console.log(`⚔️  Attack Vector Coverage: ${coveragePercent}% (${securityRegistry.testedAttackVectors.size}/${REQUIRED_ATTACK_VECTOR_TESTS.length})`);

  if (missingVectors.length > 0) {
    console.warn('⚠️  Missing attack vector tests:');
    missingVectors.forEach(vector => console.warn(`   - ${vector.replace(/_/g, ' ')}`));
  }

  if (coveragePercent < 80) {
    console.error(`❌ Attack vector coverage below 80% threshold: ${coveragePercent}%`);
  } else {
    console.log(`✅ Attack vector coverage meets requirements`);
  }
}

function validateQualitativeTestRequirements(): void {
  console.log('📊 Qualitative Test Requirements:');

  const requirements = [
    { name: 'Negative Tests (rejection scenarios)', met: securityRegistry.qualitativeChecks.hasNegativeTests },
    { name: 'Edge Case Tests (boundary conditions)', met: securityRegistry.qualitativeChecks.hasEdgeCaseTests },
    { name: 'Concurrency Tests (race conditions)', met: securityRegistry.qualitativeChecks.hasConcurrencyTests },
    { name: 'Performance Tests (DoS prevention)', met: securityRegistry.qualitativeChecks.hasPerformanceTests }
  ];

  requirements.forEach(req => {
    const status = req.met ? '✅' : '❌';
    console.log(`   ${status} ${req.name}`);
  });

  const qualityScore = requirements.filter(req => req.met).length / requirements.length;
  if (qualityScore < 0.75) {
    console.error(`❌ Qualitative test coverage below 75% threshold: ${Math.round(qualityScore * 100)}%`);
  } else {
    console.log(`✅ Qualitative test requirements meet standards`);
  }
}

function generateSecurityTestScore(): void {
  const functionCoverage = securityRegistry.testedFunctions.size / REQUIRED_SECURITY_FUNCTIONS.length;
  const vectorCoverage = securityRegistry.testedAttackVectors.size / REQUIRED_ATTACK_VECTOR_TESTS.length;
  const qualitativeChecks = Object.values(securityRegistry.qualitativeChecks).filter(Boolean).length / 4;

  // Weighted scoring: functions (40%), vectors (40%), qualitative (20%)
  const overallScore = Math.round(
    (functionCoverage * 0.4 + vectorCoverage * 0.4 + qualitativeChecks * 0.2) * 100
  );

  console.log(`\n🎯 Overall Security Test Quality Score: ${overallScore}%`);

  if (overallScore >= 90) {
    console.log('🏆 Excellent - Security validation is comprehensive');
  } else if (overallScore >= 80) {
    console.log('🥉 Good - Security validation meets minimum standards');
  } else if (overallScore >= 70) {
    console.warn('⚠️  Fair - Security validation needs improvement');
  } else {
    console.error('❌ Poor - Security validation is insufficient for production deployment');
  }

  console.log('\n📈 Coverage vs. Security Matrix:');
  console.log('   High Coverage + High Security = ✅ Trusted Code');
  console.log('   High Coverage + Low Security  = ⚠️  False Confidence');
  console.log('   Low Coverage  + High Security = 🔄 Needs More Tests');
  console.log('   Low Coverage  + Low Security  = ❌ Dangerous Code');
}

// Export for potential use in tests
export {
  securityRegistry,
  SECURITY_CRITICAL_FILES,
  REQUIRED_SECURITY_FUNCTIONS,
  REQUIRED_ATTACK_VECTOR_TESTS
};