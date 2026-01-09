
import { createClient } from "@supabase/supabase-js";
import { Database } from "../database.types";
import { logger } from "@/lib/utils/logger";

type AnalyticsEvent = Database["public"]["Tables"]["analytics_events"]["Insert"];

export class AnalyticsService {
    /**
     * Log a new analytics event
     */
    static async logEvent(
        eventType: string,
        data: {
            sessionId?: string;
            userId?: string;
            agentId?: string;
            websiteUrl?: string;
            metadata?: Record<string, any>;
        }
    ) {
        try {
            // Use service role key to bypass RLS policies for analytics
            const supabase = createClient<Database>(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            // Sanitize metadata to ensure no PII is accidentally logged without consent
            // (This is a basic implementation, customize as needed)
            const sanitizedMetadata = data.metadata ? { ...data.metadata } : null;

            const event: AnalyticsEvent = {
                event_type: eventType,
                session_id: data.sessionId,
                user_id: data.userId,
                agent_id: data.agentId,
                website_url: data.websiteUrl,
                metadata: sanitizedMetadata,
            };

            const { error } = await supabase.from("analytics_events").insert(event as any);

            if (error) {
                logger.error("Failed to log analytics event", { error, event });
            } else {
                logger.debug("Logged analytics event", { eventType });
            }
        } catch (error) {
            logger.error("Error in AnalyticsService", { error });
        }
    }
}
