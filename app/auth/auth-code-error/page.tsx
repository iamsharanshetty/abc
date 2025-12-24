import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"

export default function AuthErrorPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-destructive">Authentication Error</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="mb-4 text-muted-foreground">
                        There was an error verifying your authentication. This could be due to:
                    </p>
                    <ul className="list-inside list-disc text-left text-sm text-muted-foreground">
                        <li>Expired or invalid login link</li>
                        <li>Configuration mismatch in the authentication provider</li>
                        <li>Network connectivity issues</li>
                    </ul>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button asChild>
                        <Link href="/login">Return to Login</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
