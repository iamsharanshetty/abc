import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { config } from '@/lib/config';

// Create an OpenAI provider instance
const openai = createOpenAI({
    apiKey: config.openai.apiKey,
});

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { messages, agentContext, systemPrompt } = await req.json();



        if (!messages || !Array.isArray(messages)) {
            throw new Error('Messages array is required');
        }

        // Construct the system message
        // If a specific system prompt is provided (e.g. from agent settings), use it
        // Otherwise use a default or the provided context
        const initialSystemMessage = systemPrompt ||
            `You are an AI assistant. ${agentContext ? `Context: ${agentContext}` : ''}`;

        const coreMessages = messages.map((m: any) => ({
            role: m.role,
            content: m.content,
        }));

        const result = await streamText({
            model: openai('gpt-4o'),
            system: initialSystemMessage,
            messages: coreMessages,
            temperature: 0.7,
            onFinish: async (event) => {
                try {
                    const { AnalyticsService } = await import('@/lib/services/analytics');
                    await AnalyticsService.logEvent('message_sent', {
                        // userId cannot be easily retrieved in edge runtime with default supabase helper
                        // assuming anonymous or client-side context tracking for now
                        websiteUrl: undefined, // Context dependent
                        metadata: {
                            role: 'assistant',
                            contentLength: event.text.length,
                            totalTokens: event.usage.totalTokens,
                        }
                    });
                } catch (e) {
                    console.error('Failed to log analytics:', e);
                }
            }
        });

        // Log user message immediately
        const lastUserMessage = coreMessages[coreMessages.length - 1];
        if (lastUserMessage && lastUserMessage.role === 'user') {
            // Fire and forget - don't await to avoid blocking
            (async () => {
                try {
                    const { AnalyticsService } = await import('@/lib/services/analytics');
                    await AnalyticsService.logEvent('message_sent', {
                        metadata: {
                            role: 'user',
                            contentLength: lastUserMessage.content.length,
                        }
                    });
                } catch (e) {
                    console.error('Failed to log user message analytics:', e);
                }
            })();
        }

        return result.toTextStreamResponse();
    } catch (error) {
        console.error('Chat API Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
