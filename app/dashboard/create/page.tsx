"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Check,
  Loader2,
  AlertCircle,
  XCircle,
} from "lucide-react";
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
import { AGENT_ROLES, AgentRole } from "@/types/agent";

const PROGRESS_STEPS = [
  { key: "queued", label: "Initializing..." },
  { key: "scraping", label: "Scraping website content..." },
  { key: "parsing", label: "Parsing HTML structure..." },
  { key: "embedding", label: "Generating embeddings..." },
  { key: "completed", label: "Complete!" },
];

interface JobProgress {
  jobId: string;
  status:
    | "queued"
    | "scraping"
    | "parsing"
    | "embedding"
    | "completed"
    | "failed";
  progress: number;
  message: string;
  currentStep: string;
  pagesScraped?: number;
  pagesProcessed?: number;
  error?: string;
}

export default function CreateAgentPage() {
  const searchParams = useSearchParams();
  const urlFromParam = searchParams.get("url");

  const [step, setStep] = React.useState<"input" | "generating" | "settings">(
    "input"
  );
  const [url, setUrl] = React.useState(urlFromParam || "");
  const [selectedRole, setSelectedRole] = React.useState<AgentRole>(
    AGENT_ROLES[0].id
  );
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [jobProgress, setJobProgress] = React.useState<JobProgress | null>(
    null
  );

  // Poll for job progress
  React.useEffect(() => {
    if (
      !jobId ||
      jobProgress?.status === "completed" ||
      jobProgress?.status === "failed"
    ) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/progress?jobId=${jobId}`);
        const result = await response.json();

        if (result.success) {
          setJobProgress(result.data);

          // If completed, move to settings
          if (result.data.status === "completed") {
            setTimeout(() => {
              setStep("settings");
              setIsLoading(false);
            }, 1000);
          }

          // If failed, show error
          if (result.data.status === "failed") {
            setError(result.data.error || "Job failed");
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error("Error polling job progress:", err);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [jobId, jobProgress?.status]);

  const handleStart = async () => {
    const validationError = validateUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsLoading(true);
    setStep("generating");

    try {
      // Start the job
      const response = await fetch("/api/jobs/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          useBrowser: true,
          maxPages: 50,
          agentRole: selectedRole,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to start job");
      }

      setJobId(result.data.jobId);
    } catch (err) {
      console.error("Job start error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start analysis";
      setError(errorMessage);
      setIsLoading(false);
      setStep("input");
    }
  };

  const handleCancel = async () => {
    if (!jobId) return;

    try {
      await fetch("/api/jobs/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      });

      setStep("input");
      setJobId(null);
      setJobProgress(null);
      setIsLoading(false);
    } catch (err) {
      console.error("Error canceling job:", err);
    }
  };

  const getCurrentStepIndex = () => {
    if (!jobProgress) return 0;
    return PROGRESS_STEPS.findIndex((s) => s.key === jobProgress.status);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row md:overflow-hidden transition-all duration-500 ease-in-out">
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
                  {jobProgress?.status === "failed"
                    ? "Analysis Failed"
                    : "Building your agent..."}
                </h2>
                <p className="text-muted-foreground">
                  {jobProgress?.message || "Analyzing " + url}
                </p>
              </div>

              {jobProgress?.status !== "failed" ? (
                <>
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {jobProgress?.progress || 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${jobProgress?.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="space-y-4">
                    {PROGRESS_STEPS.map((stepItem, index) => {
                      const currentIndex = getCurrentStepIndex();
                      const isCompleted = index < currentIndex;
                      const isCurrent = index === currentIndex;
                      const isPending = index > currentIndex;

                      return (
                        <div
                          key={stepItem.key}
                          className="flex items-center space-x-3"
                        >
                          {isCompleted ? (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="h-4 w-4" />
                            </div>
                          ) : isCurrent ? (
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
                              isCurrent
                                ? "font-medium text-foreground"
                                : isCompleted
                                ? "text-muted-foreground"
                                : "text-muted-foreground/50"
                            )}
                          >
                            {stepItem.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Stats */}
                  {jobProgress &&
                    (jobProgress.pagesScraped ||
                      jobProgress.pagesProcessed) && (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-2 gap-4 text-center">
                            {jobProgress.pagesScraped !== undefined && (
                              <div>
                                <p className="text-2xl font-bold">
                                  {jobProgress.pagesScraped}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Pages Found
                                </p>
                              </div>
                            )}
                            {jobProgress.pagesProcessed !== undefined && (
                              <div>
                                <p className="text-2xl font-bold">
                                  {jobProgress.pagesProcessed}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Pages Processed
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                  {/* Cancel Button */}
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                // Error State
                <div className="space-y-6 text-center">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-destructive/10 p-3">
                      <XCircle className="h-8 w-8 text-destructive" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {jobProgress?.error || "An error occurred during analysis"}
                  </p>
                  <Button
                    onClick={() => {
                      setStep("input");
                      setJobId(null);
                      setJobProgress(null);
                      setError("");
                    }}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === "settings" && jobProgress && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold">Agent Created!</h2>
                  <p className="text-muted-foreground">
                    Analyzed {jobProgress.pagesProcessed} pages successfully
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
                        {jobProgress.pagesScraped}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Pages Processed
                      </p>
                      <p className="text-2xl font-bold">
                        {jobProgress.pagesProcessed}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("input");
                    setUrl("");
                    setJobId(null);
                    setJobProgress(null);
                  }}
                >
                  Create Another
                </Button>
                <Button>
                  Configure Agent
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
