"use client";

import * as React from "react";
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
  const [progressIndex, setProgressIndex] = React.useState(0);
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<any>(null);

  // Auto-start if URL is provided
  React.useEffect(() => {
    if (urlFromParam && !isLoading && step === "input") {
      // Small delay to show the UI first
      setTimeout(() => {
        handleStart();
      }, 500);
    }
  }, [urlFromParam]);

  const [analysisResults, setAnalysisResults] = React.useState<{
    pagesScraped: number;
    pagesProcessed: number;
    skippedDuplicates: number;
  } | null>(null);

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

      // Call the backend API endpoint
      const response = await fetch("/api/analyze", {
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

      // Handle error responses
      if (!response.ok) {
        const errorMessage =
          result.error?.message ||
          result.message ||
          `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }

      if (!result.success) {
        throw new Error(
          result.error?.message || result.message || "Analysis failed"
        );
      }

      // Store results from API response
      if (result.data) {
        console.log("Analysis successful:", result.data);
        setAnalysisResults({
          pagesScraped: result.data.pagesScraped,
          pagesProcessed: result.data.pagesProcessed,
          skippedDuplicates: result.data.skippedDuplicates,
        });
      }

      // Move to generating step
      setStep("generating");
      setProgressIndex(0);
    } catch (err) {
      console.error("Analysis error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to analyze website. Please try again.";
      setError(errorMessage);
      setIsLoading(false);
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
            </div>
          )}

          {step === "settings" && analysisResult && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold">Agent Created!</h2>
                  <p className="text-muted-foreground">
                    Analyzed {analysisResult.pagesProcessed} pages successfully
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
                        {analysisResult.pagesScraped}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Pages Processed
                      </p>
                      <p className="text-2xl font-bold">
                        {analysisResult.pagesProcessed}
                      </p>
                    </div>
                  </div>

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

              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("input");
                    setUrl("");
                    setAnalysisResult(null);
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
