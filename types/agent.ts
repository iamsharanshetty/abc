export interface AgentSettings {
    name: string
    persona: string
    summary: string
    role: string
    url: string
}

export interface CreateAgentResponse {
    success: boolean
    agentId?: string
    message?: string
    settings?: AgentSettings
}

export const AGENT_ROLES = [
    { id: "sales", label: "Sales Representative", description: "Focuses on converting leads and closing deals." },
    { id: "support", label: "Customer Support", description: "Handles inquiries and resolves issues." },
    { id: "custom", label: "Custom Persona", description: "Tailored to your specific needs." },
] as const

export type AgentRole = typeof AGENT_ROLES[number]["id"]
