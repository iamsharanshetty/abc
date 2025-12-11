import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Manage your account and preferences.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Settings configuration coming soon...</p>
                </CardContent>
            </Card>
        </div>
    )
}
