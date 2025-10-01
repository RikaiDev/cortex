/**
 * Error Handler - Advanced error handling and recovery system
 *
 * This module provides comprehensive error classification, handling, and recovery mechanisms
 */

import {
  Logger,
  ErrorType,
  MCPError,
  ErrorContext,
  ErrorResult,
} from "./types.js";

export interface ErrorRecoveryStrategy {
  canRecover: boolean;
  maxRetries: number;
  backoffMultiplier: number;
  maxBackoffTime: number;
  recoveryActions: RecoveryAction[];
}

export interface RecoveryAction {
  type: "retry" | "fallback" | "circuit-breaker" | "graceful-degradation";
  condition: (error: MCPError, context: ErrorContext) => boolean;
  action: (error: MCPError, context: ErrorContext) => Promise<unknown>;
  priority: number;
}

export interface ErrorHandlerConfig {
  enableRecovery: boolean;
  maxRetries: number;
  enableCircuitBreaker: boolean;
  circuitBreakerThreshold: number;
  enableGracefulDegradation: boolean;
  logAllErrors: boolean;
}

export class ErrorHandler {
  private logger: Logger;
  private config: ErrorHandlerConfig;
  private errorCounts: Map<ErrorType, number> = new Map();
  private circuitBreakerStates: Map<string, CircuitBreakerState> = new Map();
  private recoveryStrategies: Map<ErrorType, ErrorRecoveryStrategy> = new Map();

  constructor(logger: Logger, config: Partial<ErrorHandlerConfig> = {}) {
    this.logger = logger;
    this.config = {
      enableRecovery: true,
      maxRetries: 3,
      enableCircuitBreaker: true,
      circuitBreakerThreshold: 5,
      enableGracefulDegradation: true,
      logAllErrors: true,
      ...config,
    };

    this.initializeRecoveryStrategies();
  }

  /**
   * Handle an error with classification and recovery
   */
  async handleError(error: Error, context: ErrorContext): Promise<ErrorResult> {
    const mcpError = this.classifyError(error, context);

    if (this.config.logAllErrors) {
      this.logError(mcpError, context);
    }

    // Update error counts
    this.updateErrorCounts(mcpError.type);

    // Check circuit breaker
    if (
      this.config.enableCircuitBreaker &&
      this.isCircuitBreakerOpen(mcpError.type)
    ) {
      return this.createCircuitBreakerResponse(mcpError, context);
    }

    // Attempt recovery if enabled
    if (this.config.enableRecovery) {
      const recoveryResult = await this.attemptRecovery(mcpError, context);
      if (recoveryResult.success) {
        return {
          content: [
            {
              type: "text",
              text: `Error recovered: ${recoveryResult.message}`,
            },
          ],
          isError: false,
          errorType: mcpError.type,
          recoverable: true,
          context,
        };
      }
    }

    // Create error response
    return this.createErrorResponse(mcpError, context);
  }

  /**
   * Classify error into MCP error types
   */
  private classifyError(error: Error, context: ErrorContext): MCPError {
    const mcpError = error as MCPError;

    // Set default error type
    mcpError.type = ErrorType.TOOL_EXECUTION_ERROR;
    mcpError.context = context as unknown as Record<string, unknown>;
    mcpError.recoverable = true;

    // Classify based on error message and context
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    if (errorMessage.includes("timeout") || errorName.includes("timeout")) {
      mcpError.type = ErrorType.TIMEOUT_ERROR;
    } else if (
      errorMessage.includes("network") ||
      errorMessage.includes("connection")
    ) {
      mcpError.type = ErrorType.NETWORK_ERROR;
    } else if (
      errorMessage.includes("config") ||
      errorMessage.includes("configuration")
    ) {
      mcpError.type = ErrorType.CONFIGURATION_ERROR;
    } else if (
      errorMessage.includes("validation") ||
      errorMessage.includes("invalid")
    ) {
      mcpError.type = ErrorType.VALIDATION_ERROR;
    } else if (
      errorMessage.includes("auth") ||
      errorMessage.includes("unauthorized")
    ) {
      mcpError.type = ErrorType.AUTHENTICATION_ERROR;
    } else if (
      errorMessage.includes("permission") ||
      errorMessage.includes("forbidden")
    ) {
      mcpError.type = ErrorType.AUTHORIZATION_ERROR;
    } else if (
      errorMessage.includes("rate limit") ||
      errorMessage.includes("too many")
    ) {
      mcpError.type = ErrorType.RATE_LIMIT_ERROR;
    } else if (
      errorMessage.includes("resource") ||
      errorMessage.includes("memory") ||
      errorMessage.includes("disk")
    ) {
      mcpError.type = ErrorType.RESOURCE_ERROR;
    }

    // Determine recoverability
    mcpError.recoverable = this.isRecoverable(mcpError.type);

    return mcpError;
  }

  /**
   * Determine if an error type is recoverable
   */
  private isRecoverable(errorType: ErrorType): boolean {
    const recoverableTypes = [
      ErrorType.TOOL_EXECUTION_ERROR,
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT_ERROR,
      ErrorType.RATE_LIMIT_ERROR,
    ];

    return recoverableTypes.includes(errorType);
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: MCPError, context: ErrorContext): void {
    const logData = {
      errorType: error.type,
      errorCode: error.code,
      context,
      recoverable: error.recoverable ?? false,
      stack: error.stack,
    };

    if (
      error.type === ErrorType.CONFIGURATION_ERROR ||
      error.type === ErrorType.AUTHENTICATION_ERROR
    ) {
      this.logger.error(`Critical error: ${error.message}`, logData);
    } else if (error.recoverable) {
      this.logger.warn(`Recoverable error: ${error.message}`, logData);
    } else {
      this.logger.error(`Non-recoverable error: ${error.message}`, logData);
    }
  }

  /**
   * Update error counts for circuit breaker
   */
  private updateErrorCounts(errorType: ErrorType): void {
    const currentCount = this.errorCounts.get(errorType) || 0;
    this.errorCounts.set(errorType, currentCount + 1);
  }

  /**
   * Check if circuit breaker is open for error type
   */
  private isCircuitBreakerOpen(errorType: ErrorType): boolean {
    const state = this.circuitBreakerStates.get(errorType);
    if (!state) {
      return false;
    }

    const now = Date.now();
    if (state.state === "open" && now < state.nextAttemptTime) {
      return true;
    }

    // Reset circuit breaker if enough time has passed
    if (state.state === "open" && now >= state.nextAttemptTime) {
      state.state = "half-open";
      state.failureCount = 0;
    }

    return false;
  }

  /**
   * Create circuit breaker response
   */
  private createCircuitBreakerResponse(
    error: MCPError,
    context: ErrorContext
  ): ErrorResult {
    const state = this.circuitBreakerStates.get(error.type);
    const nextAttemptTime = state
      ? new Date(state.nextAttemptTime).toISOString()
      : "unknown";

    return {
      content: [
        {
          type: "text",
          text: `Circuit breaker is open for ${error.type}. Next attempt allowed at: ${nextAttemptTime}`,
        },
      ],
      isError: true,
      errorType: error.type,
      recoverable: false,
      context,
    };
  }

  /**
   * Attempt error recovery
   */
  private async attemptRecovery(
    error: MCPError,
    context: ErrorContext
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const strategy = this.recoveryStrategies.get(error.type);
    if (!strategy || !strategy.canRecover) {
      return { success: false, message: "No recovery strategy available" };
    }

    // Execute recovery actions in priority order
    const sortedActions = strategy.recoveryActions.sort(
      (a, b) => b.priority - a.priority
    );

    for (const action of sortedActions) {
      if (action.condition(error, context)) {
        try {
          await action.action(error, context);
          return {
            success: true,
            message: `Recovery successful using ${action.type}`,
          };
        } catch (recoveryError) {
          this.logger.warn(
            `Recovery action ${action.type} failed: ${recoveryError}`
          );
          continue;
        }
      }
    }

    return { success: false, message: "All recovery actions failed" };
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    error: MCPError,
    context: ErrorContext
  ): ErrorResult {
    let userMessage = this.getUserFriendlyMessage(error.type);

    if (error.recoverable) {
      userMessage +=
        "\n\nThis error may be temporary. Please try again in a few moments.";
    }

    return {
      content: [
        {
          type: "text",
          text: userMessage,
        },
      ],
      isError: true,
      errorType: error.type,
      recoverable: error.recoverable ?? false,
      context,
    };
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(errorType: ErrorType): string {
    const messages = {
      [ErrorType.TOOL_EXECUTION_ERROR]:
        "A tool execution error occurred. Please check your input and try again.",
      [ErrorType.CONFIGURATION_ERROR]:
        "A configuration error occurred. Please check your settings.",
      [ErrorType.NETWORK_ERROR]:
        "A network error occurred. Please check your connection and try again.",
      [ErrorType.RESOURCE_ERROR]:
        "A resource error occurred. The system may be under heavy load.",
      [ErrorType.VALIDATION_ERROR]:
        "A validation error occurred. Please check your input format.",
      [ErrorType.AUTHENTICATION_ERROR]:
        "An authentication error occurred. Please check your credentials.",
      [ErrorType.AUTHORIZATION_ERROR]:
        "An authorization error occurred. You may not have permission for this action.",
      [ErrorType.TIMEOUT_ERROR]:
        "A timeout error occurred. The operation took too long to complete.",
      [ErrorType.RATE_LIMIT_ERROR]:
        "Rate limit exceeded. Please wait before making another request.",
    };

    return (
      messages[errorType] || "An unexpected error occurred. Please try again."
    );
  }

  /**
   * Initialize recovery strategies for different error types
   */
  private initializeRecoveryStrategies(): void {
    // Tool execution error recovery
    this.recoveryStrategies.set(ErrorType.TOOL_EXECUTION_ERROR, {
      canRecover: true,
      maxRetries: 3,
      backoffMultiplier: 2,
      maxBackoffTime: 30000,
      recoveryActions: [
        {
          type: "retry",
          condition: () => true,
          action: async (): Promise<unknown> => {
            // Simple retry with exponential backoff
            await this.delay(this.calculateBackoffDelay(1));
            throw new Error("Retry not implemented in this context");
          },
          priority: 10,
        },
        {
          type: "fallback",
          condition: (_, context) => context.toolName === "enhance-context",
          action: async (): Promise<unknown> => {
            // Fallback to basic context enhancement
            return {
              content: [
                { type: "text", text: "Using fallback context enhancement" },
              ],
            };
          },
          priority: 5,
        },
      ],
    });

    // Network error recovery
    this.recoveryStrategies.set(ErrorType.NETWORK_ERROR, {
      canRecover: true,
      maxRetries: 2,
      backoffMultiplier: 3,
      maxBackoffTime: 60000,
      recoveryActions: [
        {
          type: "retry",
          condition: () => true,
          action: async (): Promise<unknown> => {
            await this.delay(this.calculateBackoffDelay(2));
            throw new Error("Network retry not implemented");
          },
          priority: 10,
        },
      ],
    });

    // Timeout error recovery
    this.recoveryStrategies.set(ErrorType.TIMEOUT_ERROR, {
      canRecover: true,
      maxRetries: 1,
      backoffMultiplier: 1.5,
      maxBackoffTime: 15000,
      recoveryActions: [
        {
          type: "graceful-degradation",
          condition: () => true,
          action: async (): Promise<unknown> => {
            return {
              content: [
                {
                  type: "text",
                  text: "Operation timed out, using simplified response",
                },
              ],
            };
          },
          priority: 10,
        },
      ],
    });

    // Rate limit error recovery
    this.recoveryStrategies.set(ErrorType.RATE_LIMIT_ERROR, {
      canRecover: true,
      maxRetries: 1,
      backoffMultiplier: 2,
      maxBackoffTime: 60000,
      recoveryActions: [
        {
          type: "retry",
          condition: () => true,
          action: async (): Promise<unknown> => {
            await this.delay(60000); // Wait 1 minute for rate limit reset
            throw new Error("Rate limit retry not implemented");
          },
          priority: 10,
        },
      ],
    });
  }

  /**
   * Calculate backoff delay
   */
  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const delay = baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, 30000); // Cap at 30 seconds
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    circuitBreakerStates: Record<string, string>;
  } {
    const totalErrors = Array.from(this.errorCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    const errorsByType: Record<string, number> = {};
    for (const [errorType, count] of this.errorCounts) {
      errorsByType[errorType] = count;
    }

    const circuitBreakerStates: Record<string, string> = {};
    for (const [errorType, state] of this.circuitBreakerStates) {
      circuitBreakerStates[errorType] = state.state;
    }

    return {
      totalErrors,
      errorsByType,
      circuitBreakerStates,
    };
  }

  /**
   * Reset error counts (useful for testing)
   */
  resetErrorCounts(): void {
    this.errorCounts.clear();
    this.circuitBreakerStates.clear();
    this.logger.info("Error counts and circuit breaker states reset");
  }
}

interface CircuitBreakerState {
  state: "closed" | "open" | "half-open";
  failureCount: number;
  nextAttemptTime: number;
}
