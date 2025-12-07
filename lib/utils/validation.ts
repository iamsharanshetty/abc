// lib/utils/validation.ts
import { ValidationError } from "../errors/AppError";

/**
 * Additional URL security checks to prevent SSRF attacks
 */
export function performSecurityChecks(url: string): void {
  const urlObj = new URL(url);

  // Block common cloud metadata endpoints
  const blockedHosts = [
    "169.254.169.254", // AWS metadata
    "metadata.google.internal", // GCP metadata
    "metadata.azure.com", // Azure metadata
  ];

  if (blockedHosts.includes(urlObj.hostname)) {
    throw new ValidationError(
      "Access to cloud metadata endpoints is not allowed"
    );
  }

  // Block file:// protocol
  if (urlObj.protocol === "file:") {
    throw new ValidationError("File protocol is not allowed");
  }

  // Block other dangerous protocols
  const dangerousProtocols = [
    "ftp:",
    "ftps:",
    "gopher:",
    "data:",
    "javascript:",
  ];
  if (dangerousProtocols.includes(urlObj.protocol)) {
    throw new ValidationError(`Protocol ${urlObj.protocol} is not allowed`);
  }

  // Ensure URL doesn't contain credentials
  if (urlObj.username || urlObj.password) {
    throw new ValidationError("URLs with embedded credentials are not allowed");
  }
}

/**
 * Validates and sanitizes a URL
 */
export function validateAndSanitizeUrl(url: string): string {
  if (!url || typeof url !== "string") {
    throw new ValidationError("URL is required and must be a string");
  }

  // Trim whitespace
  url = url.trim();

  // Check if it's a valid URL
  try {
    const urlObj = new URL(url);

    // Only allow http and https protocols (prevents SSRF attacks)
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      throw new ValidationError("URL must use HTTP or HTTPS protocol", {
        provided: urlObj.protocol,
      });
    }

    // Block localhost and private IPs (prevents SSRF)
    const hostname = urlObj.hostname.toLowerCase();
    const blockedPatterns = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "::1",
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
    ];

    for (const pattern of blockedPatterns) {
      if (typeof pattern === "string") {
        if (hostname === pattern) {
          throw new ValidationError(
            "Cannot scrape localhost or private IP addresses"
          );
        }
      } else {
        if (pattern.test(hostname)) {
          throw new ValidationError("Cannot scrape private IP addresses");
        }
      }
    }
    // Add security checks
    performSecurityChecks(url);

    return urlObj.href; // Return normalized URL
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError("Invalid URL format", {
      provided: url,
    });
  }
}

/**
 * Validates maxPages parameter
 */
export function validateMaxPages(maxPages: unknown): number {
  if (maxPages === undefined || maxPages === null) {
    return parseInt(process.env.MAX_PAGES_TO_SCRAPE || "50");
  }

  const parsed = parseInt(String(maxPages));

  if (isNaN(parsed) || parsed < 1) {
    throw new ValidationError("maxPages must be a positive number");
  }

  if (parsed > 100) {
    throw new ValidationError("maxPages cannot exceed 100");
  }

  return parsed;
}

/**
 * Validates boolean parameter
 */
export function validateBoolean(
  value: unknown,
  defaultValue: boolean = false
): boolean {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return defaultValue;
}
