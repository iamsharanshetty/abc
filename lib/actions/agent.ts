'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const CreateAgentSchema = z.object({
    name: z.string().min(1, "Name is required"),
    url: z.string().url("Invalid URL provided"),
    role: z.string().min(1, "Role is required"),
})

export type CreateAgentData = z.infer<typeof CreateAgentSchema>

export async function createAgent(data: CreateAgentData) {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error('Unauthorized')
    }

    // Validate data
    const result = CreateAgentSchema.safeParse(data)
    if (!result.success) {
        throw new Error('Invalid data provided')
    }

    // Insert agent
    const { data: agent, error } = await supabase
        .from('agents')
        .insert({
            user_id: user.id,
            name: data.name,
            role: data.role,
            status: 'active',
            settings: {
                website_url: data.url
            }
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating agent:', error)
        throw new Error('Failed to create agent')
    }

    return { success: true, agentId: agent.id }
}
