import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename, resolve, sep } from "path";
import { homedir } from "os";
import { c, formatTitle, formatSection, formatStatus, formatPath, formatCode, generateColorHints } from "../theme/catppuccin.js";
import { extractDescriptionSimple } from "../utils/regex-patterns.js";
import { TemplateEngine } from "../templates/engine.js";
import { TemplateContextManager, TemplateContext } from "../templates/context.js";
import { UserPreferencesManager } from "../config/user-preferences.js";
import { ArmsforgeError, ErrorCode, ErrorContext, safeAsync, safeSync } from "../utils/errors.js";
import {
  validateTemplateMetadata,
  safeFilter,
  globalCircuitBreaker,
  globalPerformanceMonitor,
  SecurityError,
  DEFAULT_SECURITY_LIMITS
} from "../utils/security.js";
import {
  validateToolParams,
  validateFilePath,
  validateTemplateName,
  validateQuery,
  validateDetectionData,
  resolveSafePath,
  ListTemplatesParamsSchema,
  GetTemplateParamsSchema,
  GetSnippetParamsSchema,
  SetTemplateContextParamsSchema,
  GetTemplateInfoParamsSchema,
  DetectionLookupParamsSchema
} from "../utils/validation.js";
import logger from "../utils/logger.js";

const server = new McpServer({
  name: "armsforge",
  version: "0.1.0",
});

// Initialize logger context
const serverContext = { component: "mcp-server", operation: "initialization" };

// Initialize template engine and preferences with error handling
let userPrefs: UserPreferencesManager;
let contextManager: TemplateContextManager;
let templateEngine: TemplateEngine;

try {
  logger.serverEvent("initializing", serverContext);

  userPrefs = new UserPreferencesManager();
  contextManager = new TemplateContextManager(userPrefs.getDefaultTemplateContext());

  logger.info("Successfully initialized preferences and context manager", serverContext);
} catch (error) {
  logger.error("Failed to initialize preferences, using fallback configuration",
              serverContext, error as Error);
  // Use fallback configuration
  userPrefs = new UserPreferencesManager();
  contextManager = new TemplateContextManager();
}

// --- Template & Snippet Tools ---

function getPluginRoot(): string {
  const envRoot = process.env.CLAUDE_PLUGIN_ROOT;
  const defaultRoot = join(__dirname, "..");

  if (envRoot) {
    try {
      // Define allowed base directories for security
      const allowedBases = [
        resolve(__dirname, ".."), // Default plugin directory
        resolve(process.cwd()), // Current working directory
        resolve(homedir(), '.armsforge'), // User's armsforge config
        resolve(homedir(), '.claude') // Claude config directory
      ];

      // Check if the environment variable path is within any allowed base
      let validatedPath: string | null = null;
      for (const baseDir of allowedBases) {
        try {
          // Use resolveSafePath to prevent directory traversal
          validatedPath = resolveSafePath(baseDir, envRoot);
          break; // Successfully validated against this base
        } catch (error) {
          // Try next base directory
          continue;
        }
      }

      if (!validatedPath) {
        logger.error(
          `SECURITY: CLAUDE_PLUGIN_ROOT path validation failed: ${envRoot}`,
          {
            component: "mcp-server",
            operation: "get_plugin_root",
            metadata: {
              originalPath: envRoot,
              allowedBases: allowedBases,
              reason: "path_outside_allowed_bases"
            }
          }
        );
        // Fall back to default for security
        return defaultRoot;
      }

      // Additional existence check after validation
      if (!existsSync(validatedPath)) {
        logger.warn(
          `CLAUDE_PLUGIN_ROOT path does not exist: ${envRoot} (resolved: ${validatedPath})`,
          { component: "mcp-server", operation: "get_plugin_root" }
        );
        // Continue using the validated path even if it doesn't exist yet
      }

      // Log usage of override for security awareness
      logger.info(
        `Using validated CLAUDE_PLUGIN_ROOT override: ${validatedPath}`,
        {
          component: "mcp-server",
          operation: "get_plugin_root",
          metadata: { originalPath: envRoot }
        }
      );

      return validatedPath;

    } catch (error) {
      logger.error(
        `SECURITY: Error validating CLAUDE_PLUGIN_ROOT: ${envRoot}`,
        {
          component: "mcp-server",
          operation: "get_plugin_root",
          metadata: { originalPath: envRoot }
        },
        error as Error
      );
      // Fall back to default for security
      return defaultRoot;
    }
  }

  return defaultRoot;
}

function getDataDir(): string {
  return join(getPluginRoot(), "data");
}

function getTemplatesDir(): string {
  return join(getPluginRoot(), "templates");
}

// Enhanced template engine initialization with comprehensive diagnostics
function initTemplateEngine(): void {
  if (templateEngine) {
    return; // Already initialized
  }

  const context = { component: "template-engine", operation: "initialization" };

  try {
    const templatesDir = getTemplatesDir();
    logger.debug(`Initializing template engine with directory: ${templatesDir}`, context);

    // Comprehensive pre-initialization diagnostics
    const diagnostics = performTemplateEngineDiagnostics(templatesDir, context);
    if (!diagnostics.canInitialize) {
      throw new ArmsforgeError(
        ErrorCode.TOOL_INITIALIZATION_ERROR,
        `Template engine initialization failed: ${diagnostics.primaryIssue}`,
        context,
        {
          userMessage: `Cannot initialize template engine: ${diagnostics.primaryIssue}`,
          suggestions: diagnostics.suggestions
        }
      );
    }

    templateEngine = new TemplateEngine(templatesDir);
    logger.info("Template engine initialized successfully", context);
  } catch (error) {
    logger.error("Failed to initialize template engine", context, error as Error);
    throw error;
  }
}

/**
 * Perform comprehensive diagnostics for template engine initialization
 * Returns detailed information about potential issues and recovery steps
 */
function performTemplateEngineDiagnostics(templatesDir: string, context: ErrorContext): {
  canInitialize: boolean;
  primaryIssue?: string;
  suggestions: string[];
  diagnosticDetails: Record<string, unknown>;
} {
  const diagnostics = {
    canInitialize: true,
    primaryIssue: undefined as string | undefined,
    suggestions: [] as string[],
    diagnosticDetails: {} as Record<string, unknown>
  };

  try {
    // Check if templates directory exists
    if (!existsSync(templatesDir)) {
      diagnostics.canInitialize = false;
      diagnostics.primaryIssue = `Templates directory not found: ${templatesDir}`;
      diagnostics.suggestions = [
        `Create the templates directory: mkdir -p "${templatesDir}"`,
        "Verify the plugin installation is complete",
        "Check if templates were extracted correctly during setup"
      ];
      diagnostics.diagnosticDetails.directoryExists = false;
      diagnostics.diagnosticDetails.expectedPath = templatesDir;
      return diagnostics;
    }

    // Check directory permissions
    try {
      const stats = require('fs').statSync(templatesDir);
      diagnostics.diagnosticDetails.isDirectory = stats.isDirectory();

      if (!stats.isDirectory()) {
        diagnostics.canInitialize = false;
        diagnostics.primaryIssue = `Path exists but is not a directory: ${templatesDir}`;
        diagnostics.suggestions = [
          `Remove the file and create directory: rm "${templatesDir}" && mkdir -p "${templatesDir}"`,
          "Check for file system corruption",
          "Verify plugin installation integrity"
        ];
        return diagnostics;
      }

      // Test read permissions
      try {
        require('fs').accessSync(templatesDir, require('fs').constants.R_OK);
        diagnostics.diagnosticDetails.hasReadPermission = true;
      } catch {
        diagnostics.canInitialize = false;
        diagnostics.primaryIssue = `No read permission for templates directory: ${templatesDir}`;
        diagnostics.suggestions = [
          `Fix permissions: chmod 755 "${templatesDir}"`,
          "Run with appropriate user permissions",
          "Check if directory is owned by current user"
        ];
        diagnostics.diagnosticDetails.hasReadPermission = false;
        return diagnostics;
      }
    } catch (permError) {
      diagnostics.canInitialize = false;
      diagnostics.primaryIssue = `Cannot access templates directory: ${(permError as Error).message}`;
      diagnostics.suggestions = [
        "Check file system permissions",
        "Verify the path is accessible",
        "Try running with elevated permissions if necessary"
      ];
      diagnostics.diagnosticDetails.accessError = (permError as Error).message;
      return diagnostics;
    }

    // Check for template files
    try {
      const files = require('fs').readdirSync(templatesDir);
      const templateFiles = files.filter((f: string) => f.endsWith('.hbs'));

      diagnostics.diagnosticDetails.totalFiles = files.length;
      diagnostics.diagnosticDetails.templateFiles = templateFiles.length;
      diagnostics.diagnosticDetails.templateFilesList = templateFiles;

      if (templateFiles.length === 0) {
        // Not a fatal error, but worth noting
        diagnostics.suggestions.push(
          "No template files found - add .hbs files to enable template functionality",
          `Expected location: ${templatesDir}/*.hbs`
        );
        logger.warn("No template files found in directory", {
          ...context,
          metadata: { templatesDir, totalFiles: files.length }
        });
      }
    } catch (readError) {
      diagnostics.canInitialize = false;
      diagnostics.primaryIssue = `Cannot read templates directory contents: ${(readError as Error).message}`;
      diagnostics.suggestions = [
        "Check directory read permissions",
        "Verify directory is not corrupted",
        "Try recreating the templates directory"
      ];
      diagnostics.diagnosticDetails.readError = (readError as Error).message;
      return diagnostics;
    }

    // Test TemplateEngine constructor requirements
    try {
      // Check if we can instantiate the required dependencies
      const testPath = templatesDir;

      // Validate path format
      if (typeof testPath !== 'string' || testPath.trim().length === 0) {
        diagnostics.canInitialize = false;
        diagnostics.primaryIssue = "Invalid templates directory path";
        diagnostics.suggestions = [
          "Check plugin configuration",
          "Verify environment setup",
          "Reinstall the plugin if necessary"
        ];
        return diagnostics;
      }

    } catch (constructorError) {
      diagnostics.canInitialize = false;
      diagnostics.primaryIssue = `Template engine dependencies not available: ${(constructorError as Error).message}`;
      diagnostics.suggestions = [
        "Check if all required modules are installed",
        "Try reinstalling dependencies: npm install",
        "Verify the plugin installation is complete"
      ];
      diagnostics.diagnosticDetails.constructorError = (constructorError as Error).message;
      return diagnostics;
    }

  } catch (unexpectedError) {
    diagnostics.canInitialize = false;
    diagnostics.primaryIssue = `Unexpected error during diagnostics: ${(unexpectedError as Error).message}`;
    diagnostics.suggestions = [
      "Report this error to plugin maintainers",
      "Try restarting the MCP server",
      "Check system resources and permissions"
    ];
    diagnostics.diagnosticDetails.unexpectedError = (unexpectedError as Error).message;
  }

  return diagnostics;
}

function getSnippetsDir(): string {
  return join(getPluginRoot(), "snippets");
}

/**
 * Create enhanced error response for template engine initialization failures
 */
function createTemplateInitializationError(error: Error, toolName: string, context: ErrorContext) {
  // Check if it's our enhanced ArmsforgeError with suggestions
  if (error instanceof ArmsforgeError && error.suggestions.length > 0) {
    return {
      content: [{
        type: "text" as const,
        text: error.toUserString()
      }]
    };
  }

  // Fallback for other errors - provide diagnostic information
  const templatesDir = getTemplatesDir();
  const diagnostics = performTemplateEngineDiagnostics(templatesDir, context);

  let errorMessage = "Failed to initialize template engine";
  const suggestions: string[] = [];

  if (!diagnostics.canInitialize && diagnostics.primaryIssue) {
    errorMessage += `: ${diagnostics.primaryIssue}`;
    suggestions.push(...diagnostics.suggestions);
  } else {
    errorMessage += `: ${error.message}`;
    suggestions.push(
      "Check the logs for detailed error information",
      `Verify templates directory exists: ${templatesDir}`,
      "Ensure proper file permissions",
      "Try restarting the MCP server"
    );
  }

  // Add diagnostic details to suggestions if available
  if (diagnostics.diagnosticDetails.templateFiles === 0) {
    suggestions.push("No template files (.hbs) found - add templates to enable functionality");
  }

  // Format response with Catppuccin theme
  const parts = [
    formatStatus("error", errorMessage)
  ];

  if (suggestions.length > 0) {
    parts.push(
      c.dim("\nSuggestions:"),
      ...suggestions.slice(0, 5).map(s => `  ${c.muted("•")} ${c.text(s)}`) // Limit to 5 suggestions
    );
  }

  // Add diagnostic info if available
  if (Object.keys(diagnostics.diagnosticDetails).length > 0) {
    const relevantDetails = Object.entries(diagnostics.diagnosticDetails)
      .filter(([key]) => !key.includes('Error')) // Exclude error details from user display
      .slice(0, 3) // Limit details
      .map(([key, value]) => `  ${c.muted(key + ":")} ${c.text(String(value))}`)
      .join("\n");

    if (relevantDetails) {
      parts.push(c.dim("\nDiagnostics:"), relevantDetails);
    }
  }

  return {
    content: [{
      type: "text" as const,
      text: parts.join("\n")
    }]
  };
}

server.tool(
  "af_list_templates",
  "List all available dynamic code templates (exploits, loaders, implants, stagers) with context support",
  ListTemplatesParamsSchema.shape,
  async (params) => {
    const toolName = "af_list_templates";
    const context = { component: "mcp-server", operation: "list_templates" };

    try {
      logger.toolStart(toolName, params, context);
      const startTime = Date.now();

      // Validate parameters
      const { filter_by_context, arch, os, language } = validateToolParams(
        ListTemplatesParamsSchema,
        params,
        toolName,
        context
      );

      // Initialize template engine if needed
      if (!templateEngine) {
        try {
          initTemplateEngine();
        } catch (error) {
          logger.toolError(toolName, error as Error, context);
          return createTemplateInitializationError(error as Error, toolName, context);
        }
      }

      // Get templates with error handling
      const templates = await safeAsync(
        () => Promise.resolve(templateEngine.listTemplates()),
        { ...context, operation: "get_templates" },
        (error) => ArmsforgeError.template(
          ErrorCode.TEMPLATE_GENERATION_ERROR,
          "Failed to list templates",
          context
        )
      );

      if (templates.length === 0) {
        logger.toolSuccess(toolName, Date.now() - startTime, context);
        return {
          content: [{
            type: "text" as const,
            text: formatStatus("warning", "No dynamic templates found. Check templates directory.")
          }]
        };
      }

      // Apply filters if provided with DoS protection
      let filteredTemplates = templates;

      if (filter_by_context || arch || os || language) {
        const filterStartTime = Date.now();

        try {
          // Validate all templates before filtering to prevent malicious input
          for (const template of templates) {
            validateTemplateMetadata(template, DEFAULT_SECURITY_LIMITS);
          }

          const templateContext = contextManager.createContextFromParams({ arch, os, language });

          // Use secure filtering with circuit breaker protection
          filteredTemplates = await globalCircuitBreaker.execute(async () => {
            return await safeFilter(templates, (template) => {
              try {
                // Validate individual template again during filtering
                validateTemplateMetadata(template, DEFAULT_SECURITY_LIMITS);

                if (filter_by_context && !templateEngine.isTemplateCompatible(template.name, templateContext)) {
                  return false;
                }
                if (arch && template.supportedArchitectures && template.supportedArchitectures.length > 0 && !template.supportedArchitectures.includes(arch)) {
                  return false;
                }
                if (os && template.supportedOS && template.supportedOS.length > 0 && !template.supportedOS.includes(os)) {
                  return false;
                }
                if (language && template.supportedLanguages && template.supportedLanguages.length > 0 && !template.supportedLanguages.includes(language)) {
                  return false;
                }
                return true;
              } catch (securityError) {
                logger.warn(`Template validation failed during filtering: ${template.name}`, {
                  ...context,
                  metadata: {
                    error: securityError instanceof Error ? securityError.message : String(securityError)
                  }
                });
                return false; // Exclude malformed templates
              }
            }, DEFAULT_SECURITY_LIMITS);
          });

          // Record performance metrics
          const filterDuration = Date.now() - filterStartTime;
          globalPerformanceMonitor.recordOperation('template_filtering', filterDuration);

        } catch (error) {
          if (error instanceof SecurityError) {
            logger.warn(`Security violation in template filtering: ${error.message}`, {
              ...context,
              metadata: {
                securityReason: error.reason,
                filterParams: { filter_by_context, arch, os, language }
              }
            });

            // Return error response for security violations
            return {
              content: [{
                type: "text" as const,
                text: formatStatus("error", `Security protection triggered: ${error.reason}. Please contact administrator if this is unexpected.`)
              }]
            };
          }

          // Re-throw other errors to be handled by outer error handling
          throw error;
        }
      }

      const list = filteredTemplates
        .map((template) => {
          const compat = template.supportedLanguages.length > 0 || template.supportedArchitectures.length > 0 || template.supportedOS.length > 0
            ? c.muted(` [${[...template.supportedLanguages, ...template.supportedArchitectures, ...template.supportedOS].join(", ")}]`)
            : "";
          return `  ${c.filename(template.name)}${template.description ? c.muted(" — ") + c.text(template.description) : ""}${compat}`;
        })
        .join("\n");

      const title = filter_by_context || arch || os || language
        ? `Filtered Templates (${filteredTemplates.length}/${templates.length})`
        : `Available Templates (${templates.length})`;

      logger.toolSuccess(toolName, Date.now() - startTime, {
        ...context,
        metadata: { templateCount: templates.length, filteredCount: filteredTemplates.length }
      });

      return { content: [{ type: "text" as const, text: formatTitle(title) + "\n" + list }] };

    } catch (error) {
      logger.toolError(toolName, error as Error, context);

      if (error instanceof ArmsforgeError) {
        return {
          content: [{
            type: "text" as const,
            text: error.toUserString()
          }]
        };
      }

      return {
        content: [{
          type: "text" as const,
          text: formatStatus("error", `Failed to list templates: ${(error as Error).message}`) +
                `\n\n${c.dim("Use 'af_get_template_info' for template details.")}`
        }]
      };
    }
  }
);

server.tool(
  "af_get_template",
  "Generate a dynamic code template with customizable context (architecture, OS, evasion level, etc.)",
  GetTemplateParamsSchema.shape,
  async (params) => {
    const toolName = "af_get_template";
    const context = { component: "mcp-server", operation: "get_template" };

    try {
      logger.toolStart(toolName, params, context);
      const startTime = Date.now();

      // Validate parameters
      const { name, arch, os, evasion_level, payload_format, language } = validateToolParams(
        GetTemplateParamsSchema,
        params,
        toolName,
        context
      );

      // Validate template name specifically
      const validatedTemplateName = validateTemplateName(name, context);

      // Initialize template engine if needed
      if (!templateEngine) {
        try {
          initTemplateEngine();
        } catch (error) {
          logger.toolError(toolName, error as Error, context);
          throw ArmsforgeError.template(
            ErrorCode.TEMPLATE_GENERATION_ERROR,
            "Failed to initialize template engine",
            context
          );
        }
      }

      // Create context from parameters and user preferences
      const templateContext = safeSync(
        () => contextManager.createContextFromParams({
          arch,
          os,
          evasion: evasion_level,
          format: payload_format,
          language
        }),
        { ...context, operation: "create_context" },
        (error) => ArmsforgeError.validation(
          "Invalid template context parameters",
          context
        )
      );

      // Check if template exists
      const templateInfo = templateEngine.getTemplateInfo(validatedTemplateName);
      if (!templateInfo) {
        const templates = templateEngine.listTemplates();
        const available = templates.map(t => t.name).join(", ") || "none";

        logger.toolError(toolName, new Error(`Template not found: ${validatedTemplateName}`), context);

        throw ArmsforgeError.template(
          ErrorCode.TEMPLATE_NOT_FOUND,
          `Template "${validatedTemplateName}" not found`,
          { ...context, metadata: { templateName: validatedTemplateName, available } }
        );
      }

      // Check compatibility
      if (!templateEngine.isTemplateCompatible(validatedTemplateName, templateContext)) {
        const requirements = [
          ...(templateInfo.supportedLanguages.length > 0 ? [`Languages: ${templateInfo.supportedLanguages.join(", ")}`] : []),
          ...(templateInfo.supportedArchitectures.length > 0 ? [`Architectures: ${templateInfo.supportedArchitectures.join(", ")}`] : []),
          ...(templateInfo.supportedOS.length > 0 ? [`OS: ${templateInfo.supportedOS.join(", ")}`] : [])
        ].join("; ") || "No specific requirements";

        logger.warn(`Template incompatible with context: ${validatedTemplateName}`, {
          ...context,
          metadata: {
            templateName: validatedTemplateName,
            currentContext: contextManager.contextToString(templateContext),
            requirements
          }
        });

        return {
          content: [{
            type: "text" as const,
            text: formatStatus("warning", `Template "${c.filename(validatedTemplateName)}" may not be compatible with current context.`) +
                  `\n\n${c.muted("Current context:")} ${contextManager.contextToString(templateContext)}` +
                  `\n${c.muted("Template requirements:")} ${requirements}` +
                  `\n\n${c.dim("Use 'af_get_template_info' for detailed compatibility information.")}`
          }],
        };
      }

      // Generate template content
      const generatedContent = await safeAsync(
        () => Promise.resolve(templateEngine.generateTemplate(validatedTemplateName, templateContext)),
        { ...context, operation: "generate_template", metadata: { templateName: validatedTemplateName } },
        (error) => ArmsforgeError.template(
          ErrorCode.TEMPLATE_GENERATION_ERROR,
          `Failed to generate template: ${error.message}`,
          context,
          validatedTemplateName
        )
      );

      const header = formatTitle(`Generated Template: ${validatedTemplateName}`) + "\n" +
                    c.muted(`Context: ${contextManager.contextToString(templateContext)}`) + "\n\n";

      const duration = Date.now() - startTime;
      logger.toolSuccess(toolName, duration, {
        ...context,
        metadata: {
          templateName: validatedTemplateName,
          templateContext: contextManager.contextToString(templateContext),
          contentLength: generatedContent.length
        }
      });

      return { content: [{ type: "text" as const, text: header + generatedContent }] };

    } catch (error) {
      logger.toolError(toolName, error as Error, context);

      if (error instanceof ArmsforgeError) {
        return {
          content: [{
            type: "text" as const,
            text: error.toUserString()
          }]
        };
      }

      return {
        content: [{
          type: "text" as const,
          text: formatStatus("error", `Template generation failed: ${(error as Error).message}`) +
                `\n\n${c.dim("Use 'af_list_templates' to see available templates.")}`
        }]
      };
    }
  }
);

server.tool(
  "af_list_snippets",
  "List all available offensive code snippets (syscall stubs, encryption routines, injection patterns)",
  {},
  async () => {
    const toolName = "af_list_snippets";
    const context = { component: "mcp-server", operation: "list_snippets" };

    try {
      logger.toolStart(toolName, {}, context);
      const startTime = Date.now();

      // Get snippets directory with validation
      const dir = await safeAsync(
        () => Promise.resolve(getSnippetsDir()),
        { ...context, operation: "get_snippets_dir" },
        (error) => ArmsforgeError.fileSystem(
          "Failed to access snippets directory",
          context,
          "snippets"
        )
      );

      if (!existsSync(dir)) {
        logger.warn(`Snippets directory not found: ${dir}`, context);
        return {
          content: [{
            type: "text" as const,
            text: formatStatus("warning", "No snippets directory found.") +
                  `\n\n${c.muted("Expected location:")} ${formatPath(dir)}` +
                  `\n\n${c.dim("Create the directory and add snippet files to get started.")}`
          }]
        };
      }

      // Read directory contents with error handling
      const files = await safeAsync(
        () => Promise.resolve(readdirSync(dir).filter((f) => !f.startsWith("."))),
        { ...context, operation: "read_directory" },
        (error) => ArmsforgeError.fileSystem(
          "Failed to read snippets directory",
          context,
          dir
        )
      );

      if (files.length === 0) {
        logger.toolSuccess(toolName, Date.now() - startTime, context);
        return {
          content: [{
            type: "text" as const,
            text: formatStatus("warning", "No snippet files found.") +
                  `\n\n${c.muted("Directory:")} ${formatPath(dir)}` +
                  `\n\n${c.dim("Add .asm, .c, .cs, .py, or other code files to get started.")}`
          }]
        };
      }

      // Process files with error handling
      const snippetList = files.map((f) => {
        try {
          const filepath = join(dir, f);
          const content = readFileSync(filepath, "utf-8");
          const desc = extractDescriptionSimple(content);
          return `  ${c.filename(f)}${desc ? c.muted(" — ") + c.text(desc) : ""}`;
        } catch (error) {
          logger.warn(`Failed to read snippet file: ${f}`, {
            ...context,
            metadata: { filename: f }
          });
          return `  ${c.filename(f)}${c.muted(" — ")}${c.error("(read error)")}`;
        }
      });

      const duration = Date.now() - startTime;
      logger.toolSuccess(toolName, duration, {
        ...context,
        metadata: { snippetCount: files.length, directory: dir }
      });

      return {
        content: [{
          type: "text" as const,
          text: formatTitle(`Available Snippets (${files.length})`) + "\n" + snippetList.join("\n")
        }]
      };

    } catch (error) {
      logger.toolError(toolName, error as Error, context);

      if (error instanceof ArmsforgeError) {
        return {
          content: [{
            type: "text" as const,
            text: error.toUserString()
          }]
        };
      }

      return {
        content: [{
          type: "text" as const,
          text: formatStatus("error", `Failed to list snippets: ${(error as Error).message}`) +
                `\n\n${c.dim("Check snippets directory permissions and accessibility.")}`
        }]
      };
    }
  }
);

server.tool(
  "af_get_snippet",
  "Retrieve an offensive code snippet by filename",
  GetSnippetParamsSchema.shape,
  async (params) => {
    const toolName = "af_get_snippet";
    const context = { component: "mcp-server", operation: "get_snippet" };

    try {
      logger.toolStart(toolName, params, context);
      const startTime = Date.now();

      // Validate parameters
      const { name } = validateToolParams(
        GetSnippetParamsSchema,
        params,
        toolName,
        context
      );

      // Get snippets directory with validation
      const dir = await safeAsync(
        () => Promise.resolve(getSnippetsDir()),
        { ...context, operation: "get_snippets_dir" },
        (error) => ArmsforgeError.fileSystem(
          "Failed to access snippets directory",
          context,
          "snippets"
        )
      );

      const filepath = join(dir, name);

      // Security: Verify the resolved path stays within the snippets directory
      const resolvedPath = resolve(filepath);
      const resolvedDir = resolve(dir);
      if (!resolvedPath.startsWith(resolvedDir + sep)) {
        throw ArmsforgeError.validation(
          "Snippet path escapes snippets directory",
          context,
          "name"
        );
      }

      // Check if snippet exists
      if (!existsSync(filepath)) {
        logger.warn(`Snippet not found: ${name}`, {
          ...context,
          metadata: { snippetName: name, filepath }
        });

        // Try to list available snippets
        let availableSnippets = "none";
        if (existsSync(dir)) {
          try {
            const files = readdirSync(dir).filter((f) => !f.startsWith("."));
            availableSnippets = files.length > 0 ? files.join(", ") : "none";
          } catch (error) {
            logger.warn(`Failed to list available snippets`, {
              ...context,
              metadata: { directory: dir }
            });
            availableSnippets = "could not list files";
          }
        }

        throw ArmsforgeError.fileSystem(
          `Snippet "${name}" not found`,
          { ...context, metadata: { snippetName: name, available: availableSnippets } },
          filepath
        );
      }

      // Read snippet content
      const content = await safeAsync(
        () => Promise.resolve(readFileSync(filepath, "utf-8")),
        { ...context, operation: "read_snippet", metadata: { snippetName: name } },
        (error) => ArmsforgeError.fileSystem(
          `Failed to read snippet: ${name}`,
          context,
          filepath,
          error as Error
        )
      );

      const duration = Date.now() - startTime;
      logger.toolSuccess(toolName, duration, {
        ...context,
        metadata: {
          snippetName: name,
          filepath,
          contentLength: content.length
        }
      });

      const header = formatTitle(`Snippet: ${name}`) + "\n" +
                    c.muted(`Path: ${formatPath(filepath)}`) + "\n\n";

      return { content: [{ type: "text" as const, text: header + content }] };

    } catch (error) {
      logger.toolError(toolName, error as Error, context);

      if (error instanceof ArmsforgeError) {
        return {
          content: [{
            type: "text" as const,
            text: error.toUserString()
          }]
        };
      }

      return {
        content: [{
          type: "text" as const,
          text: formatStatus("error", `Failed to retrieve snippet: ${(error as Error).message}`) +
                `\n\n${c.dim("Use 'af_list_snippets' to see available snippets.")}`
        }]
      };
    }
  }
);

// --- Template Configuration Tools ---

server.tool(
  "af_set_template_context",
  "Set default template generation context (architecture, OS, evasion level, etc.)",
  SetTemplateContextParamsSchema.shape,
  async (params) => {
    const toolName = "af_set_template_context";
    const context = { component: "mcp-server", operation: "set_template_context" };

    try {
      logger.toolStart(toolName, params, context);
      const startTime = Date.now();

      // Validate parameters
      const { target_arch, target_os, evasion_level, payload_format, language } = validateToolParams(
        SetTemplateContextParamsSchema,
        params,
        toolName,
        context
      );
      // Build updates object
      const updates: Partial<TemplateContext> = {};
      if (target_arch) updates.target_arch = target_arch;
      if (target_os) updates.target_os = target_os;
      if (evasion_level) updates.evasion_level = evasion_level;
      if (payload_format) updates.payload_format = payload_format;
      if (language) updates.language = language;

      // If no updates provided, show current context
      if (Object.keys(updates).length === 0) {
        const current = await safeAsync(
          () => Promise.resolve(userPrefs.getDefaultTemplateContext()),
          { ...context, operation: "get_current_context" },
          (error) => ArmsforgeError.config(
            "Failed to get current template context",
            context,
            undefined,
            error as Error
          )
        );

        logger.toolSuccess(toolName, Date.now() - startTime, {
          ...context,
          metadata: { action: "show_current" }
        });

        return {
          content: [{
            type: "text" as const,
            text: formatTitle("Current Template Context") + "\n" +
                  contextManager.contextToString(current) + "\n\n" +
                  c.muted("Use parameters to update: --arch, --os, --evasion_level, --payload_format, --language")
          }]
        };
      }

      // Update context with error handling
      await safeAsync(
        () => {
          userPrefs.updateDefaultTemplateContext(updates);
          contextManager.setDefaultContext(userPrefs.getDefaultTemplateContext());
          return Promise.resolve();
        },
        { ...context, operation: "update_context" },
        (error) => ArmsforgeError.config(
          "Failed to update template context",
          context,
          undefined,
          error as Error
        )
      );

      // Save preferences with error handling
      await safeAsync(
        () => Promise.resolve(userPrefs.savePreferences()),
        { ...context, operation: "save_preferences" },
        (error) => ArmsforgeError.config(
          "Failed to save preferences to disk",
          context,
          undefined,
          error as Error
        )
      );

      const newContext = userPrefs.getDefaultTemplateContext();
      const duration = Date.now() - startTime;

      logger.toolSuccess(toolName, duration, {
        ...context,
        metadata: {
          updates: Object.keys(updates),
          newContext: contextManager.contextToString(newContext)
        }
      });

      return {
        content: [{
          type: "text" as const,
          text: formatStatus("success", "Template context updated successfully.") + "\n\n" +
                formatTitle("New Default Context") + "\n" +
                contextManager.contextToString(newContext)
        }]
      };

    } catch (error) {
      logger.toolError(toolName, error as Error, context);

      if (error instanceof ArmsforgeError) {
        return {
          content: [{
            type: "text" as const,
            text: error.toUserString()
          }]
        };
      }

      return {
        content: [{
          type: "text" as const,
          text: formatStatus("error", `Failed to update template context: ${(error as Error).message}`) +
                `\n\n${c.dim("Check preferences file permissions and try again.")}`
        }]
      };
    }
  }
);

server.tool(
  "af_get_template_info",
  "Get detailed information about a specific template including supported contexts",
  GetTemplateInfoParamsSchema.shape,
  async (params) => {
    const toolName = "af_get_template_info";
    const context = { component: "mcp-server", operation: "get_template_info" };

    try {
      logger.toolStart(toolName, params, context);
      const startTime = Date.now();

      // Validate parameters
      const { name } = validateToolParams(
        GetTemplateInfoParamsSchema,
        params,
        toolName,
        context
      );

      // Validate template name specifically
      const validatedTemplateName = validateTemplateName(name, context);

      // Initialize template engine if needed
      if (!templateEngine) {
        try {
          initTemplateEngine();
        } catch (error) {
          logger.toolError(toolName, error as Error, context);
          throw ArmsforgeError.template(
            ErrorCode.TOOL_INITIALIZATION_ERROR,
            "Failed to initialize template engine",
            context
          );
        }
      }

      // Get template info with error handling
      const info = await safeAsync(
        () => Promise.resolve(templateEngine.getTemplateInfo(validatedTemplateName)),
        { ...context, operation: "get_template_info", metadata: { templateName: validatedTemplateName } },
        (error) => ArmsforgeError.template(
          ErrorCode.TEMPLATE_GENERATION_ERROR,
          `Failed to get template info: ${error.message}`,
          context
        )
      );

      if (!info) {
        // Try to list available templates for helpful error message
        let templates: any[] = [];
        try {
          templates = templateEngine.listTemplates();
        } catch {
          // Ignore error and use empty array
        }

        const available = templates.map(t => t.name).join(", ") || "none";

        logger.toolError(toolName, new Error(`Template not found: ${validatedTemplateName}`), {
          ...context,
          metadata: { templateName: validatedTemplateName, available }
        });

        throw ArmsforgeError.template(
          ErrorCode.TEMPLATE_NOT_FOUND,
          `Template "${validatedTemplateName}" not found`,
          { ...context, metadata: { templateName: validatedTemplateName, available } }
        );
      }

      // Build compatibility information
      const compatibilityInfo = [
        ...(info.supportedLanguages.length > 0 ? [`Languages: ${info.supportedLanguages.join(", ")}`] : ["Languages: Any"]),
        ...(info.supportedArchitectures.length > 0 ? [`Architectures: ${info.supportedArchitectures.join(", ")}`] : ["Architectures: Any"]),
        ...(info.supportedOS.length > 0 ? [`Operating Systems: ${info.supportedOS.join(", ")}`] : ["Operating Systems: Any"])
      ].join("\n");

      const duration = Date.now() - startTime;
      logger.toolSuccess(toolName, duration, {
        ...context,
        metadata: {
          templateName: validatedTemplateName,
          hasDescription: !!info.description,
          supportedLanguages: info.supportedLanguages.length,
          supportedArchitectures: info.supportedArchitectures.length,
          supportedOS: info.supportedOS.length
        }
      });

      return {
        content: [{
          type: "text" as const,
          text: formatTitle(`Template: ${validatedTemplateName}`) + "\n" +
                `${c.muted("Description:")} ${info.description || "No description available"}\n\n` +
                formatSection("Compatibility") + "\n" +
                compatibilityInfo + "\n\n" +
                `${c.muted("File:")} ${c.filename(info.filename)}`
        }]
      };

    } catch (error) {
      logger.toolError(toolName, error as Error, context);

      if (error instanceof ArmsforgeError) {
        return {
          content: [{
            type: "text" as const,
            text: error.toUserString()
          }]
        };
      }

      return {
        content: [{
          type: "text" as const,
          text: formatStatus("error", `Failed to get template info: ${(error as Error).message}`) +
                `\n\n${c.dim("Use 'af_list_templates' to see available templates.")}`
        }]
      };
    }
  }
);

// --- Detection Reference Tools ---

server.tool(
  "af_detection_lookup",
  "Look up detection information for a Win32 API call, technique, or tool. Searches suspicious APIs, Sysmon rules, ETW providers, and AMSI triggers.",
  DetectionLookupParamsSchema.shape,
  async (params) => {
    const toolName = "af_detection_lookup";
    const context = { component: "mcp-server", operation: "detection_lookup" };

    try {
      logger.toolStart(toolName, params, context);
      const startTime = Date.now();

      // Validate and sanitize query
      const { query } = validateToolParams(
        DetectionLookupParamsSchema,
        params,
        toolName,
        context
      );

      const validatedQuery = validateQuery(query, context);
      const q = validatedQuery.toLowerCase();

      // Get data directory with validation
      const dataDir = await safeAsync(
        () => Promise.resolve(getDataDir()),
        { ...context, operation: "get_data_dir" },
        (error) => ArmsforgeError.fileSystem(
          "Failed to access data directory",
          context,
          "data"
        )
      );

      const results: string[] = [];
      const fileErrors: string[] = [];
      let filesProcessed = 0;
      let filesFound = 0;

      const files = [
        { file: "suspicious-apis.json", label: "Suspicious API" },
        { file: "sysmon-rules.json", label: "Sysmon Rule" },
        { file: "etw-providers.json", label: "ETW Provider" },
        { file: "amsi-triggers.json", label: "AMSI Trigger" },
      ];

      for (const { file, label } of files) {
        const filepath = join(dataDir, file);
        filesProcessed++;

        if (!existsSync(filepath)) {
          logger.debug(`Detection data file not found: ${filepath}`, {
            ...context,
            metadata: { filename: file }
          });
          continue;
        }

        filesFound++;

        try {
          logger.debug(`Processing detection data file: ${file}`, {
            ...context,
            metadata: { filename: file, filepath }
          });

          const fileContent = readFileSync(filepath, "utf-8");
          let data: unknown;

          try {
            data = JSON.parse(fileContent);
          } catch (parseError) {
            throw ArmsforgeError.fileSystem(
              `Invalid JSON in detection data file: ${file}`,
              { ...context, operation: "parse_detection_data" },
              filepath,
              parseError as Error
            );
          }

          // Validate data structure
          const validatedData = validateDetectionData(data, {
            ...context,
            operation: "validate_detection_data"
          });

            let entries: unknown[] = [];

            if (Array.isArray(validatedData)) {
              entries = validatedData;
            } else if (validatedData.entries) {
              entries = validatedData.entries;
            } else if (validatedData.categories) {
              // Handle nested categories structure
              for (const category of Object.values(validatedData.categories)) {
                if ((category as any).apis) {
                  entries.push(...(category as any).apis);
                }
              }
            } else if (validatedData.events) {
              entries = validatedData.events;
            } else if (validatedData.providers) {
              entries = validatedData.providers;
            } else if (validatedData.trigger_patterns) {
              // Handle AMSI triggers nested structure
              for (const category of Object.values(validatedData.trigger_patterns)) {
                if ((category as any).patterns) {
                  entries.push(...(category as any).patterns);
                }
              }
            }

            let matchCount = 0;
            for (const entry of entries) {
              try {
                const searchable = JSON.stringify(entry).toLowerCase();
                if (searchable.includes(q)) {
                  results.push(`### ${label}\n\`\`\`json\n${JSON.stringify(entry, null, 2)}\n\`\`\``);
                  matchCount++;
                }
              } catch (stringifyError) {
                logger.warn(`Failed to stringify entry in ${file}`, {
                  ...context,
                  metadata: { filename: file, entry }
                });
              }
            }

            logger.debug(`Processed ${file}: ${entries.length} entries, ${matchCount} matches`, {
              ...context,
              metadata: { filename: file, totalEntries: entries.length, matches: matchCount }
            });

        } catch (error) {
          fileErrors.push(`${file}: ${(error as Error).message}`);
          logger.warn(`Failed to process detection data file: ${file}`, {
            ...context,
            metadata: { filename: file, filepath }
          });
          // Continue processing other files
        }
      }

      // Log processing summary
      logger.info(`Detection lookup completed`, {
        ...context,
        metadata: {
          query: validatedQuery,
          filesProcessed,
          filesFound,
          matches: results.length,
          errors: fileErrors.length
        }
      });

      // Handle case where no files were found
      if (filesFound === 0) {
        logger.warn("No detection data files found", {
          ...context,
          metadata: { dataDir, expectedFiles: files.map(f => f.file) }
        });

        return {
          content: [{
            type: "text" as const,
            text: formatStatus("warning", "No detection data files found.") +
                  `\n\n${c.muted("Expected files in")} ${formatPath(dataDir)}:\n` +
                  files.map(f => `  • ${f.file}`).join("\n") +
                  `\n\n${c.dim("Please ensure detection data files are properly installed.")}`
          }]
        };
      }

      // Handle case where files had errors
      if (fileErrors.length > 0 && results.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: formatStatus("error", "Failed to process detection data files.") +
                  `\n\n${c.muted("Errors:")}\n` +
                  fileErrors.map(e => `  • ${c.error(e)}`).join("\n") +
                  `\n\n${c.dim("Check file permissions and JSON syntax.")}`
          }]
        };
      }

      // Handle case where no matches were found
      if (results.length === 0) {
        const duration = Date.now() - startTime;
        logger.toolSuccess(toolName, duration, {
          ...context,
          metadata: { query: validatedQuery, matches: 0, filesProcessed: filesFound }
        });

        return {
          content: [{
            type: "text" as const,
            text: formatStatus("warning", `No detection data found for "${c.code(validatedQuery)}".`) +
                  `\n\n${c.muted("Searched in")} ${c.text(filesFound.toString())} detection data files.` +
                  `\n\n${c.dim("Try:")}\n` +
                  `  • A Win32 API name (e.g., "VirtualAllocEx")\n` +
                  `  • A technique name (e.g., "process injection")\n` +
                  `  • A Sysmon event ID (e.g., "1" or "10")\n` +
                  `  • An AMSI trigger keyword`
          }]
        };
      }

      // Success case with results
      const duration = Date.now() - startTime;
      logger.toolSuccess(toolName, duration, {
        ...context,
        metadata: {
          query: validatedQuery,
          matches: results.length,
          filesProcessed: filesFound,
          fileErrors: fileErrors.length
        }
      });

      const header = formatTitle(`Detection Info: ${validatedQuery}`) +
                    (fileErrors.length > 0 ?
                      `\n${c.warning(`Note: ${fileErrors.length} file(s) had errors and were skipped.`)}\n` :
                      "\n");

      return {
        content: [{
          type: "text" as const,
          text: header + results.join("\n\n")
        }]
      };

    } catch (error) {
      logger.toolError(toolName, error as Error, context);

      if (error instanceof ArmsforgeError) {
        return {
          content: [{
            type: "text" as const,
            text: error.toUserString()
          }]
        };
      }

      return {
        content: [{
          type: "text" as const,
          text: formatStatus("error", `Detection lookup failed: ${(error as Error).message}`) +
                `\n\n${c.dim("This may be due to missing or corrupted detection data files.")}`
        }]
      };
    }
  }
);

// --- Start Server ---

async function main() {
  const context = { component: "mcp-server", operation: "startup" };

  try {
    logger.serverEvent("starting", context);

    // Initialize template engine on startup with error handling
    try {
      initTemplateEngine();
      logger.info("Template engine initialized successfully", context);
    } catch (error) {
      logger.error("Failed to initialize template engine on startup", context, error as Error);
      // Continue startup even if templates fail - tools will handle initialization lazily
    }

    // Initialize transport with error handling
    const transport = await safeAsync(
      () => Promise.resolve(new StdioServerTransport()),
      { ...context, operation: "create_transport" },
      (error) => new ArmsforgeError(
        ErrorCode.TRANSPORT_ERROR,
        "Failed to create server transport",
        context,
        { originalError: error as Error }
      )
    );

    // Connect server
    await safeAsync(
      () => server.connect(transport),
      { ...context, operation: "connect_server" },
      (error) => new ArmsforgeError(
        ErrorCode.SERVER_ERROR,
        "Failed to connect MCP server",
        context,
        { originalError: error as Error }
      )
    );

    logger.serverEvent("started_successfully", context);

  } catch (error) {
    logger.error("Server startup failed", context, error as Error);

    if (error instanceof ArmsforgeError) {
      console.error(error.toUserString());
    } else {
      console.error(`Fatal error: ${(error as Error).message}`);
    }

    process.exit(1);
  }
}

// Enhanced error handling for main execution
main().catch(async (error) => {
  const context = { component: "mcp-server", operation: "main_execution" };

  logger.error("Unhandled error in main execution", context, error);

  // Attempt to flush logs before exit
  try {
    await logger.flush();
  } catch (flushError) {
    console.error("Failed to flush logs:", flushError);
  }

  if (error instanceof ArmsforgeError) {
    console.error("\n" + error.toUserString());
  } else {
    console.error(`\nFatal error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }

  process.exit(1);
});
