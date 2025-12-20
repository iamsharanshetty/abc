// lib/services/errorHandlingService.ts - ENHANCED VERSION
// ✅ Fixed: Deterministic error message selection with logging for traceability

import { logger } from "@/lib/utils/logger";

export enum ErrorType {
  OPENAI_API_ERROR = "OPENAI_API_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  VECTOR_STORE_ERROR = "VECTOR_STORE_ERROR",
  NO_CONTEXT_FOUND = "NO_CONTEXT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface ErrorContext {
  type: ErrorType;
  originalError?: any;
  userMessage: string;
  messageIndex?: number; // ✅ NEW: Track which message was shown
  agentId?: string;
  sessionId?: string;
  timestamp: string;
  metadata?: any;
}

/**
 * Retry configuration interface
 */
interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  context?: { agentId?: string; sessionId?: string };
}

export class ErrorHandlingService {
  /**
   * Handle errors and return user-friendly messages
   */
  static handleChatError(
    error: any,
    context?: { agentId?: string; sessionId?: string }
  ): string {
    const errorContext: ErrorContext = {
      type: this.classifyError(error),
      originalError: error,
      userMessage: "",
      agentId: context?.agentId,
      sessionId: context?.sessionId,
      timestamp: new Date().toISOString(),
    };

    // ✅ FIXED: Determine user-friendly message with deterministic selection
    const { message, messageIndex } = this.getUserFriendlyMessage(
      errorContext.type,
      error,
      context
    );
    
    errorContext.userMessage = message;
    errorContext.messageIndex = messageIndex; // ✅ Track which message was shown

    // Log the error with message index for traceability
    this.logError(errorContext);

    return errorContext.userMessage;
  }

  /**
   * Classify error type with better HTTP status code detection
   */
  private static classifyError(error: any): ErrorType {
    if (!error) return ErrorType.UNKNOWN_ERROR;

    const errorMessage = error.message || error.toString().toLowerCase();
    const errorCode = error.code || error.status;
    
    // Extract HTTP status from OpenAI error structure
    const httpStatus = error?.response?.status || error?.status || errorCode;

    // OpenAI API errors
    if (errorMessage.includes("openai") || errorMessage.includes("api key")) {
      return ErrorType.OPENAI_API_ERROR;
    }

    // Rate limiting - check both status code and message
    if (
      httpStatus === 429 ||
      errorCode === 429 ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("too many requests") ||
      errorMessage.includes("quota")
    ) {
      return ErrorType.RATE_LIMIT_ERROR;
    }

    // Timeout errors
    if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("timed out") ||
      errorCode === "ETIMEDOUT" ||
      errorCode === "ECONNABORTED" ||
      httpStatus === 408
    ) {
      return ErrorType.TIMEOUT_ERROR;
    }

    // Vector store / database errors
    if (
      errorMessage.includes("supabase") ||
      errorMessage.includes("database") ||
      errorMessage.includes("vector")
    ) {
      return ErrorType.VECTOR_STORE_ERROR;
    }

    // No context found
    if (
      errorMessage.includes("no context") ||
      errorMessage.includes("no relevant")
    ) {
      return ErrorType.NO_CONTEXT_FOUND;
    }

    // Validation errors
    if (
      errorMessage.includes("validation") ||
      errorMessage.includes("invalid")
    ) {
      return ErrorType.VALIDATION_ERROR;
    }

    return ErrorType.UNKNOWN_ERROR;
  }

  /**
   * ✅ FIXED: Get user-friendly error message with deterministic selection
   * 
   * Selection strategy:
   * 1. Primary message (index 0): Used for first occurrence
   * 2. Secondary message (index 1): Used for subsequent occurrences
   * 3. Selection based on session context for consistency
   * 
   * @returns Object with message and messageIndex for logging
   */
  private static getUserFriendlyMessage(
    errorType: ErrorType,
    error: any,
    context?: { agentId?: string; sessionId?: string }
  ): { message: string; messageIndex: number } {
    const messages: Record<ErrorType, string[]> = {
      [ErrorType.OPENAI_API_ERROR]: [
        "I'm having trouble connecting to my AI systems right now. Please try again in a moment.",
        "My AI capabilities are temporarily unavailable. Let me try a different approach.",
      ],
      [ErrorType.RATE_LIMIT_ERROR]: [
        "I'm receiving a lot of questions right now. Please wait a moment and try again.",
        "I need to catch my breath! Please give me a few seconds before your next question.",
      ],
      [ErrorType.TIMEOUT_ERROR]: [
        "That's taking longer than expected. Let me try again - could you please rephrase your question?",
        "The request timed out. Please try asking your question again.",
      ],
      [ErrorType.VECTOR_STORE_ERROR]: [
        "I'm having trouble accessing my knowledge base right now. Please try again shortly.",
        "There's an issue with my information retrieval system. Let me try again in a moment.",
      ],
      [ErrorType.NO_CONTEXT_FOUND]: [
        "I don't have specific information about that in my knowledge base. Could you ask something else about our products or services?",
        "I'm not able to find relevant information for that question. Is there something else I can help you with?",
      ],
      [ErrorType.VALIDATION_ERROR]: [
        "I couldn't process that input. Could you please rephrase your question?",
        "There seems to be an issue with your message format. Please try again.",
      ],
      [ErrorType.UNKNOWN_ERROR]: [
        "I encountered an unexpected issue. Please try again, and if the problem persists, let me know!",
        "Something went wrong on my end. Could you please try rephrasing your question?",
      ],
    };

    const possibleMessages =
      messages[errorType] || messages[ErrorType.UNKNOWN_ERROR];

    // ✅ DETERMINISTIC SELECTION: Use context to consistently pick same message
    // This makes debugging easier - same error type will show same message for same session
    let messageIndex = 0;
    
    if (context?.sessionId) {
      // Use session ID hash to deterministically select message
      // This ensures same session gets same error message for consistency
      const hash = this.hashString(context.sessionId);
      messageIndex = hash % possibleMessages.length;
    } else if (context?.agentId) {
      // Fallback to agent ID if no session
      const hash = this.hashString(context.agentId);
      messageIndex = hash % possibleMessages.length;
    } else {
      // Default to first message if no context
      messageIndex = 0;
    }

    return {
      message: possibleMessages[messageIndex],
      messageIndex,
    };
  }

  /**
   * ✅ NEW: Simple hash function for deterministic message selection
   * Converts string to consistent number for message index selection
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * ✅ ENHANCED: Log error with message index for better traceability
   */
  private static logError(errorContext: ErrorContext): void {
    logger.error("Chat error occurred", {
      type: errorContext.type,
      userMessage: errorContext.userMessage,
      messageIndex: errorContext.messageIndex, // ✅ Log which message was shown
      agentId: errorContext.agentId,
      sessionId: errorContext.sessionId,
      timestamp: errorContext.timestamp,
      originalError:
        errorContext.originalError?.message ||
        String(errorContext.originalError),
      stack: errorContext.originalError?.stack,
    });
  }

  /**
   * Determine if an error is retryable based on type and HTTP status
   */
  private static isRetryableError(error: any): {
    shouldRetry: boolean;
    useExtendedDelay: boolean;
  } {
    const errorType = this.classifyError(error);
    const httpStatus = error?.response?.status || error?.status || error?.code;

    // Never retry validation errors
    if (errorType === ErrorType.VALIDATION_ERROR) {
      return { shouldRetry: false, useExtendedDelay: false };
    }

    // Rate limits - retry with extended delay
    if (errorType === ErrorType.RATE_LIMIT_ERROR || httpStatus === 429) {
      return { shouldRetry: true, useExtendedDelay: true };
    }

    // Timeout errors - retry with normal delay
    if (errorType === ErrorType.TIMEOUT_ERROR || httpStatus === 408) {
      return { shouldRetry: true, useExtendedDelay: false };
    }

    // Server errors - retry with normal delay
    const serverErrorStatuses = [500, 502, 503, 504];
    if (serverErrorStatuses.includes(Number(httpStatus))) {
      return { shouldRetry: true, useExtendedDelay: false };
    }

    // Network errors - retry
    if (
      error.code === "ECONNRESET" ||
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT" ||
      error.code === "ENOTFOUND"
    ) {
      return { shouldRetry: true, useExtendedDelay: false };
    }

    // OpenAI API errors that might be temporary
    if (errorType === ErrorType.OPENAI_API_ERROR) {
      // Retry if it's not an authentication error
      const isAuthError =
        error?.message?.includes("api key") ||
        error?.message?.includes("authentication") ||
        httpStatus === 401 ||
        httpStatus === 403;

      return { shouldRetry: !isAuthError, useExtendedDelay: false };
    }

    // Default: don't retry
    return { shouldRetry: false, useExtendedDelay: false };
  }

  /**
   * Calculate retry delay with exponential backoff
   * Uses longer delays for rate limits
   */
  private static calculateRetryDelay(
    attempt: number,
    useExtendedDelay: boolean,
    baseDelay: number,
    maxDelay: number
  ): number {
    // For rate limits, use much longer base delay
    const effectiveBaseDelay = useExtendedDelay ? baseDelay * 5 : baseDelay;

    // Exponential backoff: delay = base * 2^attempt
    const exponentialDelay = Math.min(
      effectiveBaseDelay * Math.pow(2, attempt),
      maxDelay
    );

    // Add jitter (±20% random variation) to prevent thundering herd
    const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);
    const finalDelay = exponentialDelay + jitter;

    return Math.max(finalDelay, effectiveBaseDelay);
  }

  /**
   * Handle OpenAI API errors with intelligent retry logic
   */
  static async handleOpenAIError<T>(
    operation: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    const baseDelay = options?.baseDelay ?? 1000; // 1 second
    const maxDelay = options?.maxDelay ?? 30000; // 30 seconds
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Check if we should retry
        const { shouldRetry, useExtendedDelay } =
          this.isRetryableError(error);

        if (!shouldRetry) {
          logger.debug("Error is not retryable", {
            errorType: this.classifyError(error),
            attempt: attempt + 1,
          });
          throw error;
        }

        // If this was the last attempt, throw
        if (attempt >= maxRetries - 1) {
          logger.error("Max retries exceeded", {
            maxRetries,
            errorType: this.classifyError(error),
            context: options?.context,
          });
          throw error;
        }

        // Calculate delay
        const delay = this.calculateRetryDelay(
          attempt,
          useExtendedDelay,
          baseDelay,
          maxDelay
        );

        logger.warn("Retrying operation after error", {
          attempt: attempt + 1,
          maxRetries,
          delayMs: Math.round(delay),
          errorType: this.classifyError(error),
          useExtendedDelay,
          context: options?.context,
        });

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // All retries failed (shouldn't reach here but TypeScript needs it)
    throw lastError;
  }

  /**
   * Get fallback response when AI is unavailable
   */
  static getFallbackResponse(agentRole: string): string {
    const fallbacks: Record<string, string> = {
      sales:
        "I apologize for the technical difficulty. In the meantime, would you like me to have someone from our sales team reach out to you directly? If so, please provide your email address.",
      support:
        "I'm sorry I'm unable to assist right now due to a technical issue. For immediate support, please check our FAQ page or contact our support team directly.",
      training:
        "I'm experiencing a temporary issue. While I work on resolving this, please check our documentation or training materials.",
      custom:
        "I apologize for the inconvenience. While I work on resolving this issue, is there specific information I can try to help you find?",
    };

    return fallbacks[agentRole] || fallbacks.custom;
  }

  /**
   * Validate and sanitize error messages before showing to users
   */
  static sanitizeErrorMessage(message: string): string {
    // Remove sensitive information
    const sensitivePatterns = [
      /api[_\s]?key/gi,
      /token/gi,
      /password/gi,
      /secret/gi,
      /bearer/gi,
      /authorization/gi,
    ];

    let sanitized = message;
    sensitivePatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, "[REDACTED]");
    });

    // Remove stack traces
    sanitized = sanitized.split("\n")[0];

    // Limit length
    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 200) + "...";
    }

    return sanitized;
  }

  /**
   * Check if error should trigger alert to development team
   */
  static shouldAlertTeam(errorType: ErrorType): boolean {
    const criticalErrors = [
      ErrorType.OPENAI_API_ERROR,
      ErrorType.VECTOR_STORE_ERROR,
    ];

    return criticalErrors.includes(errorType);
  }

  /**
   * ✅ ENHANCED: Create error report with message index for analytics
   */
  static createErrorReport(errorContext: ErrorContext): {
    type: string;
    message: string;
    messageIndex?: number; // ✅ Include in report
    timestamp: string;
    metadata: any;
  } {
    return {
      type: errorContext.type,
      message: this.sanitizeErrorMessage(errorContext.userMessage),
      messageIndex: errorContext.messageIndex, // ✅ Track which message was shown
      timestamp: errorContext.timestamp,
      metadata: {
        agentId: errorContext.agentId,
        sessionId: errorContext.sessionId,
        ...errorContext.metadata,
      },
    };
  }

  /**
   * Wrapper for OpenAI SDK calls with automatic retry
   * Use this in your services instead of direct OpenAI calls
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: { agentId?: string; sessionId?: string }
  ): Promise<T> {
    logger.debug(`Starting operation: ${operationName}`, context);

    try {
      return await this.handleOpenAIError(operation, {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        context,
      });
    } catch (error) {
      logger.error(`Operation failed: ${operationName}`, {
        error: this.sanitizeErrorMessage(
          error instanceof Error ? error.message : String(error)
        ),
        context,
      });
      throw error;
    }
  }
}