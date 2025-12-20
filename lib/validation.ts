// lib/validation.ts

/**
 * Quick URL format validation (synchronous)
 * Use this for immediate form validation
 */
export const validateUrl = (value: string): string => {
  if (!value) return "Please enter a URL";
  
  try {
    const urlObject = new URL(
      value.startsWith("http") ? value : `https://${value}`
    );
    
    if (!urlObject.hostname.includes(".")) {
      return "Please enter a valid URL (e.g., example.com)";
    }
    
    return "";
  } catch {
    return "Please enter a valid URL (e.g., example.com)";
  }
};

/**
 * Comprehensive URL validation with reachability check (asynchronous)
 * Use this when you need to verify the URL actually works
 * 
 * @param url - The URL to validate
 * @param options.checkReachability - Whether to verify the URL is accessible (default: true)
 * @param options.timeout - Timeout in milliseconds for reachability check (default: 10000)
 * @returns Object with validation result
 */
export const validateUrlAsync = async (
  url: string,
  options?: {
    checkReachability?: boolean;
    timeout?: number;
  }
): Promise<{
  valid: boolean;
  error?: string;
  statusCode?: number;
}> => {
  const checkReachability = options?.checkReachability ?? true;
  const timeout = options?.timeout ?? 10000;

  // First, do basic format validation
  const formatError = validateUrl(url);
  if (formatError) {
    return {
      valid: false,
      error: formatError,
    };
  }

  // If reachability check is disabled, return early
  if (!checkReachability) {
    return { valid: true };
  }

  // Parse URL
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Make HEAD request to check if URL is reachable
    // HEAD is faster than GET because it doesn't download the body
    const response = await fetch(normalizedUrl, {
      method: "HEAD",
      signal: controller.signal,
      // Don't follow redirects automatically - we want to see the first response
      redirect: "manual",
    });

    clearTimeout(timeoutId);

    // Accept successful responses and redirects (2xx, 3xx)
    if (response.status >= 200 && response.status < 400) {
      return {
        valid: true,
        statusCode: response.status,
      };
    }

    // Handle specific error codes
    if (response.status === 403 || response.status === 401) {
      return {
        valid: false,
        error: "URL requires authentication or is forbidden",
        statusCode: response.status,
      };
    }

    if (response.status === 404) {
      return {
        valid: false,
        error: "URL not found (404)",
        statusCode: response.status,
      };
    }

    if (response.status >= 500) {
      return {
        valid: false,
        error: "Website is temporarily unavailable (server error)",
        statusCode: response.status,
      };
    }

    return {
      valid: false,
      error: `URL returned error status: ${response.status}`,
      statusCode: response.status,
    };
  } catch (error: any) {
    // Handle timeout
    if (error.name === "AbortError") {
      return {
        valid: false,
        error: `URL did not respond within ${timeout / 1000} seconds`,
      };
    }

    // Handle network errors
    if (error.message?.includes("fetch")) {
      return {
        valid: false,
        error: "Unable to reach URL (network error)",
      };
    }

    // Handle DNS errors
    if (error.code === "ENOTFOUND") {
      return {
        valid: false,
        error: "Website does not exist (DNS lookup failed)",
      };
    }

    // Generic error
    return {
      valid: false,
      error: `Unable to validate URL: ${error.message}`,
    };
  }
};

/**
 * Validate URL and show user-friendly error messages
 * Use this in your API endpoints
 */
export const validateUrlForIngestion = async (
  url: string
): Promise<{
  valid: boolean;
  normalizedUrl?: string;
  error?: string;
}> => {
  // Format validation
  const formatError = validateUrl(url);
  if (formatError) {
    return {
      valid: false,
      error: formatError,
    };
  }

  // Normalize URL
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  // Reachability check
  const reachabilityResult = await validateUrlAsync(url, {
    checkReachability: true,
    timeout: 10000, // 10 seconds
  });

  if (!reachabilityResult.valid) {
    return {
      valid: false,
      error: reachabilityResult.error,
    };
  }

  return {
    valid: true,
    normalizedUrl,
  };
};

/**
 * Batch validate multiple URLs
 * Useful for validating sitemaps or multiple pages
 */
export const validateUrlsBatch = async (
  urls: string[],
  options?: {
    checkReachability?: boolean;
    timeout?: number;
  }
): Promise<
  Array<{
    url: string;
    valid: boolean;
    error?: string;
  }>
> => {
  const results = await Promise.allSettled(
    urls.map((url) => validateUrlAsync(url, options))
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return {
        url: urls[index],
        ...result.value,
      };
    } else {
      return {
        url: urls[index],
        valid: false,
        error: "Validation failed unexpectedly",
      };
    }
  });
};