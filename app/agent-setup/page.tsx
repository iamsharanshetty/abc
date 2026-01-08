"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Loader2,
  CheckCircle2,
  ArrowRight,
  Layout,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { validateUrl } from "@/lib/validation";
// ✅ FIXED: Import from agents.ts instead of agent.ts
import { createAgent } from "@/lib/actions/agents";

// Progress steps that match the backend job
const PROGRESS_STEPS = [
  "Scraping website content...",
  "Parsing HTML structure...",
  "Extracting meaningful content...",
  "Generating embeddings...",
  "Storing in database...",
];

export default function AgentSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [persona, setPersona] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progressIndex, setProgressIndex] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [generatedAgentId, setGeneratedAgentId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
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
        console.log(
          `🔄 Polling job ${jobId} (attempt ${attempts + 1}/${maxAttempts})`
        );

        const response = await fetch(`/api/v2/jobs/${jobId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error?.message ||
              `Failed to check job status: ${response.status}`
          );
        }

        if (result.success) {
          const { status, progress, result: jobResult } = result.data;

          // Update progress bar
          if (progress !== undefined) {
            const stepIndex = Math.floor(
              (progress / 100) * PROGRESS_STEPS.length
            );
            setProgressIndex(Math.min(stepIndex, PROGRESS_STEPS.length - 1));
          } else if (status === "running") {
            setProgressIndex((prev) => {
              const next = prev + 1;
              return next < PROGRESS_STEPS.length - 1 ? next : prev;
            });
          }

          // Job completed
          if (status === "completed") {
            console.log(" Job completed!", jobResult);

            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            setProgressIndex(PROGRESS_STEPS.length - 1);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setAnalysisResult(result.data.result);
            setStep(2); // Move to persona selection
            setLoading(false);
            return;
          } else if (status === "failed") {
            throw new Error(
              result.data.error?.message || "Job processing failed"
            );
          } else if (status === "running" || status === "pending") {
            attempts++;
            if (attempts >= maxAttempts) {
              throw new Error("Job is taking too long. Please try again.");
            }
          } else if (status === "canceled") {
            throw new Error("Job was canceled");
          }
        }
      } catch (error) {
        console.error("❌ Polling error:", error);

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Failed to check job status";
        setError(errorMessage);
        setLoading(false);
        setStep(1);
      }
    };

    // Start polling immediately
    poll();
    pollingIntervalRef.current = setInterval(poll, 5000); // Poll every 5 seconds
  };

  /**
   * Step 1: Submit URL and start ingestion
   */
  const handleUrlSubmit = async () => {
    const validationError = validateUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      console.log("🚀 Starting website analysis:", url);

      // Start showing progress
      setStep(1.5); // Intermediate step to show progress UI
      setProgressIndex(0);

      // Call the ingestion API
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

      if (!response.ok) {
        throw new Error(
          result.error?.message || `Server error: ${response.status}`
        );
      }

      if (!result.success) {
        throw new Error(result.error?.message || "Job creation failed");
      }

      const jobId = result.data.jobId;
      console.log("✅ Job created:", jobId);
      setCurrentJobId(jobId);

      // Start polling for job status
      await pollJobStatus(jobId);
    } catch (err) {
      console.error("❌ Error starting analysis:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to analyze website";
      setError(errorMessage);
      setLoading(false);
      setStep(1);
    }
  };

  /**
   * Step 2: Select persona and create agent
   */
  const handlePersonaSubmit = async () => {
    if (!persona) return;

    setLoading(true);
    setError("");

    try {
      console.log("🤖 Creating agent with persona:", persona);

      // Generate agent name from URL
      const hostname = new URL(url).hostname.replace("www.", "");
      const agentName = `${hostname} ${
        persona === "sales" ? "Sales Expert" : "Support Hero"
      }`;

      // ✅ FIXED: Use correct function signature
      const result = await createAgent({
        name: agentName,
        websiteUrl: url, // ✅ Note: lowercase 'websiteUrl'
        role: persona as "sales" | "support",
        settings: {
          name: agentName,
          url: url,
          role: persona as "sales" | "support",
          summary: `AI agent for ${hostname}`,
          persona:
            persona === "sales"
              ? "Helpful sales representative focused on understanding customer needs"
              : "Patient and knowledgeable support specialist",
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create agent");
      }

      // ✅ Check for agentId
      if (!result.agentId) {
        throw new Error("Agent created but no ID was returned");
      }

      console.log(" Agent created:", result.agentId);
      setGeneratedAgentId(result.agentId);
      setLoading(false);
      setStep(3); // Move to success screen
    } catch (err) {
      console.error("❌ Error creating agent:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create agent";
      setError(errorMessage);
      setLoading(false);
    }
  };

  /**
   * Step 3: Finish and redirect
   */
  const handleFinish = () => {
    router.push("/dashboard");
  };

  /**
   * Handle persona selection
   */
  const handlePersonaSelect = (selectedPersona: "sales" | "support") => {
    setPersona(selectedPersona);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 font-bold text-2xl flex items-center gap-2">
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-b-[16px] border-b-blue-600 border-r-[10px] border-r-transparent mb-1"></div>
        WEBREP
      </div>

      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12 gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  step >= s
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-1 rounded-full ${
                    step > s ? "bg-blue-600" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Website URL */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-0 shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">
                    Let's train your AI Agent
                  </CardTitle>
                  <CardDescription>
                    Enter your website URL. We'll analyze your content to build
                    your custom knowledge base.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Input
                      placeholder="https://example.com"
                      className="h-12 text-lg"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  {error && (
                    <div className="mt-4 flex items-center text-sm text-red-500">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {error}
                    </div>
                  )}
                  <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                    <p>
                      💡 Tip: For best results, use your home page. We'll crawl
                      linked pages automatically.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    size="lg"
                    onClick={handleUrlSubmit}
                    disabled={loading || !url}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : null}
                    Analyze Website
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* STEP 1.5: Progress */}
          {step === 1.5 && (
            <motion.div
              key="step1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="border-0 shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">
                    Building your agent...
                  </CardTitle>
                  <CardDescription>Analyzing {url}</CardDescription>
                  {currentJobId && (
                    <p className="text-xs text-muted-foreground font-mono mt-2">
                      Job ID: {currentJobId}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 py-8">
                  {PROGRESS_STEPS.map((text, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      {index < progressIndex ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      ) : index === progressIndex ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300">
                          <span className="text-xs text-slate-400">
                            {index + 1}
                          </span>
                        </div>
                      )}
                      <span
                        className={`text-sm ${
                          index === progressIndex
                            ? "font-medium text-foreground"
                            : index < progressIndex
                            ? "text-muted-foreground"
                            : "text-muted-foreground/50"
                        }`}
                      >
                        {text}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 2: Persona */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-0 shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">
                    Choose your Agent's Persona
                  </CardTitle>
                  <CardDescription>
                    How should your AI representative interact with visitors?
                  </CardDescription>
                  {analysisResult && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      Analyzed{" "}
                      {analysisResult.pagesProcessed ||
                        analysisResult.pagesScraped}{" "}
                      pages successfully
                    </div>
                  )}
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => handlePersonaSelect("support")}
                    className={`cursor-pointer border-2 rounded-xl p-6 hover:border-blue-500 transition-all ${
                      persona === "support"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-100 dark:border-slate-800"
                    }`}
                  >
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Support Hero</h3>
                    <p className="text-slate-500 text-sm">
                      Focuses on answering FAQs, troubleshooting, and providing
                      helpful information.
                    </p>
                  </div>

                  <div
                    onClick={() => handlePersonaSelect("sales")}
                    className={`cursor-pointer border-2 rounded-xl p-6 hover:border-blue-500 transition-all ${
                      persona === "sales"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-100 dark:border-slate-800"
                    }`}
                  >
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                      <Layout className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Sales Expert</h3>
                    <p className="text-slate-500 text-sm">
                      Focuses on value proposition, handling objections, and
                      driving conversions.
                    </p>
                  </div>
                </CardContent>
                {error && (
                  <div className="px-6 pb-4">
                    <div className="flex items-center text-sm text-red-500 p-3 bg-red-50 dark:bg-red-950/20 rounded-md">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {error}
                    </div>
                  </div>
                )}
                <CardFooter className="flex justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    size="lg"
                    onClick={handlePersonaSubmit}
                    disabled={loading || !persona}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : null}
                    Create Agent
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* STEP 3: Success */}
          {step === 3 && generatedAgentId && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-0 shadow-xl text-center p-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  Your Agent is Ready!
                </h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  We've created your agent based on <strong>{url}</strong> with
                  a <strong>{persona}</strong> persona.
                </p>

                <div className="space-y-4">
                  <div className="bg-slate-900 text-slate-300 p-4 rounded-lg text-left text-sm font-mono overflow-x-auto">
                    <code>{`<script 
  src="${window.location.origin}/embed.js" 
  data-agent-id="${generatedAgentId}"
  data-primary-color="#2563eb"
></script>`}</code>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <p>
                      💡 <strong>Customization Options:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <code>data-primary-color</code> - Set widget color
                        (default: #2563eb)
                      </li>
                      <li>
                        <code>data-position</code> - Widget position (default:
                        bottom-right)
                      </li>
                    </ul>
                  </div>
                </div>

                <Button size="lg" className="w-full" onClick={handleFinish}>
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
