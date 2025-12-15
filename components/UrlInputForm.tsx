"use client";

import * as React from "react";
import { ArrowRight, CheckCircle, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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

    const alreadyAnalyzed = await checkStatus(url);
    setIsChecking(false);

    if (alreadyAnalyzed) {
      setIsAnalyzed(true);
      setTimeout(() => {
        router.push(`/dashboard/create?url=${encodeURIComponent(url)}`);
      }, 2000);
      return;
    }

    router.push(`/dashboard/create?url=${encodeURIComponent(url)}`);
  };

  if (isAnalyzed) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 text-center animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Website Already Analyzed!
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Redirecting you to the dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Globe className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Enter your website URL..."
          className="w-full h-16 pl-12 pr-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-lg shadow-lg shadow-slate-200/50 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError("");
          }}
          disabled={isLoading || isChecking}
          autoFocus
        />
        <div className="absolute right-2 top-2 bottom-2">
          <Button
            type="submit"
            size="lg"
            className="h-full px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all rounded-lg"
            isLoading={isLoading || isChecking}
          >
            {isChecking ? "Checking..." : isLoading ? "Analyzing..." : "Generate Agent"}
          </Button>
        </div>
      </form>
      {error && (
        <p className="mt-3 text-sm text-red-500 font-medium ml-2 animate-in slide-in-from-top-1">
          {error}
        </p>
      )}
      <p className="mt-4 text-center text-sm text-slate-400 dark:text-slate-500">
        Start by entering your company's website URL
      </p>
    </div>
  );
}
