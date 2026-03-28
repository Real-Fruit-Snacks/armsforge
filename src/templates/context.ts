import {
  ArchitectureSchema,
  OperatingSystemSchema,
  EvasionLevelSchema,
  PayloadFormatSchema,
  LanguageSchema
} from '../utils/validation.js';

export interface TemplateContext {
  target_arch: "x86" | "x64" | "arm64";
  target_os: "windows" | "linux" | "macos";
  evasion_level: 1 | 2 | 3; // Basic/Intermediate/Advanced
  payload_format: "exe" | "dll" | "shellcode" | "script";
  language: "c" | "cpp" | "csharp" | "rust" | "go" | "python";
}

export interface TemplateInfo {
  name: string;
  filename: string;
  description: string;
  supportedLanguages: string[];
  supportedArchitectures: string[];
  supportedOS: string[];
}

export class TemplateContextManager {
  private defaultContext: TemplateContext;

  constructor(defaultContext?: Partial<TemplateContext>) {
    this.defaultContext = {
      target_arch: "x64",
      target_os: "windows",
      evasion_level: 1,
      payload_format: "exe",
      language: "c",
      ...defaultContext
    };
  }

  /**
   * Get the default context with optional overrides
   */
  public getContext(overrides?: Partial<TemplateContext>): TemplateContext {
    return {
      ...this.defaultContext,
      ...overrides
    };
  }

  /**
   * Update the default context
   */
  public setDefaultContext(context: Partial<TemplateContext>): void {
    this.defaultContext = {
      ...this.defaultContext,
      ...context
    };
  }

  /**
   * Get the current default context
   */
  public getDefaultContext(): TemplateContext {
    return { ...this.defaultContext };
  }

  /**
   * Create context from string parameters (for CLI/API usage)
   */
  public createContextFromParams(params: {
    arch?: string;
    os?: string;
    evasion?: string | number;
    format?: string;
    language?: string;
  }): TemplateContext {
    const context: Partial<TemplateContext> = {};

    // Use Zod schemas for type-safe validation
    if (params.arch) {
      const archResult = ArchitectureSchema.safeParse(params.arch);
      if (archResult.success) {
        context.target_arch = archResult.data;
      }
    }

    if (params.os) {
      const osResult = OperatingSystemSchema.safeParse(params.os);
      if (osResult.success) {
        context.target_os = osResult.data;
      }
    }

    if (params.evasion) {
      const level = typeof params.evasion === "string" ? parseInt(params.evasion) : params.evasion;
      const evasionResult = EvasionLevelSchema.safeParse(level);
      if (evasionResult.success) {
        context.evasion_level = evasionResult.data;
      }
    }

    if (params.format) {
      const formatResult = PayloadFormatSchema.safeParse(params.format);
      if (formatResult.success) {
        context.payload_format = formatResult.data;
      }
    }

    if (params.language) {
      const languageResult = LanguageSchema.safeParse(params.language);
      if (languageResult.success) {
        context.language = languageResult.data;
      }
    }

    return this.getContext(context);
  }

  /**
   * Validate that a context is complete and valid using Zod schemas
   */
  public validateContext(context: TemplateContext): boolean {
    // Use Zod schemas instead of hardcoded arrays
    return (
      ArchitectureSchema.safeParse(context.target_arch).success &&
      OperatingSystemSchema.safeParse(context.target_os).success &&
      EvasionLevelSchema.safeParse(context.evasion_level).success &&
      PayloadFormatSchema.safeParse(context.payload_format).success &&
      LanguageSchema.safeParse(context.language).success
    );
  }

  /**
   * Get human-readable description of context
   */
  public contextToString(context: TemplateContext): string {
    const evasionLevelNames = {
      1: "Basic",
      2: "Intermediate",
      3: "Advanced"
    };

    return `${context.language.toUpperCase()} ${context.payload_format} for ` +
           `${context.target_os} ${context.target_arch} (${evasionLevelNames[context.evasion_level]} evasion)`;
  }
}