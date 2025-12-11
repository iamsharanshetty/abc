// lib/errors/errorHandler.ts
import { NextResponse } from "next/server";
import { AppError } from "./AppError";
import { logger } from "@/lib/utils/logger";

export function handleError<T = any>(error: unknown): NextResponse<T> {
  // ✅ Add generic
  // If it's our custom AppError
  if (error instanceof AppError) {
    logger.error("Application error:", {
      code: error.code,
      message: error.message,
      context: error.context,
      stack: error.stack,
    });

    return NextResponse.json(error.toJSON() as T, {
      // ✅ Cast to T
      status: error.statusCode,
    });
  }

  // If it's a standard Error
  if (error instanceof Error) {
    logger.error("Unexpected error:", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          message: "An unexpected error occurred",
          code: "INTERNAL_ERROR",
          statusCode: 500,
        },
      } as T, // ✅ Cast to T
      { status: 500 }
    );
  }

  // Unknown error type
  logger.error("Unknown error:", error);

  return NextResponse.json(
    {
      success: false,
      error: {
        message: "An unknown error occurred",
        code: "INTERNAL_ERROR",
        statusCode: 500,
      },
    } as T, // ✅ Cast to T
    { status: 500 }
  );
}
