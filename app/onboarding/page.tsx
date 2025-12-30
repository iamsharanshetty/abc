'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { saveOnboardingData } from '@/lib/actions/user';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// New Question Structure with Types
type QuestionType = 'choice' | 'text' | 'long_text';

interface Question {
    id: string;
    type: QuestionType;
    question: string;
    options?: string[]; // Only for 'choice'
    placeholder?: string; // Only for 'text'/'long_text'
}

const ONBOARDING_QUESTIONS: Question[] = [
    {
        id: 'hearing',
        type: 'choice',
        question: 'How did you first hear about WebRep?',
        options: [
            'Google Search',
            'Social Media (LinkedIn / Twitter / Instagram)',
            'Friend or Colleague',
            'Online Community (Reddit / Discord / WhatsApp group)',
            'Other'
        ]
    },
    {
        id: 'referral',
        type: 'choice',
        question: 'Did anyone refer you to WebRep?',
        options: [
            'No, I found it on my own',
            'Yes, a friend',
            'Yes, a colleague',
            'Yes, a founder / startup contact',
            'Yes, an online post or article'
        ]
    },
    {
        id: 'goal',
        type: 'text', // NEW
        question: 'What is your main goal for using AI Agents?',
        placeholder: 'e.g. Automate support, Capture leads...'
    },
    {
        id: 'reason',
        type: 'choice',
        question: 'What was your main reason for signing up?',
        options: [
            'To explore AI agents for my website',
            'Lead generation',
            'Customer support automation',
            'Product curiosity / learning',
            'Just testing it out'
        ]
    },
    {
        id: 'requirements',
        type: 'long_text', // NEW
        question: 'Any specific requirements or integrations you need?',
        placeholder: 'e.g. I need HubSpot integration and specific custom styling...'
    },
    {
        id: 'role',
        type: 'choice',
        question: 'What best describes you?',
        options: [
            'Founder / Co-founder',
            'Developer',
            'Product Manager',
            'Student',
            'Other'
        ]
    },
    {
        id: 'value',
        type: 'choice',
        question: 'What would make WebRep more valuable for you?',
        options: [
            'Better UI/UX',
            'More AI customization',
            'Analytics & insights',
            'Faster setup',
            'Pricing clarity'
        ]
    }
];

export default function OnboardingFlowPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Store answers by question ID
    const [answers, setAnswers] = useState<Record<string, string>>({});

    // Direction for animation (1 for forward, -1 for backward)
    const [direction, setDirection] = useState(0);

    const currentQuestion = ONBOARDING_QUESTIONS[currentStep];
    const totalSteps = ONBOARDING_QUESTIONS.length;

    // Safety check
    if (!currentQuestion) return null;

    const handleAnswer = async (value: string) => {
        const newAnswers = { ...answers, [currentQuestion.id]: value };
        setAnswers(newAnswers);

        // For text inputs, we don't auto-advance in the render, 
        // the user clicks "Next". But for choices, we auto-advance.
        if (currentQuestion.type === 'choice') {
            if (currentStep < totalSteps - 1) {
                setTimeout(() => {
                    setDirection(1);
                    setCurrentStep(prev => prev + 1);
                }, 250);
            } else {
                setLoading(true);
                await submitAll(newAnswers);
            }
        }
    };

    const handleNext = async () => {
        if (!answers[currentQuestion.id]) return; // Prevent empty next

        if (currentStep < totalSteps - 1) {
            setDirection(1);
            setCurrentStep(prev => prev + 1);
        } else {
            setLoading(true);
            await submitAll(answers);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(prev => prev - 1);
        }
    };

    const submitAll = async (finalAnswers: Record<string, string>) => {
        try {
            const payload = {
                domain_occupation: finalAnswers['role'] || 'Other',
                project_idea: finalAnswers['reason'] || 'Exploring',
                referral_source: finalAnswers['referral'] || '',
                onboarding_answers: Object.entries(finalAnswers).map(([key, value]) => ({
                    question_id: key,
                    answer: value
                }))
            };

            await saveOnboardingData(payload);
            router.push('/agent-setup');
        } catch (error) {
            console.error(error);
            toast.error("Failed to save your preferences. Please try again.");
            setLoading(false);
        }
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 30 : -30,
            opacity: 0,
            scale: 0.98
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 30 : -30,
            opacity: 0,
            scale: 0.98
        })
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header / Logo */}
            <div className="mb-12 flex flex-col items-center z-10 space-y-4">
                <div className="font-bold text-xl flex items-center gap-2 tracking-tight">
                    <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">W</div>
                    WebRep
                </div>
                <div className="flex items-center gap-3 text-sm font-medium">
                    <div className="h-1 w-24 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((currentStep) / totalSteps) * 100}%` }} />
                    </div>
                    <span className="text-muted-foreground">Step {currentStep + 1} of {totalSteps}</span>
                </div>
            </div>

            {/* Main Card */}
            <div className="w-full max-w-lg relative z-10 perspective-1000">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 400, damping: 40 },
                            opacity: { duration: 0.2 }
                        }}
                        className="w-full"
                    >
                        <div className="w-full">
                            <h2 className="text-3xl font-bold text-center mb-8 text-foreground tracking-tight leading-tight">
                                {currentQuestion.question}
                            </h2>

                            <div className="space-y-4">
                                {currentQuestion.type === 'choice' && currentQuestion.options?.map((option, idx) => {
                                    const isSelected = answers[currentQuestion.id] === option;
                                    return (
                                        <motion.button
                                            key={option}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => !loading && handleAnswer(option)}
                                            disabled={loading}
                                            whileHover={{ scale: 1.01, backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                                            whileTap={{ scale: 0.99 }}
                                            className={cn(
                                                "w-full p-5 rounded-xl text-left text-base font-medium transition-all duration-200 flex items-center justify-between group border",
                                                isSelected
                                                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600 shadow-sm"
                                                    : "border-border bg-card text-foreground hover:border-blue-300 dark:hover:border-blue-700 shadow-sm hover:shadow-md"
                                            )}
                                        >
                                            <span>{option}</span>
                                            <div className={cn(
                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                                isSelected
                                                    ? "border-blue-600 bg-blue-600"
                                                    : "border-muted-foreground/30 group-hover:border-blue-400"
                                            )}>
                                                {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                        </motion.button>
                                    );
                                })}

                                {(currentQuestion.type === 'text' || currentQuestion.type === 'long_text') && (
                                    <div className="space-y-4">
                                        {currentQuestion.type === 'text' ? (
                                            <Input
                                                autoFocus
                                                placeholder={currentQuestion.placeholder}
                                                className="h-14 text-lg bg-card"
                                                value={answers[currentQuestion.id] || ''}
                                                onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && answers[currentQuestion.id]) {
                                                        handleNext();
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <Textarea
                                                autoFocus
                                                placeholder={currentQuestion.placeholder}
                                                className="min-h-[120px] text-lg bg-card p-4"
                                                value={answers[currentQuestion.id] || ''}
                                                onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                                            />
                                        )}

                                        <Button
                                            size="lg"
                                            className="w-full h-12 text-base"
                                            onClick={handleNext}
                                            disabled={!answers[currentQuestion.id] || loading}
                                        >
                                            {currentStep === totalSteps - 1 ? 'Finish' : 'Next'} <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="mt-8 flex items-center justify-start px-1">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={currentStep === 0 || loading}
                        className={cn("text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent", currentStep === 0 && "opacity-0 pointer-events-none")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>
            </div>

            {loading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-lg font-medium text-foreground animate-pulse">Setting up your profile...</p>
                </div>
            )}
        </div>
    );
}
