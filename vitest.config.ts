import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        'bridge/',
        '**/*.d.ts',
        'scripts/'
      ],
      thresholds: {
        // Security-Critical Code: Requires exhaustive testing
        'src/templates/security-validator.ts': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        },
        'src/utils/security.ts': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        },
        'src/utils/validation.ts': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        },
        // Input Validation & Path Security
        'src/utils/errors.ts': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        // Core Template System (potential attack surface)
        'src/templates/engine.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        },
        'src/templates/context.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        },
        // Network/IPC Security
        'src/mcp/server.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        },
        // Configuration Security
        'src/config/user-preferences.ts': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Global thresholds for non-security code
        global: {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75
        }
      }
    },
    // Security test validation requirements
    setupFiles: ['./test/setup/security-validation.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@test': resolve(__dirname, './test')
    }
  }
});