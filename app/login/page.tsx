'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loader2, Mail, Github, Chrome, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        console.log('Login attempt:', email, password)

        // DEV BACKDOOR
        if (email.trim() === 'arjun@gmail.com' && password.trim() === '12345678') {
            console.log('Backdoor activated')
            document.cookie = 'dev-auth=true; path=/'
            router.push('/dashboard')
            return
        }

        try {
            if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${location.origin}/auth/callback`,
                    },
                })
                if (error) throw error

                // CHECK: If auto-confirm is enabled, we get a session immediately
                if (data.session) {
                    router.refresh()
                    router.push('/dashboard')
                } else {
                    setMessage({ type: 'success', text: 'Check your email to confirm your account.' })
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                router.refresh()
                router.push('/dashboard')
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setLoading(false)
        }
    }

    const handleOAuth = async (provider: 'google' | 'github') => {
        setLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        })
        if (error) {
            setMessage({ type: 'error', text: error.message })
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex">
            {/* Left Panel - Branding/Art */}
            <div className="hidden lg:flex w-1/2 bg-black relative overflow-hidden flex-col justify-between p-12 text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-violet-600/20 z-0" />
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[100px]" />

                <div className="relative z-10 flex items-center gap-2 font-bold text-2xl tracking-tight">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                        W
                    </div>
                    WebRep
                </div>

                <div className="relative z-10 max-w-lg space-y-6">
                    <h1 className="text-4xl font-bold leading-tight">
                        Deploy intelligent AI agents for your business in minutes.
                    </h1>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-white/80">
                            <CheckCircle2 className="w-5 h-5 text-blue-400" />
                            <span>Zero-code setup process</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/80">
                            <CheckCircle2 className="w-5 h-5 text-blue-400" />
                            <span>Trained on your website content</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/80">
                            <CheckCircle2 className="w-5 h-5 text-blue-400" />
                            <span>24/7 automated support</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-sm text-white/40">
                    © 2024 WebRep AI Inc. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-[400px] space-y-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-2 font-bold text-xl mb-8">
                        <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">W</div>
                        WebRep
                    </div>

                    <div className="space-y-2 text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight">
                            {mode === 'signin' ? 'Welcome back' : 'Create an account'}
                        </h2>
                        <p className="text-muted-foreground">
                            {mode === 'signin'
                                ? 'Enter your details to access your dashboard'
                                : 'Start building your AI workforce today'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                onClick={() => handleOAuth('github')}
                                disabled={loading}
                                className="h-11 bg-card hover:bg-secondary border-border/50"
                            >
                                <Github className="mr-2 h-4 w-4" />
                                Github
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleOAuth('google')}
                                disabled={loading}
                                className="h-11 bg-card hover:bg-secondary border-border/50"
                            >
                                <Chrome className="mr-2 h-4 w-4" />
                                Google
                            </Button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border/50" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleEmailAuth} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    id="email"
                                    placeholder="name@example.com"
                                    type="email"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect="off"
                                    disabled={loading}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11 bg-muted/30 border-border/50 focus:bg-background transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    id="password"
                                    placeholder="Password"
                                    type="password"
                                    disabled={loading}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-11 bg-muted/30 border-border/50 focus:bg-background transition-colors"
                                />
                            </div>

                            {message && (
                                <div className={cn(
                                    "text-sm p-3 rounded-md flex items-start gap-2",
                                    message.type === 'success'
                                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                                )}>
                                    {message.text}
                                </div>
                            )}

                            <Button
                                disabled={loading}
                                type="submit"
                                className="w-full h-11 text-base font-semibold shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white transition-all"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {mode === 'signin' ? 'Sign In' : 'Create Account'}
                            </Button>
                        </form>
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                        {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => {
                                setMode(mode === 'signin' ? 'signup' : 'signin')
                                setMessage(null)
                            }}
                            className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                        >
                            {mode === 'signin' ? "Sign Up" : "Sign In"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}
