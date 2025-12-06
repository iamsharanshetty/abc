"use client"

import * as React from "react"
import { ArrowRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { validateUrl as importValidateUrl } from "@/lib/validation"

export function UrlInputForm() {
    const [url, setUrl] = React.useState("")
    const [error, setError] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)

    const validateInput = (value: string) => {
        return importValidateUrl(value)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const validationError = validateInput(url)
        if (validationError) {
            setError(validationError)
            return
        }

        setError("")
        setIsLoading(true)

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500))

        setIsLoading(false)
        alert(`Generating WebRep for: ${url}`)
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Analyze Your Website</CardTitle>
                <CardDescription>
                    Enter your website URL to generate a comprehensive reputation report.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        placeholder="example.com"
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value)
                            if (error) setError("")
                        }}
                        error={error}
                        disabled={isLoading}
                        autoFocus
                    />
                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        {isLoading ? "Analyzing..." : "Generate My WebRep"}
                        {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
