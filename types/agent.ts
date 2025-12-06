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

export const SUGGESTED_FUNCTIONS = [
    "Product Q&A",
    "Ticket Creation",
    "Pricing Info",
    "Troubleshooting",
]

export const RECOMMENDED_AGENT_TYPE = {
    role: "support" as AgentRole,
    reason: "Based on your website content, a Customer Support agent is best suited to handle inquiries found on your FAQ and Contact pages.",
}
