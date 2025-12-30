'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const ProfileSchema = z.object({
    domain_occupation: z.string().min(1, "Domain/Occupation is required"),
    project_idea: z.string().min(1, "Project idea is required"),
    referral_source: z.string().optional(),
    onboarding_answers: z.array(z.object({
        question_id: z.string(),
        answer: z.string()
    })).optional()
})

export type ProfileData = z.infer<typeof ProfileSchema>

export async function saveOnboardingData(data: ProfileData) {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error('Unauthorized')
    }

    // Validate data
    const result = ProfileSchema.safeParse(data)
    if (!result.success) {
        throw new Error('Invalid data provided')
    }

    // Update profile
    const { error } = await (supabase
        .from('profiles') as any)
        .update({
            domain_occupation: data.domain_occupation,
            project_idea: data.project_idea,
            referral_source: data.referral_source,
            onboarding_answers: data.onboarding_answers,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (error) {
        console.error('Error saving profile:', error)
        throw new Error('Failed to save profile data')
    }

    return { success: true }
}
