import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { join, normalize, resolve } from 'path';
import { homedir } from 'os';
import { z } from 'zod';
import { TemplateContext } from '../templates/context.js';

// Zod schema for user preferences validation
const UserPreferencesSchema = z.object({
  default_template_context: z.object({
    target_arch: z.enum(["x86", "x64", "arm64"]).default("x64"),
    target_os: z.enum(["windows", "linux", "macos"]).default("windows"),
    evasion_level: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
    payload_format: z.enum(["exe", "dll", "shellcode", "script"]).default("exe"),
    language: z.enum(["c", "cpp", "csharp", "rust", "go", "python"]).default("c")
  }),
  template_preferences: z.object({
    auto_compile: z.boolean().default(false),
    include_comments: z.boolean().default(true),
    randomize_variables: z.boolean().default(false),
    preferred_languages: z.array(z.string()).default([]),
    blacklisted_templates: z.array(z.string()).default([])
  }).default({}),
  output_preferences: z.object({
    default_output_dir: z.string().optional(),
    filename_format: z.enum(["timestamp", "template_name", "custom"]).default("template_name"),
    include_metadata: z.boolean().default(true)
  }).default({})
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// Simple mutex implementation for preventing race conditions
class Mutex {
  private locked = false;
  private queue: (() => void)[] = [];

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next();
    } else {
      this.locked = false;
    }
  }
}

export class UserPreferencesManager {
  private configPath: string;
  private preferences: UserPreferences;
  private static saveMutex = new Mutex();

  constructor(configPath?: string) {
    this.configPath = configPath || this.getDefaultConfigPath();

    // Validate the config path early for security
    if (configPath) {
      const configDir = normalize(resolve(join(this.configPath, '..')));
      this.validateConfigPath(configDir);
    }

    this.preferences = this.loadPreferences();
  }

  private getDefaultConfigPath(): string {
    try {
      // Use Node's built-in os.homedir() instead of trusting environment variables
      const homeDir = homedir();

      // Validate and normalize the path
      const configDir = normalize(resolve(homeDir, '.armsforge'));
      const configPath = join(configDir, 'config.json');

      // Basic security check: ensure the path is within the home directory
      const normalizedHome = normalize(resolve(homeDir));
      const normalizedConfigDir = normalize(resolve(configDir));

      if (!normalizedConfigDir.startsWith(normalizedHome)) {
        throw new Error('Config path traversal detected');
      }

      return configPath;
    } catch (error) {
      // Fallback to current directory if home directory is unavailable
      // This is safer than trusting environment variables
      const fallbackPath = normalize(resolve('.', '.armsforge', 'config.json'));
      return fallbackPath;
    }
  }

  /**
   * Load preferences from config file or create default
   */
  private loadPreferences(): UserPreferences {
    if (!existsSync(this.configPath)) {
      return this.createDefaultPreferences();
    }

    try {
      const configContent = readFileSync(this.configPath, 'utf-8');
      const rawPrefs = JSON.parse(configContent);

      // Validate and parse with Zod
      const parsed = UserPreferencesSchema.parse(rawPrefs);
      return parsed;
    } catch (error) {
      // Categorize and handle errors appropriately
      this.handleConfigurationError(error);
      return this.createDefaultPreferences();
    }
  }

  /**
   * Handle configuration errors with proper categorization and logging
   */
  private handleConfigurationError(error: unknown): void {
    const errorInfo = this.categorizeConfigError(error);

    // Write to stderr to avoid corrupting MCP stdio transport
    // This allows debugging while maintaining MCP compatibility
    if (process.stderr && !process.env.MCP_SUPPRESS_CONFIG_ERRORS) {
      process.stderr.write(`[ARMSFORGE CONFIG] ${errorInfo.category}: ${errorInfo.message}\n`);

      if (errorInfo.recoverable) {
        process.stderr.write(`[ARMSFORGE CONFIG] Using default configuration. Fix the issue above and restart.\n`);
      }

      if (errorInfo.context) {
        process.stderr.write(`[ARMSFORGE CONFIG] Context: ${errorInfo.context}\n`);
      }
    }
  }

  /**
   * Categorize configuration errors for appropriate handling
   */
  private categorizeConfigError(error: unknown): {
    category: string;
    message: string;
    recoverable: boolean;
    context?: string;
  } {
    if (error instanceof Error) {
      // File system errors
      if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
        return {
          category: 'PERMISSION_DENIED',
          message: `Cannot read config file: ${this.configPath} (permission denied)`,
          recoverable: true,
          context: 'Check file permissions or run with appropriate privileges'
        };
      }

      if (error.message.includes('ENOENT')) {
        return {
          category: 'FILE_NOT_FOUND',
          message: `Config file not found: ${this.configPath}`,
          recoverable: true,
          context: 'This is normal for first run - default config will be used'
        };
      }

      // JSON parsing errors
      if (error instanceof SyntaxError || error.message.includes('JSON')) {
        return {
          category: 'MALFORMED_JSON',
          message: `Invalid JSON in config file: ${this.configPath}`,
          recoverable: true,
          context: 'Fix JSON syntax errors or delete the file to regenerate defaults'
        };
      }

      // Zod validation errors
      if (error.name === 'ZodError' || error.message.includes('validation')) {
        return {
          category: 'VALIDATION_FAILED',
          message: `Configuration validation failed: ${error.message}`,
          recoverable: true,
          context: 'Check config values against expected schema or reset to defaults'
        };
      }
    }

    // Generic/unknown errors
    return {
      category: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : String(error),
      recoverable: true,
      context: 'Consider deleting config file to regenerate defaults'
    };
  }

  /**
   * Create default preferences
   */
  private createDefaultPreferences(): UserPreferences {
    return {
      default_template_context: {
        target_arch: "x64",
        target_os: "windows",
        evasion_level: 1,
        payload_format: "exe",
        language: "c"
      },
      template_preferences: {
        auto_compile: false,
        include_comments: true,
        randomize_variables: false,
        preferred_languages: [],
        blacklisted_templates: []
      },
      output_preferences: {
        filename_format: "template_name",
        include_metadata: true
      }
    };
  }

  /**
   * Save current preferences to file (async with race condition protection)
   */
  public async savePreferences(): Promise<void> {
    await UserPreferencesManager.saveMutex.acquire();

    try {
      const configDir = normalize(resolve(join(this.configPath, '..')));

      // Validate the config directory path
      this.validateConfigPath(configDir);

      // Ensure config directory exists safely with async operations
      await this.ensureDirectoryExists(configDir);

      const configContent = JSON.stringify(this.preferences, null, 2);
      await writeFile(this.configPath, configContent, {
        encoding: 'utf-8',
        mode: 0o644,
        flag: 'w'
      });
    } catch (error) {
      throw new Error(`Failed to save preferences to ${this.configPath}: ${error}`);
    } finally {
      UserPreferencesManager.saveMutex.release();
    }
  }

  /**
   * Safely ensure directory exists with proper race condition handling
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      // Check if directory exists
      await access(dirPath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Directory doesn't exist, try to create it
        try {
          await mkdir(dirPath, {
            recursive: true,
            mode: 0o755
          });
        } catch (mkdirError: any) {
          // Handle race condition: another process may have created the directory
          if (mkdirError.code === 'EEXIST') {
            // Directory was created by another process, verify it exists and is accessible
            try {
              await access(dirPath);
            } catch (accessError) {
              throw new Error(`Directory created but not accessible: ${dirPath}`);
            }
          } else {
            throw mkdirError;
          }
        }
      } else {
        // Some other error occurred during access check
        throw error;
      }
    }
  }

  /**
   * Synchronous save method for backward compatibility (delegates to async version)
   */
  public savePreferencesSync(): void {
    const configDir = normalize(resolve(join(this.configPath, '..')));
    this.validateConfigPath(configDir);

    // Ensure config directory exists with sync operations and race condition handling
    try {
      if (!existsSync(configDir)) {
        mkdirSync(configDir, {
          recursive: true,
          mode: 0o755
        });
      }
    } catch (error: any) {
      // Handle race condition in sync version
      if (error.code === 'EEXIST') {
        // Directory was created by another process, continue
      } else {
        throw error;
      }
    }

    try {
      const configContent = JSON.stringify(this.preferences, null, 2);
      writeFileSync(this.configPath, configContent, {
        encoding: 'utf-8',
        mode: 0o644,
        flag: 'w'
      });
    } catch (error) {
      throw new Error(`Failed to save preferences to ${this.configPath}: ${error}`);
    }
  }

  /**
   * Validate config path for security
   */
  private validateConfigPath(configPath: string): void {
    try {
      const normalizedPath = normalize(resolve(configPath));
      const originalPath = configPath;

      // Ensure the original path doesn't contain traversal attempts
      if (originalPath.includes('..')) {
        throw new Error('Path traversal detected in config path');
      }

      // Ensure the path is reasonable length (prevent DoS)
      if (normalizedPath.length > 1000) {
        throw new Error('Config path too long');
      }

      // Ensure it's not pointing to system directories
      const systemDirs = ['/etc', '/usr', '/var', '/bin', '/sbin', '/root'];
      if (process.platform !== 'win32' && systemDirs.some(dir => normalizedPath.startsWith(dir))) {
        throw new Error('Cannot write config to system directory');
      }

      // Additional check for relative path traversals that resolve outside expected areas
      const cwd = process.cwd();
      const homeDir = homedir();
      if (!normalizedPath.startsWith(cwd) && !normalizedPath.startsWith(homeDir)) {
        throw new Error('Config path outside allowed directories');
      }

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Invalid config path: ${error}`);
    }
  }

  /**
   * Get current preferences with deep cloning
   */
  public getPreferences(): UserPreferences {
    // Use structuredClone if available (Node.js 17+), otherwise fallback to JSON deep clone
    if (typeof structuredClone !== 'undefined') {
      return structuredClone(this.preferences);
    } else {
      // Fallback for older Node.js versions
      return JSON.parse(JSON.stringify(this.preferences));
    }
  }

  /**
   * Get default template context from preferences
   */
  public getDefaultTemplateContext(): TemplateContext {
    return { ...this.preferences.default_template_context };
  }

  /**
   * Update default template context
   */
  public updateDefaultTemplateContext(context: Partial<TemplateContext>): void {
    this.preferences.default_template_context = {
      ...this.preferences.default_template_context,
      ...context
    };
  }

  /**
   * Update template preferences
   */
  public updateTemplatePreferences(prefs: Partial<UserPreferences['template_preferences']>): void {
    this.preferences.template_preferences = {
      ...this.preferences.template_preferences,
      ...prefs
    };
  }

  /**
   * Update output preferences
   */
  public updateOutputPreferences(prefs: Partial<UserPreferences['output_preferences']>): void {
    this.preferences.output_preferences = {
      ...this.preferences.output_preferences,
      ...prefs
    };
  }

  /**
   * Check if a template is blacklisted
   */
  public isTemplateBlacklisted(templateName: string): boolean {
    return this.preferences.template_preferences.blacklisted_templates.includes(templateName);
  }

  /**
   * Add template to blacklist
   */
  public blacklistTemplate(templateName: string): void {
    if (!this.isTemplateBlacklisted(templateName)) {
      this.preferences.template_preferences.blacklisted_templates.push(templateName);
    }
  }

  /**
   * Remove template from blacklist
   */
  public unblacklistTemplate(templateName: string): void {
    const blacklist = this.preferences.template_preferences.blacklisted_templates;
    const index = blacklist.indexOf(templateName);
    if (index > -1) {
      blacklist.splice(index, 1);
    }
  }

  /**
   * Check if a language is preferred
   */
  public isLanguagePreferred(language: string): boolean {
    return this.preferences.template_preferences.preferred_languages.includes(language);
  }

  /**
   * Add language to preferred list
   */
  public addPreferredLanguage(language: string): void {
    if (!this.isLanguagePreferred(language)) {
      this.preferences.template_preferences.preferred_languages.push(language);
    }
  }

  /**
   * Remove language from preferred list
   */
  public removePreferredLanguage(language: string): void {
    const preferred = this.preferences.template_preferences.preferred_languages;
    const index = preferred.indexOf(language);
    if (index > -1) {
      preferred.splice(index, 1);
    }
  }

  /**
   * Get configuration schema for validation
   */
  public static getSchema(): typeof UserPreferencesSchema {
    return UserPreferencesSchema;
  }

  /**
   * Validate preferences object
   */
  public static validate(prefs: unknown): UserPreferences {
    return UserPreferencesSchema.parse(prefs);
  }

  /**
   * Reset to default preferences
   */
  public resetToDefaults(): void {
    this.preferences = this.createDefaultPreferences();
  }
}