/**
 * Zod schemas and validators for Armsforge MCP server
 * Comprehensive input validation with user-friendly error messages
 */

import { z } from "zod";
import { resolve, normalize, sep, relative } from 'path';
import { ArmsforgeError, ErrorCode } from "./errors.js";

/**
 * Safely resolve a user path within a base directory
 * Prevents all forms of path traversal attacks
 */
export function resolveSafePath(baseDir: string, userPath: string): string {
  // Check for null bytes and control characters first (common injection technique)
  if (/[\x00-\x1f]/.test(userPath)) {
    throw new ArmsforgeError(
      ErrorCode.INVALID_INPUT,
      `Path traversal detected: ${userPath} contains null bytes or control characters`,
      {
        component: 'path-validation',
        operation: 'safe_resolve',
        metadata: { originalPath: userPath, reason: 'control_characters' }
      }
    );
  }

  // Iteratively decode URL encoding to prevent double/triple encoding bypasses
  let decodedPath = userPath;
  let previousPath = '';
  let decodeAttempts = 0;
  const maxDecodeAttempts = 5; // Prevent infinite loops

  while (decodedPath !== previousPath && decodeAttempts < maxDecodeAttempts) {
    previousPath = decodedPath;
    try {
      const newDecoded = decodeURIComponent(decodedPath);
      // Only update if decoding actually changed something
      if (newDecoded !== decodedPath) {
        decodedPath = newDecoded;
      } else {
        break;
      }
    } catch {
      // If decoding fails, stop trying
      break;
    }
    decodeAttempts++;
  }

  // Normalize Unicode characters that could be used to bypass filters
  // Convert fullwidth periods and other Unicode variants to regular ASCII
  let normalizedPath = decodedPath
    .replace(/[\uFF0E\u002E\u2024\u2025\u2026]/g, '.') // Various Unicode dots
    .replace(/[\uFF0F\u2044\u2215]/g, '/') // Various Unicode forward slashes
    .replace(/[\uFF3C\u005C]/g, '\\'); // Various Unicode backslashes

  // Resolve both paths to canonical absolute paths
  const resolvedBase = resolve(baseDir);
  const resolvedPath = resolve(baseDir, normalizedPath);

  // Check containment using path.relative to prevent all path traversal attacks
  const relativePath = relative(resolvedBase, resolvedPath);

  // Path is unsafe if:
  // 1. relative path starts with '..' (going up directories)
  // 2. relative path contains '..' segments anywhere
  // 3. relative path is empty (accessing base directory itself)
  // 4. relative path is just '.' or starts with './' (current directory access)
  // 5. relative path contains backslash followed by '..' (Windows-style traversal)
  if (
    relativePath.startsWith('..') ||
    relativePath.includes(`${sep}..`) ||
    relativePath.includes(`..${sep}`) ||
    relativePath.includes('\\..') ||
    relativePath.includes('../') ||
    relativePath === '' ||
    relativePath === '.' ||
    relativePath.startsWith('./') ||
    relativePath.startsWith('.\\') ||
    relativePath.includes('/../') ||
    relativePath.includes('\\..\\')
  ) {
    throw new ArmsforgeError(
      ErrorCode.INVALID_INPUT,
      `Path traversal detected: ${userPath} resolves outside base directory`,
      {
        component: 'path-validation',
        operation: 'safe_resolve',
        metadata: {
          originalPath: userPath,
          decodedPath: normalizedPath,
          relativePath: relativePath,
          reason: 'path_traversal'
        }
      }
    );
  }

  return resolvedPath;
}

// Base validation schemas
export const FilePathSchema = z.string()
  .min(1, "File path cannot be empty")
  .refine(
    (path) => {
      // Reject absolute paths
      if (path.startsWith('/') || /^[a-zA-Z]:/.test(path)) {
        return false;
      }
      // Reject home directory references
      if (path.includes('~')) {
        return false;
      }
      // Normalize and check for remaining traversal attempts
      const normalized = normalize(path);
      return !normalized.startsWith('..') && !normalized.includes('..');
    },
    "Invalid file path: absolute paths, directory traversal, and home directory references not allowed"
  )
  .refine(
    (path) => {
      // Check for invalid characters using efficient regex
      // Combined check for performance - checks control chars (0x00-0x1f) and specific invalid chars
      return !/[\x00-\x1f<>:"|?*]/.test(path);
    },
    "File path contains invalid characters"
  );

// Template name validation constants
const TEMPLATE_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const TEMPLATE_NAME_ERROR_MESSAGE = "Template name must contain only alphanumeric characters, hyphens, and underscores";

export const TemplateNameSchema = z.string()
  .min(1, "Template name cannot be empty")
  .max(100, "Template name too long")
  .regex(TEMPLATE_NAME_REGEX, TEMPLATE_NAME_ERROR_MESSAGE);

export const ArchitectureSchema = z.enum(["x86", "x64", "arm64"], {
  errorMap: () => ({ message: "Architecture must be one of: x86, x64, arm64" })
});

export const OperatingSystemSchema = z.enum(["windows", "linux", "macos"], {
  errorMap: () => ({ message: "Operating system must be one of: windows, linux, macos" })
});

export const EvasionLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)], {
  errorMap: () => ({ message: "Evasion level must be 1 (Basic), 2 (Intermediate), or 3 (Advanced)" })
});

export const PayloadFormatSchema = z.enum(["exe", "dll", "shellcode", "script"], {
  errorMap: () => ({ message: "Payload format must be one of: exe, dll, shellcode, script" })
});

export const LanguageSchema = z.enum(["c", "cpp", "csharp", "rust", "go", "python"], {
  errorMap: () => ({ message: "Language must be one of: c, cpp, csharp, rust, go, python" })
});

// Template context validation
export const TemplateContextSchema = z.object({
  target_arch: ArchitectureSchema,
  target_os: OperatingSystemSchema,
  evasion_level: EvasionLevelSchema,
  payload_format: PayloadFormatSchema,
  language: LanguageSchema
}).strict();

export const PartialTemplateContextSchema = z.object({
  target_arch: ArchitectureSchema.optional(),
  target_os: OperatingSystemSchema.optional(),
  evasion_level: EvasionLevelSchema.optional(),
  payload_format: PayloadFormatSchema.optional(),
  language: LanguageSchema.optional()
}).strict();

// MCP tool parameter schemas
export const ListTemplatesParamsSchema = z.object({
  filter_by_context: z.boolean().optional(),
  arch: ArchitectureSchema.optional(),
  os: OperatingSystemSchema.optional(),
  language: LanguageSchema.optional()
}).strict();

export const GetTemplateParamsSchema = z.object({
  name: TemplateNameSchema,
  arch: ArchitectureSchema.optional(),
  os: OperatingSystemSchema.optional(),
  evasion_level: EvasionLevelSchema.optional(),
  payload_format: PayloadFormatSchema.optional(),
  language: LanguageSchema.optional()
}).strict();

export const GetSnippetParamsSchema = z.object({
  name: z.string()
    .min(1, "Snippet name cannot be empty")
    .max(200, "Snippet name too long")
    .refine(
      (name) => !name.includes("..") && !name.includes("/") && !name.includes("\\"),
      "Snippet name cannot contain path separators or relative paths"
    )
}).strict();

export const SetTemplateContextParamsSchema = PartialTemplateContextSchema;

export const GetTemplateInfoParamsSchema = z.object({
  name: TemplateNameSchema
}).strict();

export const DetectionLookupParamsSchema = z.object({
  query: z.string()
    .min(1, "Query cannot be empty")
    .max(500, "Query too long")
    .trim()
}).strict();

// JSON data validation schemas
export const SuspiciousApiSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  risk_level: z.enum(["low", "medium", "high", "critical"]).optional(),
  categories: z.array(z.string()).optional(),
  detection_methods: z.array(z.string()).optional()
});

export const SysmonRuleSchema = z.object({
  event_id: z.number(),
  event_name: z.string(),
  description: z.string().optional(),
  fields: z.array(z.string()).optional(),
  filters: z.record(z.string()).optional()
});

export const EtwProviderSchema = z.object({
  name: z.string(),
  guid: z.string(),
  description: z.string().optional(),
  events: z.array(z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().optional()
  })).optional()
});

export const AmsiTriggerSchema = z.object({
  pattern: z.string(),
  type: z.enum(["string", "regex", "keyword"]).optional(),
  description: z.string().optional(),
  bypass_methods: z.array(z.string()).optional()
});

// Detection data file schemas
export const DetectionDataSchema = z.union([
  // Array format
  z.array(z.union([SuspiciousApiSchema, SysmonRuleSchema, EtwProviderSchema, AmsiTriggerSchema])),
  // Object with entries
  z.object({
    entries: z.array(z.union([SuspiciousApiSchema, SysmonRuleSchema, EtwProviderSchema, AmsiTriggerSchema]))
  }),
  // Nested categories format
  z.object({
    categories: z.record(z.object({
      apis: z.array(SuspiciousApiSchema).optional(),
      rules: z.array(SysmonRuleSchema).optional(),
      providers: z.array(EtwProviderSchema).optional(),
      patterns: z.array(AmsiTriggerSchema).optional()
    }))
  }),
  // Direct properties format
  z.object({
    events: z.array(SysmonRuleSchema).optional(),
    providers: z.array(EtwProviderSchema).optional(),
    trigger_patterns: z.record(z.object({
      patterns: z.array(AmsiTriggerSchema)
    })).optional()
  })
]);

/**
 * Validate and sanitize file path
 */
export function validateFilePath(path: string, context: { component: string; operation: string }): string {
  try {
    return FilePathSchema.parse(path);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ArmsforgeError.validation(
        error.errors[0]?.message || "Invalid file path",
        context,
        "file path"
      );
    }
    throw error;
  }
}

/**
 * Validate template name
 */
export function validateTemplateName(name: string, context: { component: string; operation: string }): string {
  try {
    return TemplateNameSchema.parse(name);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ArmsforgeError.validation(
        error.errors[0]?.message || "Invalid template name",
        context,
        "template name"
      );
    }
    throw error;
  }
}

/**
 * Validate template context
 */
export function validateTemplateContext(
  context: unknown,
  validationContext: { component: string; operation: string }
): any {
  try {
    return TemplateContextSchema.parse(context);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      throw ArmsforgeError.validation(
        message,
        validationContext,
        "template context"
      );
    }
    throw error;
  }
}

/**
 * Validate partial template context (for updates)
 */
export function validatePartialTemplateContext(
  context: unknown,
  validationContext: { component: string; operation: string }
): any {
  try {
    return PartialTemplateContextSchema.parse(context);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      throw ArmsforgeError.validation(
        message,
        validationContext,
        "template context"
      );
    }
    throw error;
  }
}

/**
 * Validate JSON data from detection files
 */
export function validateDetectionData(
  data: unknown,
  context: { component: string; operation: string }
): any {
  try {
    return DetectionDataSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ArmsforgeError.validation(
        "Invalid detection data format",
        context,
        "detection data"
      );
    }
    throw error;
  }
}

/**
 * Validate MCP tool parameters with specific schema
 */
export function validateToolParams<T>(
  schema: z.ZodSchema<T>,
  params: unknown,
  toolName: string,
  context: { component: string; operation: string }
): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => {
        const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
        return `${path}${e.message}`;
      }).join('; ');

      throw ArmsforgeError.validation(
        message,
        { ...context, metadata: { toolName } },
        "tool parameters"
      );
    }
    throw error;
  }
}

/**
 * Sanitize user input string
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  // First normalize the string to handle composed Unicode characters consistently
  const normalized = input.normalize('NFC');

  // Trim and normalize whitespace first
  const trimmed = normalized
    .trim()
    .replace(/[\x00-\x1f\x7f]/g, '') // Remove control characters
    .replace(/\s+/g, ' '); // Normalize whitespace

  // Use Unicode-aware length limiting to avoid splitting multibyte characters
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  // Use Intl.Segmenter for proper grapheme cluster handling if available
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    const segments = Array.from(segmenter.segment(trimmed));

    let result = '';
    let length = 0;

    for (const segment of segments) {
      if (length + segment.segment.length > maxLength) {
        break;
      }
      result += segment.segment;
      length += segment.segment.length;
    }

    return result;
  }

  // Fallback for environments without Intl.Segmenter
  // Use Array.from to split by code points rather than code units
  const codePoints = Array.from(trimmed);

  let result = '';
  for (const codePoint of codePoints) {
    if (result.length + codePoint.length > maxLength) {
      break;
    }
    result += codePoint;
  }

  return result;
}

/**
 * Validate and sanitize query string
 */
export function validateQuery(query: string, context: { component: string; operation: string }): string {
  try {
    const validated = DetectionLookupParamsSchema.shape.query.parse(query);
    return sanitizeString(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ArmsforgeError.validation(
        error.errors[0]?.message || "Invalid query",
        context,
        "query"
      );
    }
    throw error;
  }
}

/**
 * Create a validation error with context
 */
export function createValidationError(
  message: string,
  context: { component: string; operation: string },
  field?: string
): ArmsforgeError {
  return ArmsforgeError.validation(message, context, field);
}

/**
 * Type guard for checking if error is validation error
 */
export function isValidationError(error: unknown): error is ArmsforgeError {
  return error instanceof ArmsforgeError && error.code === ErrorCode.INVALID_INPUT;
}

// Export all schemas for external use
export {
  z as ZodLib,
  type ZodError
} from "zod";