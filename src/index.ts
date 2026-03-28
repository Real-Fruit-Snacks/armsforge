// Armsforge: Offensive Security Toolkit for Claude Code
// Main library entry point - exports public APIs for external consumption

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get package.json version dynamically with resilient fallback
let packageVersion = '0.1.0'; // fallback
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
  packageVersion = packageJson.version;
} catch {
  // Use fallback version if package.json is unavailable
}

/**
 * Template context interface for defining variable scope and metadata
 * @public
 */
export type { TemplateContext } from './templates/context.js';

/**
 * Core template engine for processing Handlebars templates with security safeguards
 * @public
 */
export { TemplateEngine } from './templates/engine.js';

/**
 * Manager for template context validation and variable scoping
 * @public
 */
export { TemplateContextManager } from './templates/context.js';

/**
 * Base error class for Armsforge operations with structured error codes
 * @public
 */
export { ArmsforgeError, ErrorCode } from './utils/errors.js';

/**
 * Zod validation schemas for type-safe parameter validation
 * @public
 */
export {
  TemplateNameSchema,
  FilePathSchema,
  TemplateContextSchema,
  GetTemplateParamsSchema,
  GetSnippetParamsSchema,
  DetectionLookupParamsSchema
} from './utils/validation.js';

/**
 * Catppuccin theme utilities for consistent terminal styling and formatting
 * @public
 */
export { c, formatTitle, formatSection, formatStatus, formatPath, formatCode } from './theme/catppuccin.js';

/**
 * User preferences manager for persistent configuration storage
 * @public
 */
export { UserPreferencesManager } from './config/user-preferences.js';

/**
 * Pre-configured Winston logger instance with security-appropriate logging levels
 * @public
 */
export { default as logger } from './utils/logger.js';

/**
 * Current version of the Armsforge toolkit (dynamically loaded from package.json)
 * @public
 */
export const VERSION = packageVersion;

/**
 * Human-readable name of the offensive security toolkit
 * @public
 */
export const TOOLKIT_NAME = 'Armsforge';

/**
 * Brief description of the toolkit's purpose and target use cases
 * @public
 */
export const DESCRIPTION = 'Offensive security toolkit for red team operations, OSCP/OSEP prep, and engagement management';
