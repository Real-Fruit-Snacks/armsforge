/**
 * Security utilities for DoS protection and input validation
 */

export interface SecurityLimits {
  maxArrayLength: number;
  maxStringLength: number;
  maxFilterOperations: number;
  filterTimeoutMs: number;
  maxMetadataSize: number;
}

export const DEFAULT_SECURITY_LIMITS: SecurityLimits = {
  maxArrayLength: 1000,
  maxStringLength: 10000,
  maxFilterOperations: 10000,
  filterTimeoutMs: 5000,
  maxMetadataSize: 1024 * 1024 // 1MB
};

export class SecurityError extends Error {
  constructor(message: string, public readonly reason: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Validates array size to prevent resource exhaustion
 */
export function validateArraySize<T>(
  array: T[],
  maxLength: number,
  context: string
): void {
  if (array.length > maxLength) {
    throw new SecurityError(
      `Array too large in ${context}: ${array.length} > ${maxLength}`,
      'ARRAY_SIZE_LIMIT'
    );
  }
}

/**
 * Validates string length to prevent resource exhaustion
 */
export function validateStringLength(
  str: string,
  maxLength: number,
  context: string
): void {
  if (str.length > maxLength) {
    throw new SecurityError(
      `String too long in ${context}: ${str.length} > ${maxLength}`,
      'STRING_LENGTH_LIMIT'
    );
  }
}

/**
 * Validates template metadata structure and size
 */
export function validateTemplateMetadata(
  template: any,
  limits: SecurityLimits = DEFAULT_SECURITY_LIMITS
): void {
  if (!template || typeof template !== 'object') {
    throw new SecurityError('Invalid template metadata: not an object', 'INVALID_METADATA');
  }

  // Check metadata size (rough estimate)
  const metadataSize = JSON.stringify(template).length;
  if (metadataSize > limits.maxMetadataSize) {
    throw new SecurityError(
      `Template metadata too large: ${metadataSize} > ${limits.maxMetadataSize}`,
      'METADATA_SIZE_LIMIT'
    );
  }

  // Validate arrays if present
  if (Array.isArray(template.supportedLanguages)) {
    validateArraySize(template.supportedLanguages, limits.maxArrayLength, 'supportedLanguages');
    template.supportedLanguages.forEach((lang: any, idx: number) => {
      if (typeof lang === 'string') {
        validateStringLength(lang, limits.maxStringLength, `supportedLanguages[${idx}]`);
      }
    });
  }

  if (Array.isArray(template.supportedArchitectures)) {
    validateArraySize(template.supportedArchitectures, limits.maxArrayLength, 'supportedArchitectures');
    template.supportedArchitectures.forEach((arch: any, idx: number) => {
      if (typeof arch === 'string') {
        validateStringLength(arch, limits.maxStringLength, `supportedArchitectures[${idx}]`);
      }
    });
  }

  if (Array.isArray(template.supportedOS)) {
    validateArraySize(template.supportedOS, limits.maxArrayLength, 'supportedOS');
    template.supportedOS.forEach((os: any, idx: number) => {
      if (typeof os === 'string') {
        validateStringLength(os, limits.maxStringLength, `supportedOS[${idx}]`);
      }
    });
  }

  // Validate description if present
  if (template.description && typeof template.description === 'string') {
    validateStringLength(template.description, limits.maxStringLength, 'description');
  }

  // Validate name if present
  if (template.name && typeof template.name === 'string') {
    validateStringLength(template.name, limits.maxStringLength, 'name');
  }
}

/**
 * Circuit breaker for expensive operations
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(failureThreshold = 5, resetTimeoutMs = 30000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
  }

  async execute<T>(operation: () => Promise<T> | T): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.resetTimeoutMs) {
        throw new SecurityError('Circuit breaker is OPEN', 'CIRCUIT_BREAKER_OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }
}

/**
 * Time-bounded filtering with operation counting
 */
export async function safeFilter<T>(
  items: T[],
  predicate: (item: T, index: number) => boolean,
  limits: SecurityLimits = DEFAULT_SECURITY_LIMITS
): Promise<T[]> {
  return new Promise<T[]>((resolve, reject) => {
    const startTime = Date.now();
    let operations = 0;

    // Set up timeout
    const timeoutId = setTimeout(() => {
      reject(new SecurityError(
        `Filter operation timed out after ${limits.filterTimeoutMs}ms`,
        'FILTER_TIMEOUT'
      ));
    }, limits.filterTimeoutMs);

    try {
      // Validate input size
      validateArraySize(items, limits.maxArrayLength, 'filter input');

      const result: T[] = [];

      for (let i = 0; i < items.length; i++) {
        // Check operation count
        if (++operations > limits.maxFilterOperations) {
          clearTimeout(timeoutId);
          reject(new SecurityError(
            `Too many filter operations: ${operations} > ${limits.maxFilterOperations}`,
            'OPERATION_LIMIT'
          ));
          return;
        }

        // Check time periodically
        if (operations % 100 === 0 && Date.now() - startTime > limits.filterTimeoutMs) {
          clearTimeout(timeoutId);
          reject(new SecurityError(
            `Filter operation exceeded time limit`,
            'FILTER_TIMEOUT'
          ));
          return;
        }

        try {
          if (predicate(items[i], i)) {
            result.push(items[i]);
          }
        } catch (error) {
          clearTimeout(timeoutId);
          reject(new SecurityError(
            `Filter predicate error at index ${i}: ${error}`,
            'PREDICATE_ERROR'
          ));
          return;
        }
      }

      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

/**
 * Performance monitoring for suspicious patterns
 */
export class PerformanceMonitor {
  private readonly metrics = new Map<string, {
    count: number;
    totalTime: number;
    maxTime: number;
    avgTime: number;
  }>();

  recordOperation(operation: string, timeMs: number): void {
    const existing = this.metrics.get(operation) || {
      count: 0,
      totalTime: 0,
      maxTime: 0,
      avgTime: 0
    };

    existing.count++;
    existing.totalTime += timeMs;
    existing.maxTime = Math.max(existing.maxTime, timeMs);
    existing.avgTime = existing.totalTime / existing.count;

    this.metrics.set(operation, existing);

    // Log suspicious patterns
    if (timeMs > 1000) {
      console.warn(`Slow operation detected: ${operation} took ${timeMs}ms`);
    }

    if (existing.count > 100 && existing.avgTime > 100) {
      console.warn(`Suspicious pattern: ${operation} avg ${existing.avgTime}ms over ${existing.count} operations`);
    }
  }

  getMetrics(): Map<string, any> {
    return new Map(this.metrics);
  }

  reset(): void {
    this.metrics.clear();
  }
}

// Global instances
export const globalCircuitBreaker = new CircuitBreaker();
export const globalPerformanceMonitor = new PerformanceMonitor();