import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { config } from '@/lib/config';

// Create an OpenAI provider instance
const openai = createOpenAI({
    apiKey: config.openai.apiKey,
});

export const maxDuration = 30;


import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        if (!process.env.OPENAI_API_KEY && !process.env.ALENTA_OPENAI_KEY) {
            console.error("❌ Missing OpenAI API Key");
            return new Response("OpenAI API Key is missing on the server.", { status: 401 });
        }

        // Parse body with agentId
        const { messages, agentId, websiteUrl, systemPrompt } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            throw new Error('Messages array is required');
        }

        // Fetch Agent Context if agentId is provided
        const lastUserMessage = messages[messages.length - 1];
        const userQuery = lastUserMessage.content;

        // RAG: Fetch relevant content
        let ragContext = "";
        let targetUrl = websiteUrl;
        let retrievedRole = "AI Assistant";
        let retrievedContext = "";

        if (agentId) {
            try {
                const supabase = await createClient();
                const { data: agent } = await supabase
                    .from('agents')
                    .select('role, settings')
                    .eq('id', agentId)
                    .single();

                if (agent) {
                    const agentData = agent as any;
                    retrievedRole = agentData.role || "Assistant";
                    const settings = agentData.settings as any;
                    // Build context from settings
                    if (settings?.description) retrievedContext += `Description: ${settings.description}\n`;
                    if (settings?.url) {
                        retrievedContext += `Source URL: ${settings.url}\n`;
                        targetUrl = settings.url; // Prefer agent setting for RAG
                    }
                    if (settings?.tone) retrievedContext += `Tone: ${settings.tone}\n`;
                }
            } catch (err) {
                console.warn("Failed to fetch agent context:", err);
            }
        }

        // Perform RAG search if we have a target URL and a query
        if (targetUrl && userQuery) {
            try {
                const { EmbeddingService } = await import('@/lib/services/embeddings');
                const embeddingService = new EmbeddingService();
                const knowledge = await embeddingService.findRelevantContent(userQuery, targetUrl);

                if (knowledge) {
                    ragContext = `\n\nRELEVANT KNOWLEDGE BASE CONTENT:\n${knowledge}\n\nINSTRUCTIONS:\n1. You are an expert on the content provided above. \n2. Answer the user's question ONLY using the Knowledge Base Content.\n3. If the answer is NOT in the Knowledge Base, say "I couldn't find that information in the website content" and then offer your best guess based on general knowledge, but clearly state it is a guess.\n4. Quote directly from the content when possible to be precise.`;
                }
            } catch (err) {
                console.error("RAG Search failed:", err);
            }
        }

        // Construct the system message
        const initialSystemMessage = systemPrompt ||
            `You are a ${retrievedRole}. \n${retrievedContext ? `Context:\n${retrievedContext}` : ''}${ragContext}\n\nBe helpful and concise.`;

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
                // Analytics logging (same as before)
                try {
                    const { AnalyticsService } = await import('@/lib/services/analytics');
                    await AnalyticsService.logEvent('message_sent', {
                        websiteUrl: websiteUrl,
                        agentId: agentId,
                        metadata: {
                            role: 'assistant',
                            content: event.text.slice(0, 500), // Log first 500 chars
                            contentLength: event.text.length,
                            totalTokens: event.usage.totalTokens,
                        }
                    });
                } catch (e) {
                    console.error('Failed to log analytics:', e);
                }
            }
        });

        // Log user message immediately (same as before)
        // ... (omitted for brevity, keeping existing analytics logic is fine but re-implementing here for completeness if needed, 
        // relying on previous implementation structure)

        const analyticsUserMessage = coreMessages[coreMessages.length - 1];
        if (analyticsUserMessage && analyticsUserMessage.role === 'user') {
            (async () => {
                try {
                    const { AnalyticsService } = await import('@/lib/services/analytics');
                    await AnalyticsService.logEvent('message_sent', {
                        agentId: agentId,
                        metadata: {
                            role: 'user',
                            content: analyticsUserMessage.content.slice(0, 500), // Log first 500 chars
                            contentLength: analyticsUserMessage.content.length,
                        }
                    });
                } catch (e) {
                    console.error('Failed to log user message analytics:', e);
                }
            })();
        }

        return result.toDataStreamResponse();
    } catch (error) {
        console.error('Chat API Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
