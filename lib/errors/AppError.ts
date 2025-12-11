// lib/errors/AppError.ts

export enum ErrorCode {
  // Validation Errors (400)
  INVALID_URL = 'INVALID_URL',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  
  // Scraping Errors (500)
  SCRAPING_FAILED = 'SCRAPING_FAILED',
  PARSING_FAILED = 'PARSING_FAILED',
  NO_CONTENT_FOUND = 'NO_CONTENT_FOUND',
  
  // Embedding Errors (500)
  EMBEDDING_GENERATION_FAILED = 'EMBEDDING_GENERATION_FAILED',
  EMBEDDING_STORAGE_FAILED = 'EMBEDDING_STORAGE_FAILED',
  
  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Cache Errors (500)
  CACHE_ERROR = 'CACHE_ERROR',
  
  // General Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    
    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
    
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        ...(this.context && { context: this.context }),
      },
    };
  }
}

// Factory functions for common errors
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.INVALID_INPUT, 400, true, context);
  }
}

export class ScrapingError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.SCRAPING_FAILED, 500, true, context);
  }
}

export class EmbeddingError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.EMBEDDING_GENERATION_FAILED, 500, true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: Record<string, any>) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, true, context);
  }
}