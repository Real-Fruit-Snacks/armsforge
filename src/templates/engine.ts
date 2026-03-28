import Handlebars from 'handlebars';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { randomBytes } from 'crypto';
import { TemplateContext, TemplateInfo } from './context.js';
import { ArmsforgeError, ErrorCode } from '../utils/errors.js';
import { TemplateSecurityValidator, SecurityLevel, ValidationResult } from './security-validator.js';
import { validateTemplateMetadata, validateStringLength, SecurityError, DEFAULT_SECURITY_LIMITS } from '../utils/security.js';
import { extractDescription } from '../utils/regex-patterns.js';

/**
 * Node for doubly linked list in LRU cache
 */
interface CacheNode {
  key: string;
  template: HandlebarsTemplateDelegate;
  memorySize: number;
  prev: CacheNode | null;
  next: CacheNode | null;
}

/**
 * Cache statistics for monitoring
 */
interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
  memoryUsage: number;
  maxMemoryUsage: number;
  hitRate: number;
}

/**
 * Efficient LRU cache with O(1) operations and memory tracking
 */
class LRUCache {
  private capacity: number;
  private maxMemory: number;
  private cache: Map<string, CacheNode> = new Map();
  private head: CacheNode;
  private tail: CacheNode;
  private currentMemory = 0;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };

  constructor(capacity: number, maxMemoryMB: number = 50) {
    this.capacity = capacity;
    this.maxMemory = maxMemoryMB * 1024 * 1024; // Convert MB to bytes

    // Initialize dummy head and tail nodes for easier list manipulation
    this.head = { key: '', template: null as any, memorySize: 0, prev: null, next: null };
    this.tail = { key: '', template: null as any, memorySize: 0, prev: null, next: null };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * Estimate memory usage of a compiled template
   */
  private estimateTemplateSize(template: HandlebarsTemplateDelegate): number {
    try {
      // Base size for function object
      let size = 1024; // Base overhead

      // Try to estimate based on template string length if available
      const templateStr = template.toString();
      size += templateStr.length * 2; // UTF-16 encoding

      // Add overhead for closure variables and compilation artifacts
      size += 2048;

      return size;
    } catch {
      // Fallback estimate
      return 4096; // 4KB default estimate
    }
  }

  /**
   * Add node to head of list (most recently used)
   */
  private addToHead(node: CacheNode): void {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  /**
   * Remove node from list
   */
  private removeNode(node: CacheNode): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  /**
   * Move node to head (mark as most recently used)
   */
  private moveToHead(node: CacheNode): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  /**
   * Remove tail node (least recently used)
   */
  private removeTail(): CacheNode {
    const lastNode = this.tail.prev!;
    this.removeNode(lastNode);
    return lastNode;
  }

  /**
   * Get template from cache
   */
  get(key: string): HandlebarsTemplateDelegate | null {
    const node = this.cache.get(key);
    if (node) {
      this.stats.hits++;
      this.moveToHead(node);
      return node.template;
    }
    this.stats.misses++;
    return null;
  }

  /**
   * Put template in cache
   */
  put(key: string, template: HandlebarsTemplateDelegate): void {
    const existingNode = this.cache.get(key);
    const memorySize = this.estimateTemplateSize(template);

    if (existingNode) {
      // Update existing node
      this.currentMemory = this.currentMemory - existingNode.memorySize + memorySize;
      existingNode.template = template;
      existingNode.memorySize = memorySize;
      this.moveToHead(existingNode);
    } else {
      // Create new node
      const newNode: CacheNode = {
        key,
        template,
        memorySize,
        prev: null,
        next: null
      };

      // Evict if necessary
      this.evictIfNeeded(memorySize);

      this.cache.set(key, newNode);
      this.addToHead(newNode);
      this.currentMemory += memorySize;
    }
  }

  /**
   * Evict nodes if capacity or memory limits exceeded
   */
  private evictIfNeeded(incomingSize: number): void {
    // Evict based on count limit
    while (this.cache.size >= this.capacity) {
      this.evictLRU();
    }

    // Evict based on memory limit
    while (this.currentMemory + incomingSize > this.maxMemory && this.cache.size > 0) {
      this.evictLRU();
    }
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    const tail = this.removeTail();
    this.cache.delete(tail.key);
    this.currentMemory -= tail.memorySize;
    this.stats.evictions++;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.currentMemory = 0;
    this.head.next = this.tail;
    this.tail.prev = this.head;
    // Don't reset stats on clear to maintain historical data
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalAccesses = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      size: this.cache.size,
      maxSize: this.capacity,
      memoryUsage: this.currentMemory,
      maxMemoryUsage: this.maxMemory,
      hitRate: totalAccesses > 0 ? this.stats.hits / totalAccesses : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
  }
}

/**
 * Generate cryptographically secure random integer between min and max (inclusive)
 */
function secureRandomInt(min: number, max: number): number {
  if (min > max) {
    throw new Error('Min value cannot be greater than max value');
  }

  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValidValue = Math.floor(256 ** bytesNeeded / range) * range - 1;

  let randomValue: number;
  do {
    const cryptoBytes = randomBytes(bytesNeeded);
    randomValue = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      randomValue = (randomValue << 8) + cryptoBytes[i];
    }
  } while (randomValue > maxValidValue);

  return min + (randomValue % range);
}

/**
 * Generate cryptographically secure random choice from array
 */
function secureRandomChoice<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot choose from empty array');
  }
  const index = secureRandomInt(0, array.length - 1);
  return array[index];
}

export class TemplateEngine {
  private templatesDir: string;
  private templateCache: LRUCache;
  private securityValidator: TemplateSecurityValidator;
  private secureHandlebars: typeof Handlebars;

  /**
   * Generate cryptographically secure random integer between min and max (inclusive)
   */
  private secureRandomInt(min: number, max: number): number {
    if (min > max) {
      throw new Error('Min value cannot be greater than max value');
    }

    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValidValue = Math.floor(256 ** bytesNeeded / range) * range - 1;

    let randomValue: number;
    do {
      const cryptoBytes = randomBytes(bytesNeeded);
      randomValue = 0;
      for (let i = 0; i < bytesNeeded; i++) {
        randomValue = (randomValue << 8) + cryptoBytes[i];
      }
    } while (randomValue > maxValidValue);

    return min + (randomValue % range);
  }

  /**
   * Generate cryptographically secure random choice from array
   */
  private secureRandomChoice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    const index = this.secureRandomInt(0, array.length - 1);
    return array[index];
  }

  constructor(templatesDir: string, securityLevel?: SecurityLevel, cacheConfig?: { maxSize?: number; maxMemoryMB?: number }) {
    this.templatesDir = templatesDir;
    this.templateCache = new LRUCache(
      cacheConfig?.maxSize || 50,
      cacheConfig?.maxMemoryMB || 50
    );
    this.securityValidator = new TemplateSecurityValidator(securityLevel);
    this.secureHandlebars = this.createSecureHandlebarsInstance();
    this.registerHelpers();
  }

  /**
   * Create a secure Handlebars instance with sandboxing and restrictions
   */
  private createSecureHandlebarsInstance(): typeof Handlebars {
    // Create a new isolated Handlebars instance
    const secureHbs = Handlebars.create();

    // Enable strict mode to prevent access to prototype properties
    secureHbs.registerHelper('lookup', function() {
      throw new Error('lookup helper is disabled for security');
    });

    // Disable dangerous built-in helpers
    secureHbs.registerHelper('with', function() {
      throw new Error('with helper is disabled for security');
    });

    // Override the compile function to add additional security
    const originalCompile = secureHbs.compile.bind(secureHbs);
    secureHbs.compile = function(input: string, options?: CompileOptions) {
      // Validate template content before compilation
      if (typeof input !== 'string') {
        throw new Error('Template input must be a string');
      }

      // Check for dangerous patterns in template
      const dangerousPatterns = [
        /\{\{\s*constructor\s*\}\}/gi,
        /\{\{\s*__proto__\s*\}\}/gi,
        /\{\{\s*prototype\s*\}\}/gi,
        /\{\{\s*this\.[^}]*constructor\s*\}\}/gi,
        /\{\{\s*this\.[^}]*__proto__\s*\}\}/gi,
        /\{\{\s*this\.[^}]*prototype\s*\}\}/gi,
        /\{\{\s*\.\./gi, // Block access to parent context
        /\{\{\s*>.*\}\}/gi, // Block partials
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(input)) {
          throw new Error(`Template contains dangerous pattern: ${pattern.source}`);
        }
      }

      // Compile with strict mode and no partials/decorators
      const secureOptions: CompileOptions = {
        ...options,
        strict: true,
        assumeObjects: true,
        noEscape: false, // Always escape by default
        knownHelpers: {
          // Only allow explicitly registered helpers
          ifArch: true,
          ifOS: true,
          ifLang: true,
          ifEvasionLevel: true,
          ifPayloadFormat: true,
          randomVar: true,
          randomSleep: true
        },
        knownHelpersOnly: true
      };

      return originalCompile(input, secureOptions);
    };

    return secureHbs;
  }

  /**
   * Validate template content before compilation
   */
  private validateTemplateContent(templateContent: string, templateName: string): void {
    // Check for null bytes or control characters that could indicate injection
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(templateContent)) {
      throw ArmsforgeError.template(
        ErrorCode.TEMPLATE_GENERATION_ERROR,
        `Template "${templateName}" contains invalid control characters`,
        { component: 'template-engine', operation: 'content_validation' },
        templateName
      );
    }

    // Check for suspicious script tags or potential XSS vectors
    const suspiciousPatterns = [
      /<script[^>]*>/gi,
      /<iframe[^>]*>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(templateContent)) {
        throw ArmsforgeError.template(
          ErrorCode.TEMPLATE_GENERATION_ERROR,
          `Template "${templateName}" contains suspicious content pattern: ${pattern.source}`,
          { component: 'template-engine', operation: 'content_validation' },
          templateName
        );
      }
    }

    // Limit template size to prevent DoS
    const maxTemplateSize = 1024 * 1024; // 1MB
    if (templateContent.length > maxTemplateSize) {
      throw ArmsforgeError.template(
        ErrorCode.TEMPLATE_GENERATION_ERROR,
        `Template "${templateName}" exceeds maximum size limit (${maxTemplateSize} bytes)`,
        { component: 'template-engine', operation: 'content_validation' },
        templateName
      );
    }
  }

  private getCachedTemplate(name: string): HandlebarsTemplateDelegate | null {
    return this.templateCache.get(name);
  }

  private setCachedTemplate(name: string, template: HandlebarsTemplateDelegate): void {
    this.templateCache.put(name, template);
  }

  private registerHelpers(): void {
    // Helper for conditional architecture-specific code
    this.secureHandlebars.registerHelper('ifArch', function(this: TemplateContext, arch: string, options: any) {
      if (this.target_arch === arch) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    // Helper for conditional OS-specific code
    this.secureHandlebars.registerHelper('ifOS', function(this: TemplateContext, os: string, options: any) {
      if (this.target_os === os) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    // Helper for conditional language-specific code
    this.secureHandlebars.registerHelper('ifLang', function(this: TemplateContext, lang: string, options: any) {
      if (this.language === lang) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    // Helper for evasion level conditional
    this.secureHandlebars.registerHelper('ifEvasionLevel', function(this: TemplateContext, level: number, options: any) {
      if (this.evasion_level >= level) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    // Helper for payload format conditional
    this.secureHandlebars.registerHelper('ifPayloadFormat', function(this: TemplateContext, format: string, options: any) {
      if (this.payload_format === format) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    // Helper for generating random variable names
    this.secureHandlebars.registerHelper('randomVar', () => {
      try {
        const names = ['data', 'buffer', 'payload', 'chunk', 'block', 'segment', 'content'];
        const randomName = secureRandomChoice(names);
        const randomSuffix = secureRandomInt(0, 999);
        return randomName + randomSuffix;
      } catch (error) {
        // Fallback with timestamp if crypto fails
        return 'var' + Date.now().toString(36);
      }
    });

    // Helper for generating random sleep values
    this.secureHandlebars.registerHelper('randomSleep', () => {
      try {
        // Generate cryptographically secure sleep value between 1-6 seconds
        return secureRandomInt(1000, 6000);
      } catch (error) {
        // Fallback with timestamp-based jitter if crypto fails
        return 1000 + (Date.now() % 5000);
      }
    });
  }

  /**
   * Comprehensive security validation using AST analysis and deep inspection
   */
  private validateGeneratedTemplate(templateName: string, content: string, options?: {
    allowPlaceholders?: boolean;
    securityLevel?: SecurityLevel;
  }): ValidationResult {
    // Update security level if provided
    if (options?.securityLevel) {
      this.securityValidator.setSecurityLevel(options.securityLevel);
    }

    // Override placeholder setting if provided
    const currentLevel = this.securityValidator['securityLevel'];
    if (options?.allowPlaceholders !== undefined) {
      this.securityValidator.setSecurityLevel({
        ...currentLevel,
        allowPlaceholders: options.allowPlaceholders
      });
    }

    try {
      const result = this.securityValidator.validateTemplate(templateName, content);

      // If template is not secure, throw error with detailed report
      if (!result.isSecure) {
        const report = this.securityValidator.generateSecurityReport(result, templateName);
        throw ArmsforgeError.template(
          ErrorCode.TEMPLATE_GENERATION_ERROR,
          `Template "${templateName}" failed security validation:\n${report}`,
          {
            component: 'template-engine',
            operation: 'security_validation',
            metadata: {
              securityScore: result.score,
              violationCount: result.violations.length
            }
          },
          templateName
        );
      }

      return result;

    } catch (error) {
      if (error instanceof ArmsforgeError) {
        throw error;
      }
      throw ArmsforgeError.template(
        ErrorCode.TEMPLATE_GENERATION_ERROR,
        `Security validation failed for template "${templateName}": ${(error as Error).message}`,
        { component: 'template-engine', operation: 'security_validation' },
        templateName
      );
    }
  }

  /**
   * Get all available template files (.hbs extension)
   */
  public listTemplates(): TemplateInfo[] {
    if (!existsSync(this.templatesDir)) {
      return [];
    }

    const files = readdirSync(this.templatesDir)
      .filter(f => extname(f) === '.hbs')
      .map(f => {
        const templatePath = join(this.templatesDir, f);
        const content = readFileSync(templatePath, 'utf-8');

        // Extract description from template comments
        const description = extractDescription(content);

        // Extract supported languages, architectures, etc. from frontmatter or comments
        const langMatch = content.match(/{{!--\s*@lang\s+(.+?)\s*--}}/) ||
                         content.match(/\/\/\s*@lang\s+(.+?)$/m);
        const archMatch = content.match(/{{!--\s*@arch\s+(.+?)\s*--}}/) ||
                         content.match(/\/\/\s*@arch\s+(.+?)$/m);
        const osMatch = content.match(/{{!--\s*@os\s+(.+?)\s*--}}/) ||
                       content.match(/\/\/\s*@os\s+(.+?)$/m);

        // Parse and validate arrays with DoS protection
        let supportedLanguages: string[] = [];
        let supportedArchitectures: string[] = [];
        let supportedOS: string[] = [];

        try {
          if (langMatch) {
            validateStringLength(langMatch[1], DEFAULT_SECURITY_LIMITS.maxStringLength, 'language metadata');
            supportedLanguages = langMatch[1].split(',').map(s => {
              const trimmed = s.trim();
              validateStringLength(trimmed, DEFAULT_SECURITY_LIMITS.maxStringLength, 'language item');
              return trimmed;
            }).slice(0, DEFAULT_SECURITY_LIMITS.maxArrayLength); // Limit array size
          }

          if (archMatch) {
            validateStringLength(archMatch[1], DEFAULT_SECURITY_LIMITS.maxStringLength, 'architecture metadata');
            supportedArchitectures = archMatch[1].split(',').map(s => {
              const trimmed = s.trim();
              validateStringLength(trimmed, DEFAULT_SECURITY_LIMITS.maxStringLength, 'architecture item');
              return trimmed;
            }).slice(0, DEFAULT_SECURITY_LIMITS.maxArrayLength); // Limit array size
          }

          if (osMatch) {
            validateStringLength(osMatch[1], DEFAULT_SECURITY_LIMITS.maxStringLength, 'OS metadata');
            supportedOS = osMatch[1].split(',').map(s => {
              const trimmed = s.trim();
              validateStringLength(trimmed, DEFAULT_SECURITY_LIMITS.maxStringLength, 'OS item');
              return trimmed;
            }).slice(0, DEFAULT_SECURITY_LIMITS.maxArrayLength); // Limit array size
          }

          if (description) {
            validateStringLength(description, DEFAULT_SECURITY_LIMITS.maxStringLength, 'template description');
          }

        } catch (securityError) {
          if (securityError instanceof SecurityError) {
            console.warn(`Template security validation failed for ${f}: ${securityError.message}`);
            // Return safe default values for malformed templates
            supportedLanguages = [];
            supportedArchitectures = [];
            supportedOS = [];
          } else {
            throw securityError;
          }
        }

        const templateInfo = {
          name: basename(f, '.hbs'),
          filename: f,
          description: description || '',
          supportedLanguages,
          supportedArchitectures,
          supportedOS
        };

        // Final validation of the complete template metadata
        try {
          validateTemplateMetadata(templateInfo, DEFAULT_SECURITY_LIMITS);
        } catch (securityError) {
          if (securityError instanceof SecurityError) {
            console.warn(`Template metadata validation failed for ${f}: ${securityError.message}`);
            // Return minimal safe template info
            return {
              name: basename(f, '.hbs'),
              filename: f,
              description: '',
              supportedLanguages: [],
              supportedArchitectures: [],
              supportedOS: []
            };
          }
          throw securityError;
        }

        return templateInfo;
      });

    return files;
  }

  /**
   * Generate template content with the given context
   */
  public generateTemplate(templateName: string, context: TemplateContext, options?: {
    allowPlaceholders?: boolean;
    securityLevel?: SecurityLevel;
    skipValidation?: boolean;
  }): string {
    const templatePath = join(this.templatesDir, `${templateName}.hbs`);

    if (!existsSync(templatePath)) {
      throw new Error(`Template "${templateName}.hbs" not found in ${this.templatesDir}`);
    }

    // Check if template is already compiled
    let template = this.getCachedTemplate(templateName);
    if (!template) {
      const templateContent = readFileSync(templatePath, 'utf-8');

      // Validate template content before compilation
      this.validateTemplateContent(templateContent, templateName);

      // Use secure Handlebars instance for compilation
      template = this.secureHandlebars.compile(templateContent);
      this.setCachedTemplate(templateName, template);
    }

    // Generate the template with context
    const generatedContent = template(context);

    // Perform comprehensive security validation unless explicitly skipped
    if (!options?.skipValidation) {
      this.validateGeneratedTemplate(templateName, generatedContent, {
        allowPlaceholders: options?.allowPlaceholders,
        securityLevel: options?.securityLevel
      });
    }

    return generatedContent;
  }

  /**
   * Get template info by name
   */
  public getTemplateInfo(templateName: string): TemplateInfo | null {
    const templates = this.listTemplates();
    return templates.find(t => t.name === templateName) || null;
  }

  /**
   * Check if a template is compatible with the given context
   */
  public isTemplateCompatible(templateName: string, context: TemplateContext): boolean {
    const info = this.getTemplateInfo(templateName);
    if (!info) return false;

    // Check language compatibility
    if (info.supportedLanguages.length > 0 && !info.supportedLanguages.includes(context.language)) {
      return false;
    }

    // Check architecture compatibility
    if (info.supportedArchitectures.length > 0 && !info.supportedArchitectures.includes(context.target_arch)) {
      return false;
    }

    // Check OS compatibility
    if (info.supportedOS.length > 0 && !info.supportedOS.includes(context.target_os)) {
      return false;
    }

    return true;
  }

  /**
   * Clear compiled template cache
   */
  public clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats(): CacheStats {
    return this.templateCache.getStats();
  }

  /**
   * Reset cache statistics
   */
  public resetCacheStats(): void {
    this.templateCache.resetStats();
  }

  /**
   * Validate template security without generating content
   */
  public validateTemplateSecurity(templateName: string, content: string, securityLevel?: SecurityLevel): ValidationResult {
    if (securityLevel) {
      this.securityValidator.setSecurityLevel(securityLevel);
    }
    return this.securityValidator.validateTemplate(templateName, content);
  }

  /**
   * Generate security report for template content
   */
  public generateSecurityReport(templateName: string, content: string, securityLevel?: SecurityLevel): string {
    const result = this.validateTemplateSecurity(templateName, content, securityLevel);
    return this.securityValidator.generateSecurityReport(result, templateName);
  }

  /**
   * Update security configuration
   */
  public setSecurityLevel(level: SecurityLevel): void {
    this.securityValidator.setSecurityLevel(level);
  }

  /**
   * Get current security configuration
   */
  public getSecurityLevel(): SecurityLevel {
    return this.securityValidator['securityLevel'];
  }
}