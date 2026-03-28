/**
 * Shared regex patterns for description extraction
 * This ensures consistency between implementation and tests
 */

/**
 * Comprehensive regex patterns for extracting @desc annotations from various comment styles
 * Used by the template engine for full template processing
 */
export const DESCRIPTION_PATTERNS = {
  // Handlebars comments: {{!-- @desc Description --}}
  HANDLEBARS: /{{!--\s*@desc\s+(.+?)\s*--}}/,

  // C-style block comments: /* @desc Description */
  C_BLOCK: /\/\*\s*@desc\s+(.+?)\s*\*\//,

  // Single-line comments: // @desc Description
  SINGLE_LINE: /\/\/\s*@desc\s+(.+?)$/m,

  // Shell/Python comments: # @desc Description
  HASH: /#\s*@desc\s+(.+?)$/m,

  // Assembly comments: ; @desc Description
  ASSEMBLY: /;\s*@desc\s+(.+?)$/m
} as const;

/**
 * Simplified regex patterns for basic description extraction
 * Used by MCP server for snippet listing (legacy compatibility)
 */
export const SIMPLE_DESCRIPTION_PATTERNS = {
  // Single-line comments anchored to start of line: // @desc Description
  SINGLE_LINE: /^\/\/\s*@desc\s+(.+)$/m,

  // Shell/Python comments anchored to start of line: # @desc Description
  HASH: /^#\s*@desc\s+(.+)$/m,

  // Assembly comments: ; @desc Description
  ASSEMBLY: /;\s*@desc\s+(.+)$/m
} as const;

/**
 * Extract description from content using comprehensive patterns
 * Used by template engine for full template metadata extraction
 *
 * @param content - File content to search
 * @returns Extracted description or empty string
 */
export function extractDescription(content: string): string {
  const patterns = Object.values(DESCRIPTION_PATTERNS);

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return '';
}

/**
 * Extract description from content using simple patterns
 * Used by MCP server for snippet listing (maintains legacy behavior)
 *
 * @param content - File content to search
 * @returns Extracted description or empty string
 */
export function extractDescriptionSimple(content: string): string {
  const patterns = Object.values(SIMPLE_DESCRIPTION_PATTERNS);

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return '';
}

/**
 * Get all regex patterns as an array for testing consistency
 * @returns Array of all description regex patterns
 */
export function getAllDescriptionPatterns() {
  return [
    ...Object.values(DESCRIPTION_PATTERNS),
    ...Object.values(SIMPLE_DESCRIPTION_PATTERNS)
  ];
}