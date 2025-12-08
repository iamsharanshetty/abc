"use client";

import * as React from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { validateUrl as importValidateUrl } from "@/lib/validation";

export function UrlInputForm() {
  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(false);
  const [isAnalyzed, setIsAnalyzed] = React.useState(false);
  const router = useRouter();

  const validateInput = (value: string) => {
    return importValidateUrl(value);
  };

  // Check if website is already analyzed
  const checkStatus = async (websiteUrl: string) => {
    try {
      const response = await fetch(
        `/api/status?url=${encodeURIComponent(websiteUrl)}`
      );
      const result = await response.json();

      if (result.success && result.data.isAnalyzed) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking status:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateInput(url);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsChecking(true);

    // First check if already analyzed
    const alreadyAnalyzed = await checkStatus(url);
    setIsChecking(false);

    if (alreadyAnalyzed) {
      setIsAnalyzed(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/create?url=${encodeURIComponent(url)}`);
      }, 2000);
      return;
    }

    // If not analyzed, redirect to create page to start analysis
    router.push(`/dashboard/create?url=${encodeURIComponent(url)}`);
  };

  if (isAnalyzed) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4 py-8">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                Website Already Analyzed!
              </h3>
              <p className="text-sm text-muted-foreground">
                Redirecting you to the dashboard...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Analyze Your Website</CardTitle>
        <CardDescription>
          Enter your website URL to generate a comprehensive AI agent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="https://example.com"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError("");
            }}
            error={error}
            disabled={isLoading || isChecking}
            autoFocus
          />
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading || isChecking}
          >
            {isChecking
              ? "Checking Status..."
              : isLoading
              ? "Analyzing..."
              : "Generate My Agent"}
            {!isLoading && !isChecking && (
              <ArrowRight className="ml-2 h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
