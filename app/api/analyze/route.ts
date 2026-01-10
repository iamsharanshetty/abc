// app/api/analyze/route.ts - DEPRECATED ENDPOINT
/**
 * ⚠️ DEPRECATED API ENDPOINT
 * ===========================
 *
 * This endpoint has been deprecated in favor of /api/v2/ingest
 *
 * MIGRATION GUIDE:
 * ----------------
 * Old endpoint: POST /api/analyze
 * New endpoint: POST /api/v2/ingest
 *
 * Key changes:
 * 1. Uses Trigger.dev for background processing (better performance)
 * 2. Returns jobId immediately instead of waiting for completion
 * 3. Poll /api/v2/jobs/{jobId} for status updates
 * 4. Supports more configuration options
 *
 * Example migration:
 *
 * OLD CODE:
 * ```javascript
 * const response = await fetch('/api/analyze', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ url: 'https://example.com' })
 * });
 * const result = await response.json();
 * // result.data has the complete analysis
 * ```
 *
 * NEW CODE:
 * ```javascript
 * // Step 1: Start the background job
 * const response = await fetch('/api/v2/ingest', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     url: 'https://example.com',
 *     useBrowser: true,
 *     maxPages: 50
 *   })
 * });
 * const { data } = await response.json();
 * const jobId = data.jobId;
 *
 * // Step 2: Poll for completion
 * const checkStatus = async () => {
 *   const statusResponse = await fetch(`/api/v2/jobs/${jobId}`);
 *   const statusResult = await statusResponse.json();
 *
 *   if (statusResult.data.status === 'completed') {
 *     console.log('Analysis complete:', statusResult.data.result);
 *     return statusResult.data.result;
 *   } else if (statusResult.data.status === 'failed') {
 *     throw new Error(statusResult.data.error?.message);
 *   } else {
 *     // Still running, check again in 5 seconds
 *     setTimeout(checkStatus, 5000);
 *   }
 * };
 *
 * checkStatus();
 * ```
 *
 * DEPRECATION TIMELINE:
 * ---------------------
 * - Deprecated: December 21, 2024
 * - Sunset Date: March 21, 2025 (90 days)
 * - After sunset: This endpoint will return 410 Gone for all requests
 *
 * SUPPORT:
 * --------
 * If you have questions about migration, please contact the development team.
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

/**
 * POST /api/analyze - DEPRECATED
 *
 * Returns deprecation notice with migration instructions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    logger.warn("⚠️ Deprecated endpoint /api/analyze was called", {
      url: body?.url,
      useBrowser: body?.useBrowser,
      maxPages: body?.maxPages,
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
      timestamp: new Date().toISOString(),
    });

    // Calculate sunset date (90 days from now)
    const sunsetDate = new Date();
    sunsetDate.setDate(sunsetDate.getDate() + 90);

    // Return deprecation warning with helpful migration info
    return NextResponse.json(
      {
        success: false,
        deprecated: true,
        error: {
          code: "ENDPOINT_DEPRECATED",
          message:
            "⚠️ This endpoint has been deprecated. Please use /api/v2/ingest instead.",
          details:
            "The /api/analyze endpoint no longer processes requests. All functionality has been moved to /api/v2/ingest with improved performance through background job processing.",
        },
        deprecation: {
          deprecatedEndpoint: "/api/analyze",
          newEndpoint: "/api/v2/ingest",
          deprecationDate: "2024-12-21",
          sunsetDate: sunsetDate.toISOString().split("T")[0],
          daysUntilSunset: 90,
        },
        migration: {
          overview:
            "The new endpoint uses background job processing for better performance and reliability.",
          benefits: [
            "⚡ Immediate response with job ID (no more waiting)",
            "📊 Real-time progress updates via polling",
            "🔄 Better handling of large websites",
            "⏱️ No request timeouts (jobs run in background)",
            "🎯 More detailed status information",
          ],
          steps: [
            {
              step: 1,
              description: "Call POST /api/v2/ingest with your URL",
              example: {
                method: "POST",
                url: "/api/v2/ingest",
                body: {
                  url: body?.url || "https://example.com",
                  useBrowser: body?.useBrowser ?? true,
                  maxPages: body?.maxPages ?? 50,
                  forceRefresh: body?.forceRefresh ?? false,
                },
              },
            },
            {
              step: 2,
              description: "Receive a jobId in the immediate response",
              example: {
                success: true,
                data: {
                  jobId: "job_abc123xyz",
                  status: "pending",
                  message: "Ingestion job created successfully",
                },
              },
            },
            {
              step: 3,
              description:
                "Poll GET /api/v2/jobs/{jobId} every 5 seconds for status",
              example: {
                method: "GET",
                url: "/api/v2/jobs/job_abc123xyz",
              },
            },
            {
              step: 4,
              description:
                "Check job status - 'pending', 'running', 'completed', or 'failed'",
              example: {
                success: true,
                data: {
                  jobId: "job_abc123xyz",
                  status: "completed",
                  progress: 100,
                  result: {
                    websiteUrl: "https://example.com",
                    pagesScraped: 25,
                    pagesProcessed: 23,
                    embeddingsCreated: 150,
                  },
                },
              },
            },
            {
              step: 5,
              description:
                "When status is 'completed', retrieve results from job.result",
            },
          ],
          codeExample: `
// COMPLETE WORKING EXAMPLE
async function analyzeWebsite(url) {
  try {
    // Step 1: Start the job
    const startResponse = await fetch('/api/v2/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url,
        useBrowser: true,
        maxPages: 50,
        forceRefresh: false
      })
    });
    
    const startResult = await startResponse.json();
    
    if (!startResult.success) {
      throw new Error(startResult.error?.message || 'Failed to start job');
    }
    
    const jobId = startResult.data.jobId;
    console.log('Job started:', jobId);
    
    // Step 2: Poll for completion
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const statusResponse = await fetch(\`/api/v2/jobs/\${jobId}\`);
          const statusResult = await statusResponse.json();
          
          if (!statusResult.success) {
            reject(new Error('Failed to check job status'));
            return;
          }
          
          const { status, progress, result, error } = statusResult.data;
          
          console.log(\`Job status: \${status}, Progress: \${progress}%\`);
          
          if (status === 'completed') {
            console.log('✅ Analysis complete!');
            resolve(result);
          } else if (status === 'failed') {
            reject(new Error(error?.message || 'Job failed'));
          } else {
            // Still running, check again in 5 seconds
            setTimeout(checkStatus, 5000);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      checkStatus();
    });
  } catch (error) {
    console.error('Error analyzing website:', error);
    throw error;
  }
}

// Usage:
analyzeWebsite('https://example.com')
  .then(result => {
    console.log('Pages analyzed:', result.pagesProcessed);
    console.log('Embeddings created:', result.embeddingsCreated);
  })
  .catch(error => {
    console.error('Analysis failed:', error);
  });
          `.trim(),
        },
        backwards_compatibility: {
          enabled: false,
          reason:
            "Background processing architecture requires async approach. Synchronous processing is no longer supported due to performance and reliability improvements.",
          workaround:
            "Use the polling approach shown in the migration guide above. This provides better reliability and allows processing of larger websites without timeouts.",
        },
        resources: {
          documentation: "https://docs.webrep.com/api/v2/ingest",
          migrationGuide: "https://docs.webrep.com/migration/analyze-to-ingest",
          support: "support@webrep.com",
        },
      },
      {
        status: 410, // 410 Gone - indicates permanent deprecation
        headers: {
          "X-API-Deprecated": "true",
          "X-API-Deprecated-Since": "2024-12-21",
          "X-API-Sunset-Date": sunsetDate.toISOString().split("T")[0],
          "X-API-Replacement": "/api/v2/ingest",
          "X-API-Migration-Guide":
            "https://docs.webrep.com/migration/analyze-to-ingest",
          Link: '</api/v2/ingest>; rel="alternate"; title="Replacement endpoint"',
          Deprecation: "true", // Standard deprecation header
        },
      }
    );
  } catch (error) {
    logger.error("Error in deprecated /api/analyze endpoint", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        success: false,
        deprecated: true,
        error: {
          code: "ENDPOINT_DEPRECATED",
          message:
            "⚠️ This endpoint has been deprecated. Please use /api/v2/ingest instead.",
          newEndpoint: "/api/v2/ingest",
        },
      },
      {
        status: 410,
        headers: {
          "X-API-Deprecated": "true",
          "X-API-Replacement": "/api/v2/ingest",
        },
      }
    );
  }
}

/**
 * GET /api/analyze - DEPRECATED
 *
 * Returns deprecation notice for GET requests
 */
export async function GET(request: NextRequest) {
  logger.warn("⚠️ Deprecated endpoint /api/analyze (GET) was called", {
    userAgent: request.headers.get("user-agent"),
    referer: request.headers.get("referer"),
  });

  const sunsetDate = new Date();
  sunsetDate.setDate(sunsetDate.getDate() + 90);

  return NextResponse.json(
    {
      success: false,
      deprecated: true,
      message: "⚠️ This endpoint has been deprecated",
      deprecation: {
        deprecatedEndpoint: "/api/analyze",
        newEndpoint: "/api/v2/ingest",
        method: "POST",
        deprecationDate: "2024-12-21",
        sunsetDate: sunsetDate.toISOString().split("T")[0],
      },
      documentation: "https://docs.webrep.com/api/v2/ingest",
      migrationGuide: "https://docs.webrep.com/migration/analyze-to-ingest",
    },
    {
      status: 410,
      headers: {
        "X-API-Deprecated": "true",
        "X-API-Replacement": "/api/v2/ingest",
        Deprecation: "true",
      },
    }
  );
}

/**
 * Handle other HTTP methods
 */
export async function PUT(request: NextRequest) {
  return GET(request);
}

export async function PATCH(request: NextRequest) {
  return GET(request);
}

export async function DELETE(request: NextRequest) {
  return GET(request);
}
