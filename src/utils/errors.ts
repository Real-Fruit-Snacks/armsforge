/**
 * Structured error handling for Armsforge MCP server
 * Custom error classes with context and user-friendly messages
 */

import { formatStatus, c } from "../theme/catppuccin.js";

export enum ErrorCode {
  // Validation errors
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_FILE_PATH = "INVALID_FILE_PATH",
  INVALID_JSON = "INVALID_JSON",
  INVALID_TEMPLATE_CONTEXT = "INVALID_TEMPLATE_CONTEXT",

  // File system errors
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  FILE_READ_ERROR = "FILE_READ_ERROR",
  FILE_WRITE_ERROR = "FILE_WRITE_ERROR",
  DIRECTORY_NOT_FOUND = "DIRECTORY_NOT_FOUND",

  // Template errors
  TEMPLATE_NOT_FOUND = "TEMPLATE_NOT_FOUND",
  TEMPLATE_COMPILATION_ERROR = "TEMPLATE_COMPILATION_ERROR",
  TEMPLATE_INCOMPATIBLE = "TEMPLATE_INCOMPATIBLE",
  TEMPLATE_GENERATION_ERROR = "TEMPLATE_GENERATION_ERROR",

  // Configuration errors
  CONFIG_LOAD_ERROR = "CONFIG_LOAD_ERROR",
  CONFIG_SAVE_ERROR = "CONFIG_SAVE_ERROR",
  CONFIG_VALIDATION_ERROR = "CONFIG_VALIDATION_ERROR",

  // MCP server errors
  TOOL_INITIALIZATION_ERROR = "TOOL_INITIALIZATION_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  TRANSPORT_ERROR = "TRANSPORT_ERROR",

  // Data errors
  DATA_CORRUPTION = "DATA_CORRUPTION",
  DETECTION_DATA_ERROR = "DETECTION_DATA_ERROR",
  SNIPPET_ERROR = "SNIPPET_ERROR"
}

export interface RequiredErrorContext {
  component: string;
  operation: string;
}

export interface OptionalErrorContext {
  userId?: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

export interface ErrorContext extends RequiredErrorContext, OptionalErrorContext {}

export class ArmsforgeError extends Error {
  public readonly code: ErrorCode;
  public readonly context: ErrorContext;
  public readonly userMessage: string;
  public readonly suggestions: string[];
  public readonly originalError?: Error;

  constructor(
    code: ErrorCode,
    message: string,
    context: RequiredErrorContext & Partial<OptionalErrorContext>,
    options?: {
      userMessage?: string;
      suggestions?: string[];
      originalError?: Error;
    }
  ) {
    super(message);
    this.name = "ArmsforgeError";
    this.code = code;
    this.context = {
      timestamp: new Date(),
      ...context
    };
    this.userMessage = options?.userMessage || this.generateUserMessage(code, message);
    this.suggestions = options?.suggestions || this.generateSuggestions(code);
    this.originalError = options?.originalError;

    // Ensure proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ArmsforgeError);
    }
  }

  private generateUserMessage(code: ErrorCode, message: string): string {
    switch (code) {
      case ErrorCode.INVALID_INPUT:
        return "The provided input is invalid or malformed.";
      case ErrorCode.FILE_NOT_FOUND:
        return "The requested file could not be found.";
      case ErrorCode.TEMPLATE_NOT_FOUND:
        return "The specified template does not exist.";
      case ErrorCode.CONFIG_LOAD_ERROR:
        return "Failed to load configuration. Using default settings.";
      case ErrorCode.TEMPLATE_INCOMPATIBLE:
        return "The template is not compatible with the current context.";
      default:
        return message;
    }
  }

  private generateSuggestions(code: ErrorCode): string[] {
    switch (code) {
      case ErrorCode.INVALID_INPUT:
        return [
          "Check parameter types and formats",
          "Validate required fields are provided",
          "Ensure values are within acceptable ranges"
        ];
      case ErrorCode.FILE_NOT_FOUND:
        return [
          "Verify the file path is correct",
          "Check if the file exists in the expected location",
          "Ensure you have read permissions"
        ];
      case ErrorCode.TEMPLATE_NOT_FOUND:
        return [
          "Use 'af_list_templates' to see available templates",
          "Check the template name for typos",
          "Verify the templates directory is accessible"
        ];
      case ErrorCode.TEMPLATE_INCOMPATIBLE:
        return [
          "Check template requirements with 'af_get_template_info'",
          "Adjust your context parameters",
          "Use 'af_set_template_context' to set compatible defaults"
        ];
      case ErrorCode.CONFIG_LOAD_ERROR:
        return [
          "Check ~/.armsforge/config.json exists and is valid",
          "Reset to defaults if configuration is corrupted",
          "Ensure proper file permissions"
        ];
      default:
        return ["Check the logs for more details"];
    }
  }

  /**
   * Format error for user display with Catppuccin theme
   */
  public toUserString(): string {
    const parts = [
      formatStatus("error", this.userMessage)
    ];

    if (this.suggestions.length > 0) {
      parts.push(
        c.dim("\nSuggestions:"),
        ...this.suggestions.map(s => `  ${c.muted("•")} ${c.text(s)}`)
      );
    }

    if (this.context.metadata) {
      const metadata = Object.entries(this.context.metadata)
        .map(([key, value]) => `  ${c.muted(key + ":")} ${c.text(String(value))}`)
        .join("\n");
      if (metadata) {
        parts.push(c.dim("\nContext:"), metadata);
      }
    }

    return parts.join("\n");
  }

  /**
   * Format error for logging with full context (safe from circular references)
   */
  public toLogString(): string {
    // Safe JSON stringification with circular reference handling
    const contextStr = JSON.stringify({
      code: this.code,
      context: this.context,
      stack: this.stack,
      originalError: this.originalError?.message
    }, this.getCircularReplacer(), 2);

    return `${this.message}\n${contextStr}`;
  }

  /**
   * JSON replacer function to handle circular references
   */
  private getCircularReplacer() {
    const seen = new WeakSet();
    return (key: string, value: any) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      return value;
    };
  }

  /**
   * Create a validation error
   */
  static validation(message: string, context: RequiredErrorContext & Partial<OptionalErrorContext>, field?: string): ArmsforgeError {
    return new ArmsforgeError(
      ErrorCode.INVALID_INPUT,
      `Validation failed: ${message}`,
      { ...context, operation: "validation" },
      {
        userMessage: field ? `Invalid ${field}: ${message}` : `Validation error: ${message}`,
        suggestions: [
          "Check the parameter format and type",
          "Ensure all required fields are provided",
          "Verify values are within acceptable ranges"
        ]
      }
    );
  }

  /**
   * Create a file system error
   */
  static fileSystem(
    message: string,
    context: RequiredErrorContext & Partial<OptionalErrorContext>,
    filePath?: string,
    originalError?: Error
  ): ArmsforgeError {
    return new ArmsforgeError(
      ErrorCode.FILE_NOT_FOUND,
      message,
      { ...context, operation: "file_access", metadata: { filePath } },
      {
        originalError,
        suggestions: [
          "Verify the file path is correct",
          "Check file permissions",
          "Ensure the directory exists"
        ]
      }
    );
  }

  /**
   * Create a template error
   */
  static template(
    code: ErrorCode,
    message: string,
    context: RequiredErrorContext & Partial<OptionalErrorContext>,
    templateName?: string
  ): ArmsforgeError {
    return new ArmsforgeError(
      code,
      message,
      { ...context, operation: "template_operation", metadata: { templateName } },
      {
        suggestions: code === ErrorCode.TEMPLATE_NOT_FOUND ? [
          "Use 'af_list_templates' to see available templates",
          "Check the template name for typos"
        ] : []
      }
    );
  }

  /**
   * Create a configuration error
   */
  static config(
    message: string,
    context: RequiredErrorContext & Partial<OptionalErrorContext>,
    configPath?: string,
    originalError?: Error
  ): ArmsforgeError {
    return new ArmsforgeError(
      ErrorCode.CONFIG_LOAD_ERROR,
      message,
      { ...context, operation: "config_operation", metadata: { configPath } },
      {
        originalError,
        suggestions: [
          "Check configuration file syntax",
          "Reset to defaults if corrupted",
          "Ensure proper file permissions"
        ]
      }
    );
  }
}

/**
 * Wrapper for async operations with error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context: RequiredErrorContext & Partial<OptionalErrorContext>,
  errorFactory?: (error: Error) => ArmsforgeError
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ArmsforgeError) {
      throw error;
    }

    const originalError = error as Error;
    let wrappedError: ArmsforgeError;

    if (errorFactory) {
      wrappedError = errorFactory(originalError);
    } else {
      wrappedError = new ArmsforgeError(
        ErrorCode.SERVER_ERROR,
        `Unexpected error: ${originalError.message}`,
        context,
        { originalError }
      );
    }

    // Preserve original stack trace for better debugging
    if (originalError.stack) {
      wrappedError.stack = originalError.stack;
    }

    // Ensure error chaining is preserved (originalError is set in constructor)
    // The originalError property is already set via constructor options

    throw wrappedError;
  }
}

/**
 * Wrapper for sync operations with error handling
 */
export function safeSync<T>(
  operation: () => T,
  context: RequiredErrorContext & Partial<OptionalErrorContext>,
  errorFactory?: (error: Error) => ArmsforgeError
): T {
  try {
    return operation();
  } catch (error) {
    if (error instanceof ArmsforgeError) {
      throw error;
    }

    const originalError = error as Error;
    let wrappedError: ArmsforgeError;

    if (errorFactory) {
      wrappedError = errorFactory(originalError);
    } else {
      wrappedError = new ArmsforgeError(
        ErrorCode.SERVER_ERROR,
        `Unexpected error: ${originalError.message}`,
        context,
        { originalError }
      );
    }

    // Preserve original stack trace for better debugging
    if (originalError.stack) {
      wrappedError.stack = originalError.stack;
    }

    throw wrappedError;
  }
}