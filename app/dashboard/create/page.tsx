"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

const PROGRESS_STEPS = [
  "Scraping website content...",
  "Parsing HTML structure...",
  "Extracting meaningful content...",
  "Generating embeddings...",
  "Storing in database...",
];

function CreateAgentPageContent() {
  const searchParams = useSearchParams();
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
  const pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Auto-start if URL is provided
  React.useEffect(() => {
    if (urlFromParam && !isLoading && step === "input") {
      // Small delay to show the UI first
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
    const maxAttempts = 60; // Poll for up to 5 minutes (60 × 5 seconds)
    let attempts = 0;

    const poll = async () => {
      try {
        console.log(
          `Polling job status... Attempt ${attempts + 1}/${maxAttempts}`
        );

        const response = await fetch(`/api/v2/jobs/${jobId}`);
        const result = await response.json();

        console.log("Job status response:", result);

        if (!response.ok) {
          throw new Error(
            result.error?.message ||
            `Failed to check job status: ${response.status}`
          );
        }

        if (result.success) {
          const { status, progress, result: jobResult } = result.data;

          // Update progress indicator based on job progress
          if (progress !== undefined) {
            const stepIndex = Math.floor(
              (progress / 100) * PROGRESS_STEPS.length
            );
            setProgressIndex(Math.min(stepIndex, PROGRESS_STEPS.length - 1));
            console.log(
              `Progress: ${progress}% - Step ${stepIndex + 1}/${PROGRESS_STEPS.length
              }`
            );
          } else if (status === "running") {
            // Fallback: slowly increment progress if no specific progress reported
            setProgressIndex((prev) => {
              const next = prev + 1;
              return next < PROGRESS_STEPS.length - 1 ? next : prev;
            });
          }

          if (status === "completed") {
            // ✅ Job finished successfully
            console.log("Job completed successfully:", jobResult);

            // Stop polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            // Complete the progress animation
            setProgressIndex(PROGRESS_STEPS.length - 1);

            // Wait a moment to show completion
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Store analysis results
            setAnalysisResult(result.data.result);

            // Move to settings step
            setStep("settings");
            setIsLoading(false);
            return;
          } else if (status === "failed") {
            // ❌ Job failed
            throw new Error(
              result.data.error?.message || "Job processing failed"
            );
          } else if (status === "running" || status === "pending") {
            // 🔄 Still processing
            attempts++;

            if (attempts >= maxAttempts) {
              throw new Error(
                "Job is taking too long to complete. Please try again with fewer pages."
              );
            }
            // Continue polling (interval will call this function again)
          } else if (status === "canceled") {
            // 🚫 Job was canceled
            throw new Error("Job was canceled");
          }
        } else {
          throw new Error(result.error?.message || "Failed to get job status");
        }
      } catch (error) {
        console.error("Error polling job status:", error);

        // Stop polling on error
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

    // Start polling immediately, then every 5 seconds
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
      console.log("Starting analysis for URL:", url);

      // Move to generating step BEFORE API call
      setStep("generating");
      setProgressIndex(0);

      // ✅ ONLY call the V2 API - NOT /api/analyze
      console.log("Calling /api/v2/ingest...");
      const response = await fetch("/api/v2/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          useBrowser: true,
          forceRefresh: true,
          maxPages: 50,
        }),
      });

      const result = await response.json();
      console.log("API Response:", result);

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

      // Start polling for job status
      const jobId = result.data.jobId;
      console.log("Job created with ID:", jobId);
      setCurrentJobId(jobId);

      // Start polling
      await pollJobStatus(jobId);
    } catch (err) {
      console.error("Analysis error:", err);
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
      console.log("Canceling job:", currentJobId);

      const response = await fetch(`/api/v2/jobs/${currentJobId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        console.log("Job canceled successfully");
      }
    } catch (error) {
      console.error("Error canceling job:", error);
    } finally {
      // Stop polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      // Reset state
      setIsLoading(false);
      setStep("input");
      setProgressIndex(0);
      setCurrentJobId(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] animate-in fade-in duration-500">

      {/* Step 1: Input */}
      {step === "input" && (
        <div className="w-full max-w-2xl space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
              Create New Agent
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Enter your website URL. We'll crawl it and generate a custom trained AI agent in minutes.
            </p>
          </div>

          <Card className="border-border/50 shadow-2xl shadow-blue-500/10 bg-card/80 backdrop-blur-sm overflow-hidden p-2">
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="space-y-2 text-left">
                  <label htmlFor="website-url" className="text-sm font-medium ml-1">
                    Website URL
                  </label>
                  <div className="relative">
                    <Input
                      id="website-url"
                      placeholder="https://"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        if (error) setError("");
                      }}
                      className="h-14 pl-6 text-lg bg-secondary/30 border-border/50 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
                      disabled={isLoading}
                      autoFocus
                    />
                    {error && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
                        <AlertCircle className="h-4 w-4 mr-1.5" />
                        {error}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-sm font-medium ml-1">Agent Personality</label>
                  <RadioGroup
                    value={selectedRole}
                    onValueChange={(value) => setSelectedRole(value as AgentRole)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    disabled={isLoading}
                  >
                    {AGENT_ROLES.map((role) => (
                      <label
                        key={role.id}
                        htmlFor={role.id}
                        className={cn(
                          "relative flex items-center space-x-3 rounded-xl border border-border p-4 cursor-pointer transition-all duration-200 hover:border-blue-500/30 hover:bg-blue-500/5",
                          selectedRole === role.id ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500" : "bg-card"
                        )}
                      >
                        <RadioGroupItem value={role.id} id={role.id} className="sr-only" />
                        <div className={cn("flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                          selectedRole === role.id ? "bg-blue-600 text-white" : "bg-secondary text-muted-foreground"
                        )}>
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{role.label}</p>
                          <p className="text-xs text-muted-foreground">{role.description}</p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <Button
                className="w-full h-14 text-lg font-bold shadow-lg shadow-blue-600/25 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white transition-all duration-300 hover:scale-[1.01]"
                onClick={handleStart}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Starting...
                  </>
                ) : (
                  <>
                    Generate Agent <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Generating */}
      {step === "generating" && (
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
            <div className="relative bg-card border border-border shadow-2xl rounded-full w-full h-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Scanning Website</h2>
            <p className="text-muted-foreground">Analyzing {url}</p>
          </div>

          <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all duration-500 ease-out"
              style={{ width: `${((progressIndex + 1) / PROGRESS_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="space-y-3">
            {PROGRESS_STEPS.map((text, index) => (
              <div key={index} className={cn("flex items-center gap-3 transition-opacity duration-300",
                index === progressIndex ? "opacity-100 scale-105" : "opacity-40 scale-95"
              )}>
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border",
                  index < progressIndex ? "bg-green-500 border-green-500 text-white" :
                    index === progressIndex ? "bg-blue-600 border-blue-600 text-white animate-pulse" : "border-border text-muted-foreground"
                )}>
                  {index < progressIndex ? <Check className="w-3 h-3" /> : index + 1}
                </div>
                <span className={cn("text-sm font-medium", index === progressIndex ? "text-blue-600" : "text-muted-foreground")}>
                  {text}
                </span>
              </div>
            ))}
          </div>

          <Button variant="ghost" className="text-muted-foreground hover:text-red-500" onClick={handleCancelJob}>
            Cancel Process
          </Button>
        </div>
      )}

      {/* Step 3: Settings/Success */}
      {step === "settings" && analysisResult && (
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 mb-4 animate-in zoom-in spin-in-12 duration-500">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold">Agent Ready!</h2>
            <p className="text-muted-foreground">We've successfully trained your agent on {url}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-600 to-violet-700 text-white border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" /> Agent Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-blue-100 text-sm">Pages Processed</p>
                    <p className="text-3xl font-bold">{analysisResult.pagesProcessed || analysisResult.pagesScraped || 0}</p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm">Skills Learned</p>
                    <p className="text-3xl font-bold">{SUGGESTED_FUNCTIONS.length}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-blue-100 text-sm font-medium">Core Competencies</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_FUNCTIONS.slice(0, 4).map(f => (
                      <span key={f} className="px-2 py-1 rounded bg-white/10 text-xs font-medium border border-white/10">{f}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card shadow-sm h-full flex flex-col justify-center">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">What's Next?</h3>
                  <p className="text-sm text-muted-foreground">Your agent is live in sandbox mode. You can now customize its behavior, add more knowledge, or integrate it into your site.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button className="w-full h-11 bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                    Configure Agent <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button variant="outline" className="w-full h-11" onClick={() => {
                    setStep("input");
                    setUrl("");
                    setAnalysisResult(null);
                    setProgressIndex(0);
                  }}>
                    Create Another Agent
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

    </div>
  );
}

export default function CreateAgentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <CreateAgentPageContent />
    </Suspense>
  );
}
