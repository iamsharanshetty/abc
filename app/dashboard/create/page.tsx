"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, Bot, Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { validateUrl } from "@/lib/validation";
import { AGENT_ROLES, AgentRole, SUGGESTED_FUNCTIONS } from "@/types/agent";
import { logger } from "@/lib/utils/logger";
import { createAgent } from "@/lib/actions/agents";

const PROGRESS_STEPS = [
  "Scraping website content...",
  "Parsing HTML structure...",
  "Extracting meaningful content...",
  "Generating embeddings...",
  "Storing in database...",
];

function CreateAgentPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlFromParam = searchParams.get("url");

  const [step, setStep] = React.useState<"input" | "generating" | "settings">(
    "input"
  );
  const [url, setUrl] = React.useState(urlFromParam || "");
  const [selectedRole, setSelectedRole] = React.useState<AgentRole>(
    AGENT_ROLES[0].id
  );
  const [progressIndex, setProgressIndex] = React.useState(0);
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<any>(null);
  const [currentJobId, setCurrentJobId] = React.useState<string | null>(null);
  const [isSavingAgent, setIsSavingAgent] = React.useState(false);
  const pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Auto-start if URL is provided
  React.useEffect(() => {
    if (urlFromParam && !isLoading && step === "input") {
      setTimeout(() => {
        handleStart();
      }, 500);
    }
  }, [urlFromParam]);

  // Cleanup polling interval on unmount
  React.useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  /**
   * Poll job status from Trigger.dev
   */
  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      try {
        logger.pollingProgress("start", jobId, {
          attempt: attempts + 1,
          maxAttempts,
        });

        const response = await fetch(`/api/v2/jobs/${jobId}`);
        const result = await response.json();

        logger.pollingProgress("response", jobId, {
          status: result.data?.status,
          progress: result.data?.progress,
        });

        if (!response.ok) {
          throw new Error(
            result.error?.message ||
              `Failed to check job status: ${response.status}`
          );
        }

        if (result.success) {
          const { status, progress, result: jobResult } = result.data;

          if (progress !== undefined) {
            const stepIndex = Math.floor(
              (progress / 100) * PROGRESS_STEPS.length
            );
            setProgressIndex(Math.min(stepIndex, PROGRESS_STEPS.length - 1));

            logger.pollingProgress("progress", jobId, {
              progress,
              stepIndex: stepIndex + 1,
              totalSteps: PROGRESS_STEPS.length,
            });
          } else if (status === "running") {
            setProgressIndex((prev) => {
              const next = prev + 1;
              return next < PROGRESS_STEPS.length - 1 ? next : prev;
            });
          }

          if (status === "completed") {
            logger.pollingProgress("complete", jobId, {
              pagesProcessed: jobResult?.pagesProcessed,
              embeddingsCreated: jobResult?.embeddingsCreated,
            });

            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            setProgressIndex(PROGRESS_STEPS.length - 1);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setAnalysisResult(result.data.result);
            setStep("settings");
            setIsLoading(false);
            return;
          } else if (status === "failed") {
            throw new Error(
              result.data.error?.message || "Job processing failed"
            );
          } else if (status === "running" || status === "pending") {
            attempts++;
            if (attempts >= maxAttempts) {
              throw new Error(
                "Job is taking too long to complete. Please try again with fewer pages."
              );
            }
          } else if (status === "canceled") {
            throw new Error("Job was canceled");
          }
        } else {
          throw new Error(result.error?.message || "Failed to get job status");
        }
      } catch (error) {
        logger.pollingProgress("error", jobId, {
          error: error instanceof Error ? error.message : "Unknown error",
          attempt: attempts + 1,
        });

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Failed to check job status";
        setError(errorMessage);
        setIsLoading(false);
        setStep("input");
      }
    };

    poll();
    pollingIntervalRef.current = setInterval(poll, 5000);
  };

  /**
   * Handle form submission - trigger background job
   */
  const handleStart = async () => {
    const validationError = validateUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      logger.info("Starting website analysis", { url });

      setStep("generating");
      setProgressIndex(0);

      logger.debug("Calling ingestion API", { endpoint: "/api/v2/ingest" });
      const response = await fetch("/api/v2/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url,
          useBrowser: true,
          forceRefresh: true,
          maxPages: 50,
        }),
      });

      const result = await response.json();
      logger.debug("Ingestion API response received", {
        success: result.success,
        jobId: result.data?.jobId,
      });

      if (!response.ok) {
        const errorMessage =
          result.error?.message ||
          result.message ||
          `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }

      if (!result.success) {
        throw new Error(
          result.error?.message || result.message || "Job creation failed"
        );
      }

      const jobId = result.data.jobId;
      logger.info("Background job created", { jobId, url });
      setCurrentJobId(jobId);

      await pollJobStatus(jobId);
    } catch (err) {
      logger.error("Website analysis failed", {
        url,
        error: err instanceof Error ? err.message : "Unknown error",
      });
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to analyze website. Please try again.";
      setError(errorMessage);
      setIsLoading(false);
      setStep("input");
    }
  };

  /**
   * Cancel ongoing job
   */
  const handleCancelJob = async () => {
    if (!currentJobId) return;

    try {
      logger.info("Canceling job", { jobId: currentJobId });

      const response = await fetch(`/api/v2/jobs/${currentJobId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        logger.info("Job canceled successfully", { jobId: currentJobId });
      }
    } catch (error) {
      logger.error("Error canceling job", {
        jobId: currentJobId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      setIsLoading(false);
      setStep("input");
      setProgressIndex(0);
      setCurrentJobId(null);
    }
  };

  /**
   * ✅ NEW: Save agent to database after successful analysis
   */
  const handleConfigureAgent = async () => {
    setIsSavingAgent(true);
    setError("");

    try {
      logger.info("Creating agent record", { url, role: selectedRole });

      // Generate agent name from URL
      const hostname = new URL(url).hostname.replace("www.", "");
      const agentName = `${hostname} ${
        AGENT_ROLES.find((r) => r.id === selectedRole)?.label || "Agent"
      }`;

      // Create agent in database
      const result = await createAgent({
        name: agentName,
        websiteUrl: url,
        role: selectedRole,
        settings: {
          summary: `AI agent for ${hostname} - ${
            AGENT_ROLES.find((r) => r.id === selectedRole)?.description || ""
          }`,
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create agent");
      }

      logger.info("Agent created successfully", { agentId: result.agentId });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      logger.error("Failed to create agent", { error: err });
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create agent";
      setError(errorMessage);
      setIsSavingAgent(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row md:overflow-hidden transition-all duration-500 ease-in-out">
      {/* Left Panel (Input) */}
      <div
        className={cn(
          "flex flex-col justify-center p-6 transition-all duration-500 ease-in-out",
          step === "input"
            ? "w-full items-center"
            : "w-full md:w-1/3 border-r bg-muted/10"
        )}
      >
        <div
          className={cn(
            "w-full max-w-md space-y-6",
            step !== "input" && "opacity-80 pointer-events-none"
          )}
        >
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight">
              Create New Agent
            </h1>
            <p className="text-muted-foreground">
              Enter your website URL to generate a custom AI agent.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="website-url" className="text-sm font-medium">
                Website URL
              </label>
              <Input
                id="website-url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError("");
                }}
                disabled={step !== "input" || isLoading}
                aria-invalid={!!error}
              />
              {error && (
                <div className="flex items-center text-sm text-red-500 mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {error}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Agent Role</label>
              <RadioGroup
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as AgentRole)}
                className="grid gap-2"
                disabled={step !== "input" || isLoading}
              >
                {AGENT_ROLES.map((role) => (
                  <div key={role.id}>
                    <RadioGroupItem
                      value={role.id}
                      id={role.id}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={role.id}
                      className={cn(
                        "flex items-start space-x-3 rounded-md border p-3 cursor-pointer hover:bg-accent transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent",
                        step !== "input" && "cursor-default"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 h-4 w-4 rounded-full border border-primary flex items-center justify-center",
                          selectedRole === role.id
                            ? "bg-primary"
                            : "bg-transparent"
                        )}
                      >
                        {selectedRole === role.id && (
                          <div className="h-2 w-2 rounded-full bg-background" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {role.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {role.description}
                        </p>
                      </div>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {step === "input" && (
              <Button
                className="w-full"
                size="lg"
                onClick={handleStart}
                disabled={isLoading}
                isLoading={isLoading}
              >
                {isLoading ? "Starting..." : "Generate Agent"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel (Progress / Settings) */}
      <div
        className={cn(
          "flex-1 p-6 transition-all duration-500 ease-in-out overflow-y-auto",
          step === "input" ? "hidden" : "block"
        )}
      >
        <div className="h-full flex flex-col justify-center max-w-2xl mx-auto">
          {step === "generating" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Building your agent...
                </h2>
                <p className="text-muted-foreground">Analyzing {url}</p>
                {currentJobId && (
                  <p className="text-xs text-muted-foreground font-mono">
                    Job ID: {currentJobId}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {PROGRESS_STEPS.map((text, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    {index < progressIndex ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-4 w-4" />
                      </div>
                    ) : index === progressIndex ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-muted-foreground/30">
                        <span className="text-xs">{index + 1}</span>
                      </div>
                    )}
                    <span
                      className={cn(
                        "text-sm transition-colors",
                        index === progressIndex
                          ? "font-medium text-foreground"
                          : index < progressIndex
                          ? "text-muted-foreground"
                          : "text-muted-foreground/50"
                      )}
                    >
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancelJob}
                  disabled={!currentJobId}
                >
                  Cancel Analysis
                </Button>
              </div>
            </div>
          )}

          {step === "settings" && analysisResult && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold">Agent Created!</h2>
                  <p className="text-muted-foreground">
                    Analyzed{" "}
                    {analysisResult.pagesProcessed ||
                      analysisResult.pagesScraped}{" "}
                    pages successfully
                  </p>
                </div>
                <Bot className="h-12 w-12 text-primary" />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                  <CardDescription>
                    Your website has been processed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Pages Scraped
                      </p>
                      <p className="text-2xl font-bold">
                        {analysisResult.pagesScraped || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Pages Processed
                      </p>
                      <p className="text-2xl font-bold">
                        {analysisResult.pagesProcessed || 0}
                      </p>
                    </div>
                  </div>

                  {analysisResult.skippedDuplicates !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Duplicates Skipped
                      </p>
                      <p className="text-lg font-semibold">
                        {analysisResult.skippedDuplicates}
                      </p>
                    </div>
                  )}

                  {analysisResult.embeddingsCreated !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Embeddings Created
                      </p>
                      <p className="text-lg font-semibold">
                        {analysisResult.embeddingsCreated}
                      </p>
                    </div>
                  )}

                  {analysisResult.scraperUsed && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Scraper Used
                      </p>
                      <Badge variant="outline">
                        {analysisResult.scraperUsed === "puppeteer"
                          ? "Browser (Puppeteer)"
                          : "HTTP (Axios)"}
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Suggested Functions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_FUNCTIONS.map((func) => (
                        <Badge key={func} variant="outline">
                          {func}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <div className="flex items-center text-sm text-red-500 p-3 bg-red-50 dark:bg-red-950/20 rounded-md">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("input");
                    setUrl("");
                    setAnalysisResult(null);
                    setProgressIndex(0);
                    setCurrentJobId(null);
                  }}
                  disabled={isSavingAgent}
                >
                  Create Another
                </Button>
                <Button
                  onClick={handleConfigureAgent}
                  disabled={isSavingAgent}
                  isLoading={isSavingAgent}
                >
                  {isSavingAgent ? "Saving..." : "Save Agent"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateAgentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CreateAgentPageContent />
    </Suspense>
  );
}
