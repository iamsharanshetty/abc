
import { getAgents } from '@/lib/actions/agents';
import IntegrationsClient from "@/components/integrations/IntegrationsClient";

export default async function IntegrationsPage() {
    const agents = await getAgents();
    return <IntegrationsClient initialAgents={agents as any[]} />;
}
