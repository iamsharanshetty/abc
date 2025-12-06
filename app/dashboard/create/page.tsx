"use client"

import * as React from "react"
import { ArrowRight, Bot, Check, Loader2, Settings, Sparkles, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"
import { validateUrl } from "@/lib/validation"
import { AGENT_ROLES, AgentRole, SUGGESTED_FUNCTIONS, RECOMMENDED_AGENT_TYPE } from "@/types/agent"
import { generateContentEmbeddings } from "@/app/actions/generate-embeddings"

const PROGRESS_STEPS = [
    "Setting up agent environment...",
    "Analyzing website content...",
    "Identifying key products and services...",
    "Generating agent persona...",
    "Finalizing configuration...",
]

export default function CreateAgentPage() {
    const [step, setStep] = React.useState<"input" | "generating" | "settings">("input")
    const [url, setUrl] = React.useState("")
    const [selectedRole, setSelectedRole] = React.useState<AgentRole>(AGENT_ROLES[0].id)
    const [progressIndex, setProgressIndex] = React.useState(0)
    const [error, setError] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)

    const handleStart = async () => {
        const validationError = validateUrl(url)
        if (validationError) {
            setError(validationError)
            return
        }

        setError("")
        setIsLoading(true)

        try {
            // Call the actual Server Action
            const result = await generateContentEmbeddings(url)

            if (!result.success) {
                throw new Error(result.message || "Failed to generate agent")
            }

            setStep("generating")
            setProgressIndex(0)
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : "Failed to connect to agent generation service. Please try again.")
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        if (step === "generating") {
            if (progressIndex < PROGRESS_STEPS.length) {
                const timeout = setTimeout(() => {
                    setProgressIndex((prev) => prev + 1)
                }, 1500) // 1.5s per step
                return () => clearTimeout(timeout)
            } else {
                // Finished
                setTimeout(() => {
                    setStep("settings")
                    setIsLoading(false)
                }, 1000)
            }
        }
    }, [step, progressIndex])

    return (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row md:overflow-hidden transition-all duration-500 ease-in-out">
            {/* Left Panel (Input) */}
            <div
                className={cn(
                    "flex flex-col justify-center p-6 transition-all duration-500 ease-in-out",
                    step === "input" ? "w-full items-center" : "w-full md:w-1/3 border-r bg-muted/10"
                )}
            >
                <div className={cn("w-full max-w-md space-y-6", step !== "input" && "opacity-80 pointer-events-none")}>
                    <div className="space-y-2 text-center md:text-left">
                        <h1 className="text-3xl font-bold tracking-tight">Create New Agent</h1>
                        <p className="text-muted-foreground">
                            Enter your website URL to generate a custom AI agent.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="website-url"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Website URL
                            </label>
                            <Input
                                id="website-url"
                                placeholder="example.com"
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value)
                                    if (error) setError("")
                                }}
                                disabled={step !== "input" || isLoading}
                                aria-invalid={!!error}
                                aria-describedby={error ? "url-error" : undefined}
                            />
                            {error && (
                                <div id="url-error" className="flex items-center text-sm text-red-500 mt-1">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Agent Role
                            </label>
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
                                            <div className={cn(
                                                "mt-0.5 h-4 w-4 rounded-full border border-primary flex items-center justify-center",
                                                selectedRole === role.id ? "bg-primary" : "bg-transparent"
                                            )}>
                                                {selectedRole === role.id && <div className="h-2 w-2 rounded-full bg-background" />}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">{role.label}</p>
                                                <p className="text-xs text-muted-foreground">{role.description}</p>
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
                                {isLoading ? (
                                    "Starting..."
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Generate Agent
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel (Progress / Settings) */}
            <div className={cn(
                "flex-1 p-6 transition-all duration-500 ease-in-out overflow-y-auto",
                step === "input" ? "hidden opacity-0 translate-x-full" : "block opacity-100 translate-x-0"
            )}>
                <div className="h-full flex flex-col justify-center max-w-2xl mx-auto">

                    {step === "generating" && (
                        <div className="space-y-8" role="status" aria-live="polite">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-semibold tracking-tight">Building your agent...</h2>
                                <p className="text-muted-foreground">Please wait while we analyze your website and configure the agent.</p>
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
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-muted-foreground/30 text-muted-foreground">
                                                <span className="text-xs">{index + 1}</span>
                                            </div>
                                        )}
                                        <span className={cn(
                                            "text-sm transition-colors",
                                            index === progressIndex ? "font-medium text-foreground" :
                                                index < progressIndex ? "text-muted-foreground" : "text-muted-foreground/50"
                                        )}>
                                            {text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === "settings" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-semibold tracking-tight">Agent Proposal</h2>
                                    <p className="text-muted-foreground">Review and customize your new agent.</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <Bot className="h-6 w-6 text-primary" />
                                </div>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>General Settings</CardTitle>
                                    <CardDescription>Basic information about your agent.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Agent Type Recommendation */}
                                    <div className="rounded-lg border bg-muted/50 p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">Recommended Agent Type</span>
                                            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                                                <Sparkles className="mr-1 h-3 w-3" />
                                                {AGENT_ROLES.find(r => r.id === RECOMMENDED_AGENT_TYPE.role)?.label}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {RECOMMENDED_AGENT_TYPE.reason}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="agent-name" className="text-sm font-medium">Name</label>
                                        <Input id="agent-name" defaultValue="Alenta Support Bot" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="agent-persona" className="text-sm font-medium">Persona</label>
                                        <Input id="agent-persona" defaultValue="Professional, Helpful, and Concise" />
                                    </div>

                                    {/* Suggested Roles/Functions */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Suggested Functions</label>
                                        <div className="flex flex-wrap gap-2">
                                            {SUGGESTED_FUNCTIONS.map((func) => (
                                                <Badge key={func} variant="outline" className="cursor-pointer hover:bg-accent">
                                                    {func}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="agent-summary" className="text-sm font-medium">Summary</label>
                                        <textarea
                                            id="agent-summary"
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            defaultValue="This agent is designed to assist customers with inquiries about products, pricing, and support tickets. It has been trained on your documentation and FAQ pages."
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end space-x-4">
                                <Button variant="outline" onClick={() => setStep("input")}>Back</Button>
                                <Button>
                                    Review Proposal
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
