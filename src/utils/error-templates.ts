/**
 * Error message templates with Catppuccin styling
 * User-friendly error messages with suggested fixes
 */

import { c, formatStatus, formatSection } from "../theme/catppuccin.js";
import { ErrorCode } from "./errors.js";

export interface ErrorTemplate {
  title: string;
  description: string;
  suggestions: string[];
  helpText?: string;
  docLink?: string;
}

export const ERROR_TEMPLATES: Record<ErrorCode, ErrorTemplate> = {
  [ErrorCode.INVALID_INPUT]: {
    title: "Invalid Input",
    description: "The provided input does not meet the required format or constraints.",
    suggestions: [
      "Check parameter types and formats",
      "Ensure all required fields are provided",
      "Verify values are within acceptable ranges"
    ],
    helpText: "Use the tool's parameter descriptions to understand expected input formats."
  },

  [ErrorCode.INVALID_FILE_PATH]: {
    title: "Invalid File Path",
    description: "The file path contains invalid characters or is not accessible.",
    suggestions: [
      "Remove special characters from the path",
      "Ensure the path doesn't contain '..' or '~'",
      "Use forward slashes (/) for path separators"
    ],
    helpText: "File paths should be absolute and not contain relative references."
  },

  [ErrorCode.INVALID_JSON]: {
    title: "Invalid JSON",
    description: "The JSON data is malformed or contains syntax errors.",
    suggestions: [
      "Check for missing commas, brackets, or quotes",
      "Validate JSON syntax using a JSON validator",
      "Ensure proper escaping of special characters"
    ],
    helpText: "Use 'jq' or an online JSON validator to check syntax."
  },

  [ErrorCode.INVALID_TEMPLATE_CONTEXT]: {
    title: "Invalid Template Context",
    description: "The template context parameters are invalid or incompatible.",
    suggestions: [
      "Use 'af_set_template_context' to configure defaults",
      "Check parameter values against supported options",
      "Verify architecture/OS combinations are valid"
    ],
    helpText: "Use 'af_get_template_info' to see template requirements."
  },

  [ErrorCode.FILE_NOT_FOUND]: {
    title: "File Not Found",
    description: "The requested file could not be located.",
    suggestions: [
      "Verify the file path is correct",
      "Check if the file exists in the expected location",
      "Ensure you have read permissions for the file"
    ],
    helpText: "Use absolute paths to avoid confusion about file locations."
  },

  [ErrorCode.FILE_READ_ERROR]: {
    title: "File Read Error",
    description: "Unable to read the file due to permissions or corruption.",
    suggestions: [
      "Check file permissions and ownership",
      "Verify the file is not corrupted",
      "Ensure the file is not locked by another process"
    ],
    helpText: "Use 'ls -la' to check file permissions and 'file' command to verify file type."
  },

  [ErrorCode.FILE_WRITE_ERROR]: {
    title: "File Write Error",
    description: "Unable to write to the file or directory.",
    suggestions: [
      "Check write permissions for the directory",
      "Ensure sufficient disk space is available",
      "Verify the parent directory exists"
    ],
    helpText: "Use 'df -h' to check disk space and 'mkdir -p' to create directories."
  },

  [ErrorCode.DIRECTORY_NOT_FOUND]: {
    title: "Directory Not Found",
    description: "The specified directory does not exist.",
    suggestions: [
      "Verify the directory path is correct",
      "Create the directory if it should exist",
      "Check if the directory was moved or renamed"
    ],
    helpText: "Use 'mkdir -p' to create directories recursively."
  },

  [ErrorCode.TEMPLATE_NOT_FOUND]: {
    title: "Template Not Found",
    description: "The requested template does not exist.",
    suggestions: [
      "Use 'af_list_templates' to see available templates",
      "Check the template name for typos",
      "Verify the templates directory is accessible"
    ],
    helpText: "Template names are case-sensitive and should not include the .hbs extension."
  },

  [ErrorCode.TEMPLATE_COMPILATION_ERROR]: {
    title: "Template Compilation Error",
    description: "The template contains syntax errors and cannot be compiled.",
    suggestions: [
      "Check Handlebars syntax in the template",
      "Verify all template helpers are registered",
      "Ensure template variables are properly formatted"
    ],
    helpText: "Review Handlebars documentation for proper syntax: https://handlebarsjs.com/"
  },

  [ErrorCode.TEMPLATE_INCOMPATIBLE]: {
    title: "Template Incompatible",
    description: "The template is not compatible with the current context.",
    suggestions: [
      "Check template requirements with 'af_get_template_info'",
      "Adjust your context parameters to match requirements",
      "Use 'af_set_template_context' to set compatible defaults"
    ],
    helpText: "Templates may have specific architecture, OS, or language requirements."
  },

  [ErrorCode.TEMPLATE_GENERATION_ERROR]: {
    title: "Template Generation Error",
    description: "An error occurred while generating the template content.",
    suggestions: [
      "Check if all required context variables are provided",
      "Verify template helpers are working correctly",
      "Try generating with a simpler context first"
    ],
    helpText: "Template generation errors are often due to missing or invalid context data."
  },

  [ErrorCode.CONFIG_LOAD_ERROR]: {
    title: "Configuration Load Error",
    description: "Failed to load user configuration file.",
    suggestions: [
      "Check ~/.armsforge/config.json exists and is valid JSON",
      "Reset to defaults if configuration is corrupted",
      "Ensure proper file permissions for config directory"
    ],
    helpText: "Delete ~/.armsforge/config.json to reset to defaults."
  },

  [ErrorCode.CONFIG_SAVE_ERROR]: {
    title: "Configuration Save Error",
    description: "Failed to save configuration changes.",
    suggestions: [
      "Check write permissions for ~/.armsforge/ directory",
      "Ensure sufficient disk space is available",
      "Verify the configuration data is valid"
    ],
    helpText: "Configuration is automatically saved when changed through tools."
  },

  [ErrorCode.CONFIG_VALIDATION_ERROR]: {
    title: "Configuration Validation Error",
    description: "The configuration file contains invalid settings.",
    suggestions: [
      "Check configuration values against expected formats",
      "Reset to defaults if configuration is corrupted",
      "Validate JSON syntax in config file"
    ],
    helpText: "Use 'af_set_template_context' to safely update configuration."
  },

  [ErrorCode.TOOL_INITIALIZATION_ERROR]: {
    title: "Tool Initialization Error",
    description: "Failed to initialize MCP tool or its dependencies.",
    suggestions: [
      "Check if all required files and directories exist",
      "Verify plugin installation is complete",
      "Restart Claude Code if the issue persists"
    ],
    helpText: "Tool initialization errors may indicate incomplete installation."
  },

  [ErrorCode.SERVER_ERROR]: {
    title: "Server Error",
    description: "An unexpected error occurred in the MCP server.",
    suggestions: [
      "Check server logs for detailed error information",
      "Restart Claude Code to reset server state",
      "Report the issue if it persists"
    ],
    helpText: "Server errors are logged to ~/.armsforge/logs/ for debugging."
  },

  [ErrorCode.TRANSPORT_ERROR]: {
    title: "Transport Error",
    description: "Communication error between Claude Code and the MCP server.",
    suggestions: [
      "Restart Claude Code to reset the connection",
      "Check if the server process is running",
      "Verify MCP server configuration"
    ],
    helpText: "Transport errors usually resolve with a Claude Code restart."
  },

  [ErrorCode.DATA_CORRUPTION]: {
    title: "Data Corruption",
    description: "Data files appear to be corrupted or invalid.",
    suggestions: [
      "Reinstall the plugin to restore data files",
      "Check file integrity and permissions",
      "Clear cache and reload data"
    ],
    helpText: "Data corruption may require reinstalling the plugin."
  },

  [ErrorCode.DETECTION_DATA_ERROR]: {
    title: "Detection Data Error",
    description: "Failed to load or parse detection data files.",
    suggestions: [
      "Check if detection data files exist in data/ directory",
      "Verify JSON syntax in detection data files",
      "Update plugin to get latest detection data"
    ],
    helpText: "Detection data files should be in ~/.claude/armsforge/data/ directory."
  },

  [ErrorCode.SNIPPET_ERROR]: {
    title: "Snippet Error",
    description: "Failed to load or process code snippet.",
    suggestions: [
      "Check if snippet file exists in snippets/ directory",
      "Verify snippet file is not corrupted",
      "Use 'af_list_snippets' to see available snippets"
    ],
    helpText: "Snippets are stored in the plugin's snippets/ directory."
  }
};

/**
 * Format error with Catppuccin styling
 */
export function formatErrorTemplate(errorCode: ErrorCode, context?: Record<string, unknown>): string {
  const template = ERROR_TEMPLATES[errorCode];
  if (!template) {
    return formatStatus("error", "Unknown error occurred");
  }

  const parts = [
    formatStatus("error", template.title),
    "",
    c.text(template.description)
  ];

  if (template.suggestions.length > 0) {
    parts.push(
      "",
      formatSection("Suggestions"),
      ...template.suggestions.map(suggestion =>
        `${c.muted("•")} ${c.text(suggestion)}`
      )
    );
  }

  if (template.helpText) {
    parts.push(
      "",
      formatSection("Help"),
      c.dim(template.helpText)
    );
  }

  if (template.docLink) {
    parts.push(
      "",
      `${c.muted("Documentation:")} ${c.text(template.docLink)}`
    );
  }

  if (context && Object.keys(context).length > 0) {
    parts.push(
      "",
      formatSection("Context"),
      ...Object.entries(context).map(([key, value]) =>
        `${c.muted(key + ":")} ${c.text(String(value))}`
      )
    );
  }

  return parts.join("\n");
}

/**
 * Get help text for common issues
 */
export function getCommonIssuesHelp(): string {
  return formatSection("Common Issues") + "\n" +
    `${c.muted("•")} ${c.text("Template not found")} - Use ${c.code("af_list_templates")} to see available templates\n` +
    `${c.muted("•")} ${c.text("Permission denied")} - Check file permissions and directory access\n` +
    `${c.muted("•")} ${c.text("Invalid parameters")} - Review tool parameter descriptions\n` +
    `${c.muted("•")} ${c.text("Configuration issues")} - Reset config with ${c.code("af_set_template_context")}\n` +
    `${c.muted("•")} ${c.text("Server errors")} - Check logs in ${c.path("~/.armsforge/logs/")}\n\n` +
    c.dim("For more help, check the documentation or report issues on GitHub.");
}

/**
 * Format validation error with field-specific guidance
 */
export function formatValidationError(field: string, message: string, value?: unknown): string {
  const fieldGuidance: Record<string, string[]> = {
    "template_name": [
      "Use only letters, numbers, hyphens, and underscores",
      "Template names are case-sensitive",
      "Don't include the .hbs file extension"
    ],
    "file_path": [
      "Use absolute paths starting with /",
      "Avoid relative paths (.. or ~)",
      "Use forward slashes as separators"
    ],
    "architecture": [
      "Valid options: x86, x64, arm64",
      "Use lowercase values",
      "Check if template supports the architecture"
    ],
    "operating_system": [
      "Valid options: windows, linux, macos",
      "Use lowercase values",
      "Check template OS compatibility"
    ],
    "language": [
      "Valid options: c, cpp, csharp, rust, go, python",
      "Use lowercase values",
      "Check template language support"
    ],
    "evasion_level": [
      "Valid values: 1 (Basic), 2 (Intermediate), 3 (Advanced)",
      "Use numeric values only",
      "Higher levels include more sophisticated evasion"
    ],
    "query": [
      "Use 1-500 characters",
      "Try API names, technique names, or keywords",
      "Examples: 'VirtualAllocEx', 'process injection', 'CreateThread'"
    ]
  };

  const parts = [
    formatStatus("error", `Invalid ${field}`),
    "",
    c.text(message)
  ];

  if (value !== undefined) {
    parts.push(
      "",
      `${c.muted("Received:")} ${c.code(String(value))}`
    );
  }

  const guidance = fieldGuidance[field];
  if (guidance) {
    parts.push(
      "",
      formatSection("Requirements"),
      ...guidance.map(guide => `${c.muted("•")} ${c.text(guide)}`)
    );
  }

  return parts.join("\n");
}