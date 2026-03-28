/**
 * Winston logging configuration for Armsforge MCP server
 * Structured logging with Catppuccin theme and contextual information
 *
 * Environment Variables:
 * - ARMSFORGE_LOG_DIR: Custom log directory path
 * - ARMSFORGE_LOG_LEVEL: Overall logging level (error, warn, info, debug, etc.)
 * - ARMSFORGE_CONSOLE_LEVEL: Console-specific logging level
 *   - 'off', 'disable', 'false': Disable console logging completely
 *   - 'error', 'warn', 'info', 'debug', etc.: Set specific console level
 *   - Default: error (production), warn (test), debug (development)
 * - ARMSFORGE_CONSOLE_STACK: Show stack traces in production console ('true' to enable)
 */

import { createLogger, format, transports, Logger } from 'winston';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { c, formatStatus } from '../theme/catppuccin.js';
import { ErrorCode, ArmsforgeError } from './errors.js';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'
}

export interface LogContext {
  component: string;
  operation?: string;
  userId?: string;
  toolName?: string;
  templateName?: string;
  filePath?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  timestamp: Date;
  error?: Error | ArmsforgeError;
}

class ArmsforgeLogger {
  private logger: Logger;
  private logDir: string;
  private fileLoggingEnabled: boolean = true;
  private initializationErrors: string[] = [];
  private defaultContext: Partial<LogContext> = {};
  private parentLogger?: ArmsforgeLogger;
  private childLoggers = new WeakSet<ArmsforgeLogger>();

  constructor(parentLogger?: ArmsforgeLogger, inheritedContext: Partial<LogContext> = {}) {
    this.parentLogger = parentLogger;
    this.defaultContext = inheritedContext;

    if (parentLogger) {
      // Child logger inherits parent's winston logger instance to avoid resource duplication
      this.logger = parentLogger.logger;
      this.logDir = parentLogger.logDir;
      this.fileLoggingEnabled = parentLogger.fileLoggingEnabled;
      this.initializationErrors = [];
      parentLogger.childLoggers.add(this);
    } else {
      // Root logger creates its own winston logger
      this.logDir = this.getLogDir();
      this.ensureLogDir();
      this.logger = this.createLogger();
    }
  }

  private getLogDir(): string {
    // Allow custom log directory via environment variable
    if (process.env.ARMSFORGE_LOG_DIR) {
      return process.env.ARMSFORGE_LOG_DIR;
    }

    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    return join(homeDir, '.armsforge', 'logs');
  }

  private ensureLogDir(): void {
    try {
      if (!existsSync(this.logDir)) {
        mkdirSync(this.logDir, { recursive: true });
      }

      // Test write permissions by creating a temporary file
      const testFile = join(this.logDir, '.write-test');
      try {
        require('fs').writeFileSync(testFile, 'test');
        require('fs').unlinkSync(testFile);
      } catch (writeError) {
        throw new Error(`Directory exists but is not writable: ${(writeError as Error).message}`);
      }
    } catch (error) {
      this.handleLogDirError(error as Error);
    }
  }

  private handleLogDirError(error: Error): void {
    this.fileLoggingEnabled = false;

    let errorMessage = `Failed to initialize log directory: ${this.logDir}`;
    let suggestion = '';

    if (error.message.includes('EACCES') || error.message.includes('permission')) {
      errorMessage += ' - Permission denied';
      suggestion = `Try running with elevated permissions or set ARMSFORGE_LOG_DIR to a writable directory`;
    } else if (error.message.includes('ENOSPC')) {
      errorMessage += ' - No space left on device';
      suggestion = 'Free up disk space or set ARMSFORGE_LOG_DIR to a different location';
    } else if (error.message.includes('ENOTDIR')) {
      errorMessage += ' - Path component is not a directory';
      suggestion = 'Check that parent directories exist and are valid';
    } else if (error.message.includes('EMFILE') || error.message.includes('ENFILE')) {
      errorMessage += ' - Too many open files';
      suggestion = 'Increase system file descriptor limits';
    } else if (error.message.includes('writable')) {
      errorMessage += ' - Directory not writable';
      suggestion = 'Change directory permissions or set ARMSFORGE_LOG_DIR to a writable location';
    } else {
      errorMessage += ` - ${error.message}`;
      suggestion = 'Check directory path and permissions';
    }

    this.initializationErrors.push(errorMessage);

    // Try fallback directories
    const fallbackDirs = [
      process.env.ARMSFORGE_LOG_DIR,
      join(process.cwd(), 'logs'),
      process.env.TMPDIR || process.env.TMP || '/tmp'
    ].filter(Boolean);

    for (const fallbackDir of fallbackDirs) {
      try {
        const testDir = join(fallbackDir!, 'armsforge-logs');
        if (!existsSync(testDir)) {
          mkdirSync(testDir, { recursive: true });
        }

        // Test write permissions
        const testFile = join(testDir, '.write-test');
        require('fs').writeFileSync(testFile, 'test');
        require('fs').unlinkSync(testFile);

        this.logDir = testDir;
        this.fileLoggingEnabled = true;
        this.initializationErrors.push(`Using fallback log directory: ${testDir}`);
        break;
      } catch (fallbackError) {
        this.initializationErrors.push(`Fallback directory ${fallbackDir} also failed: ${(fallbackError as Error).message}`);
      }
    }

    // Final fallback to console-only logging
    if (!this.fileLoggingEnabled) {
      this.initializationErrors.push('File logging disabled - falling back to console-only logging');
      console.warn(`⚠️  ${errorMessage}`);
      if (suggestion) {
        console.warn(`💡 ${suggestion}`);
      }
      console.warn('📝 Logging will continue to console only. Set ARMSFORGE_LOG_DIR environment variable to specify a custom log directory.');
    }
  }

  private getConsoleLevel(): string {
    // Allow explicit console level override
    if (process.env.ARMSFORGE_CONSOLE_LEVEL) {
      const level = process.env.ARMSFORGE_CONSOLE_LEVEL.toLowerCase();

      // Handle disable keywords first
      if (['off', 'disable', 'false'].includes(level)) {
        return LogLevel.ERROR; // Return a valid level even though console will be disabled
      }

      if (Object.values(LogLevel).includes(level as LogLevel)) {
        return level;
      }
      console.warn(`⚠️  Invalid ARMSFORGE_CONSOLE_LEVEL: ${process.env.ARMSFORGE_CONSOLE_LEVEL}. Using default.`);
    }

    // Environment-based defaults
    if (process.env.NODE_ENV === 'production') {
      // Default to ERROR level in production for essential debugging
      return LogLevel.ERROR;
    } else if (process.env.NODE_ENV === 'test') {
      // Quiet during tests unless explicitly requested
      return LogLevel.WARN;
    } else {
      // Development mode - full debug output
      return LogLevel.DEBUG;
    }
  }

  private shouldDisableConsole(): boolean {
    // Allow complete console disabling if explicitly requested
    return process.env.ARMSFORGE_CONSOLE_LEVEL === 'off' ||
           process.env.ARMSFORGE_CONSOLE_LEVEL === 'disable' ||
           process.env.ARMSFORGE_CONSOLE_LEVEL === 'false';
  }

  private sanitizeMessageForProduction(message: string): string {
    // Remove or mask potentially sensitive patterns
    return message
      // Mask file paths outside project
      .replace(/\/home\/[^\/\s]+/g, '/home/***')
      .replace(/\/Users\/[^\/\s]+/g, '/Users/***')
      .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\***')
      // Mask API keys, tokens, passwords
      .replace(/\b(key|token|password|secret|auth)[\s]*[:=][\s]*['\"]?[a-zA-Z0-9\-_+/=]{8,}['\"]?/gi, '$1=***')
      // Mask URLs with credentials
      .replace(/(https?:\/\/)[^:]+:[^@]+@/g, '$1***:***@');
  }

  private sanitizeMetadataForProduction(metadata: Record<string, unknown>): Record<string, unknown> {
    const safe: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();

      // Skip sensitive keys
      if (['password', 'token', 'key', 'secret', 'auth', 'credential'].some(s => lowerKey.includes(s))) {
        safe[key] = '***';
        continue;
      }

      // Include safe values
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        if (typeof value === 'string' && value.length > 100) {
          safe[key] = value.substring(0, 100) + '...';
        } else {
          safe[key] = value;
        }
      } else {
        safe[key] = '[object]';
      }
    }

    return safe;
  }

  private formatProductionSafeMessage(info: any): string {
    const timestamp = c.dim(`[${info.timestamp}]`);
    const level = this.formatLogLevel(info.level);
    const component = info.context?.component ? c.muted(`[${info.context.component}]`) : '';
    const operation = info.context?.operation ? c.dim(`${info.context.operation}:`) : '';

    // Filter message for sensitive content in production
    const safeMessage = this.sanitizeMessageForProduction(info.message);
    let message = `${timestamp} ${level} ${component} ${operation} ${safeMessage}`;

    // Add limited context metadata (no sensitive values)
    if (info.context?.metadata) {
      const safeMetadata = this.sanitizeMetadataForProduction(info.context.metadata);
      if (Object.keys(safeMetadata).length > 0) {
        const metadata = Object.entries(safeMetadata)
          .map(([key, value]) => `${c.dim(key)}=${c.text(String(value))}`)
          .join(' ');
        message += ` ${c.muted(`{${metadata}}`)}`;
      }
    }

    // Add error details if present (but sanitized)
    if (info.error) {
      if (info.error instanceof ArmsforgeError) {
        message += `\n  ${c.error('Code:')} ${info.error.code}`;
        // Don't expose full context in production console logs
        message += `\n  ${c.error('Type:')} ArmsforgeError`;
      } else {
        message += `\n  ${c.error('Error:')} ${info.error.name || 'Error'}`;
      }
      // Only show stack traces in development or if explicitly enabled
      if (process.env.ARMSFORGE_CONSOLE_STACK === 'true' && info.error.stack) {
        message += `\n${c.dim(info.error.stack)}`;
      }
    }

    return message;
  }

  private createProductionSafeFormat() {
    return format.combine(
      format.timestamp({ format: 'HH:mm:ss' }),
      format.printf((info: any) => {
        // In production, filter out potentially sensitive information
        if (process.env.NODE_ENV === 'production') {
          return this.formatProductionSafeMessage(info);
        } else {
          return this.formatConsoleMessage(info);
        }
      })
    );
  }

  private createLogger(): Logger {
    const logFormat = format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json()
    );

    const consoleFormat = this.createProductionSafeFormat();

    // Build transports array based on availability
    const logTransports: any[] = [];

    // File transports (only if file logging is enabled)
    if (this.fileLoggingEnabled) {
      try {
        logTransports.push(
          // File transport for all logs
          new transports.File({
            filename: join(this.logDir, 'armsforge.log'),
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
            tailable: true
          }),

          // Separate file for errors
          new transports.File({
            filename: join(this.logDir, 'errors.log'),
            level: LogLevel.ERROR,
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 3,
            tailable: true
          })
        );
      } catch (error) {
        this.fileLoggingEnabled = false;
        this.initializationErrors.push(`Failed to create file transports: ${(error as Error).message}`);
        console.warn(`⚠️  File transport creation failed, falling back to console-only logging: ${(error as Error).message}`);
      }
    }

    // Console transport with configurable level (can be disabled)
    if (!this.shouldDisableConsole()) {
      logTransports.push(
        new transports.Console({
          format: consoleFormat,
          level: this.getConsoleLevel()
        })
      );
    }

    // Exception and rejection handlers (with fallback)
    const exceptionHandlers: any[] = [];
    const rejectionHandlers: any[] = [];

    if (this.fileLoggingEnabled) {
      try {
        exceptionHandlers.push(
          new transports.File({ filename: join(this.logDir, 'exceptions.log') })
        );
        rejectionHandlers.push(
          new transports.File({ filename: join(this.logDir, 'rejections.log') })
        );
      } catch (error) {
        console.warn(`⚠️  Failed to create exception/rejection file handlers: ${(error as Error).message}`);
      }
    }

    // Always include console handlers as fallback
    exceptionHandlers.push(new transports.Console());
    rejectionHandlers.push(new transports.Console());

    const logger = createLogger({
      level: process.env.ARMSFORGE_LOG_LEVEL || LogLevel.INFO,
      format: logFormat,
      transports: logTransports,
      exceptionHandlers,
      rejectionHandlers
    });

    // Log initialization status
    if (this.initializationErrors.length > 0) {
      // Use setTimeout to avoid logging during logger construction
      setTimeout(() => {
        for (const error of this.initializationErrors) {
          logger.warn(`Logger initialization: ${error}`, {
            context: { component: 'logger', operation: 'initialization' }
          });
        }
      }, 0);
    }

    return logger;
  }

  private formatConsoleMessage(info: any): string {
    const timestamp = c.dim(`[${info.timestamp}]`);
    const level = this.formatLogLevel(info.level);
    const component = info.context?.component ? c.muted(`[${info.context.component}]`) : '';
    const operation = info.context?.operation ? c.dim(`${info.context.operation}:`) : '';

    let message = `${timestamp} ${level} ${component} ${operation} ${info.message}`;

    // Add context metadata if present
    if (info.context?.metadata) {
      const metadata = Object.entries(info.context.metadata)
        .map(([key, value]) => `${c.dim(key)}=${c.text(String(value))}`)
        .join(' ');
      message += ` ${c.muted(`{${metadata}}`)}`;
    }

    // Add error details if present
    if (info.error) {
      if (info.error instanceof ArmsforgeError) {
        message += `\n  ${c.error('Code:')} ${info.error.code}`;
        message += `\n  ${c.error('Context:')} ${JSON.stringify(info.error.context)}`;
        if (info.error.suggestions.length > 0) {
          message += `\n  ${c.warning('Suggestions:')} ${info.error.suggestions.join(', ')}`;
        }
      }
      if (info.error.stack) {
        message += `\n${c.dim(info.error.stack)}`;
      }
    }

    return message;
  }

  private formatLogLevel(level: string): string {
    switch (level) {
      case LogLevel.ERROR:
        return c.error('ERROR');
      case LogLevel.WARN:
        return c.warning('WARN ');
      case LogLevel.INFO:
        return c.info('INFO ');
      case LogLevel.HTTP:
        return c.text('HTTP ');
      case LogLevel.VERBOSE:
        return c.dim('VERB ');
      case LogLevel.DEBUG:
        return c.muted('DEBUG');
      case LogLevel.SILLY:
        return c.dim('SILLY');
      default:
        return level.toUpperCase().padEnd(5);
    }
  }

  /**
   * Log an error with full context
   */
  public error(message: string, context: LogContext, error?: Error | ArmsforgeError): void {
    this.logger.error(message, {
      context: { ...context, timestamp: new Date() },
      error
    });
  }

  /**
   * Log a warning
   */
  public warn(message: string, context: LogContext): void {
    this.logger.warn(message, {
      context: { ...context, timestamp: new Date() }
    });
  }

  /**
   * Log info message
   */
  public info(message: string, context: LogContext): void {
    this.logger.info(message, {
      context: { ...context, timestamp: new Date() }
    });
  }

  /**
   * Log debug information
   */
  public debug(message: string, context: LogContext): void {
    this.logger.debug(message, {
      context: { ...context, timestamp: new Date() }
    });
  }

  /**
   * Log HTTP requests
   */
  public http(message: string, context: LogContext): void {
    this.logger.http(message, {
      context: { ...context, timestamp: new Date() }
    });
  }

  /**
   * Log tool execution start
   */
  public toolStart(toolName: string, params: unknown, context: Partial<LogContext> = {}): void {
    this.info(`Tool started: ${toolName}`, {
      component: 'mcp-server',
      operation: 'tool_execution',
      toolName,
      metadata: { params },
      ...context
    });
  }

  /**
   * Log tool execution success
   */
  public toolSuccess(toolName: string, duration: number, context: Partial<LogContext> = {}): void {
    this.info(`Tool completed successfully: ${toolName}`, {
      component: 'mcp-server',
      operation: 'tool_execution',
      toolName,
      duration,
      ...context
    });
  }

  /**
   * Log tool execution failure
   */
  public toolError(toolName: string, error: Error | ArmsforgeError, context: Partial<LogContext> = {}): void {
    this.error(`Tool failed: ${toolName}`, {
      component: 'mcp-server',
      operation: 'tool_execution',
      toolName,
      ...context
    }, error);
  }

  /**
   * Log template operations
   */
  public templateOperation(
    operation: string,
    templateName: string,
    success: boolean,
    context: Partial<LogContext> = {}
  ): void {
    const message = `Template ${operation}: ${templateName} - ${success ? 'success' : 'failed'}`;
    const logContext = {
      component: 'template-engine',
      operation,
      templateName,
      ...context
    };

    if (success) {
      this.info(message, logContext);
    } else {
      this.warn(message, logContext);
    }
  }

  /**
   * Log file operations
   */
  public fileOperation(
    operation: string,
    filePath: string,
    success: boolean,
    context: Partial<LogContext> = {}
  ): void {
    const message = `File ${operation}: ${filePath} - ${success ? 'success' : 'failed'}`;
    const logContext = {
      component: 'file-system',
      operation,
      filePath,
      ...context
    };

    if (success) {
      this.debug(message, logContext);
    } else {
      this.error(message, logContext);
    }
  }

  /**
   * Log configuration operations
   */
  public configOperation(
    operation: string,
    configPath: string,
    success: boolean,
    context: Partial<LogContext> = {}
  ): void {
    const message = `Config ${operation}: ${configPath} - ${success ? 'success' : 'failed'}`;
    const logContext = {
      component: 'config',
      operation,
      filePath: configPath,
      ...context
    };

    if (success) {
      this.info(message, logContext);
    } else {
      this.error(message, logContext);
    }
  }

  /**
   * Log server lifecycle events
   */
  public serverEvent(event: string, context: Partial<LogContext> = {}): void {
    this.info(`Server ${event}`, {
      component: 'mcp-server',
      operation: 'lifecycle',
      ...context
    });
  }

  /**
   * Create a child logger with default context
   * Uses inheritance pattern to avoid memory leaks
   */
  public child(defaultContext: Partial<LogContext>): ArmsforgeLogger {
    // Merge parent's default context with new context
    const mergedContext = { ...this.defaultContext, ...defaultContext };
    return new ArmsforgeLogger(this, mergedContext);
  }

  /**
   * Clean up child logger references (called automatically by WeakSet GC)
   */
  public dispose(): void {
    // WeakSet automatically handles cleanup when child loggers are garbage collected
    // This method exists for explicit cleanup if needed
    if (this.parentLogger) {
      this.parentLogger = undefined;
    }
  }

  /**
   * Measure operation duration
   */
  public timeOperation<T>(
    operation: string,
    fn: () => T | Promise<T>,
    context: Partial<LogContext> = {}
  ): T | Promise<T> {
    const start = Date.now();
    const logContext = { component: 'unknown', operation, ...context };

    this.debug(`Starting operation: ${operation}`, logContext);

    try {
      const result = fn();

      if (result instanceof Promise) {
        return result
          .then((value) => {
            const duration = Date.now() - start;
            this.debug(`Completed operation: ${operation}`, { ...logContext, duration });
            return value;
          })
          .catch((error) => {
            const duration = Date.now() - start;
            this.error(`Failed operation: ${operation}`, { ...logContext, duration }, error);
            throw error;
          });
      } else {
        const duration = Date.now() - start;
        this.debug(`Completed operation: ${operation}`, { ...logContext, duration });
        return result;
      }
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed operation: ${operation}`, { ...logContext, duration }, error as Error);
      throw error;
    }
  }

  /**
   * Get logger statistics and status
   */
  public getStats(): {
    logDir: string;
    transports: number;
    level: string;
    fileLoggingEnabled: boolean;
    consoleLoggingEnabled: boolean;
    consoleLevel: string;
    initializationErrors: string[];
  } {
    return {
      logDir: this.logDir,
      transports: this.logger.transports.length,
      level: this.logger.level,
      fileLoggingEnabled: this.fileLoggingEnabled,
      consoleLoggingEnabled: !this.shouldDisableConsole(),
      consoleLevel: this.getConsoleLevel(),
      initializationErrors: [...this.initializationErrors]
    };
  }

  /**
   * Get initialization status
   */
  public getInitializationStatus(): {
    success: boolean;
    fileLoggingEnabled: boolean;
    errors: string[];
    logDirectory: string;
  } {
    return {
      success: this.initializationErrors.length === 0 || this.fileLoggingEnabled,
      fileLoggingEnabled: this.fileLoggingEnabled,
      errors: [...this.initializationErrors],
      logDirectory: this.logDir
    };
  }

  /**
   * Check if logger is healthy (can log without errors)
   */
  public isHealthy(): boolean {
    return this.fileLoggingEnabled || this.logger.transports.some(t => t instanceof transports.Console);
  }

  /**
   * Flush all pending logs
   */
  public async flush(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.on('finish', resolve);
      this.logger.end();
    });
  }
}

// Create singleton instance
const logger = new ArmsforgeLogger();

// Export logger instance and types
export { logger, ArmsforgeLogger };
export default logger;