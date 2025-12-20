import { ChatWidget } from '@/components/chat/ChatWidget';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export const metadata = {
    title: 'Chat Widget | WebRep',
    robots: {
        index: false,
        follow: false,
    },
};

export default async function EmbedChatPage({ params }: { params: Promise<{ agentId: string }> }) {
    const { agentId } = await params;
    const supabase = await createClient();

    // Fetch agent details to customize the widget
    // If agentId is "demo", we use mock data
    let agent = null;

    if (agentId !== 'demo') {
        const { data } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .single();
        agent = data;
    } else {
        // Mock agent for demo
        agent = {
            id: 'demo',
            name: 'Demo Agent',
            settings: {
                primaryColor: '#2563eb', // Blue
                websiteUrl: 'https://example.com'
            }
        };
    }

    if (!agent && agentId !== 'demo') {
        return notFound();
    }

    // Determine config
    const primaryColor = (agent?.settings as any)?.primaryColor || '#2563eb';
    const title = agent?.name || 'WebRep Assistant';
    const websiteUrl = (agent?.settings as any)?.url;

    return (
        <div className="w-full h-screen bg-transparent">
            {/* The widget itself handles its positioning (fixed bottom right) */}
            {/* When embedded in an iframe on the customer site, the iframe should be sized properly 
                OR the iframe should be full screen transparent. 
                Common pattern: The script injects an iframe that is small (just button) 
                and expands it when clicked. 
                
                For this prototype, we assume the iframe is full-screen fixed on top of the host site 
                with pointer-events handling transparency. 
            */}
            <ChatWidget
                agentId={agentId}
                websiteUrl={websiteUrl}
                primaryColor={primaryColor}
                title={title}
            />
        </div>
    );
}
