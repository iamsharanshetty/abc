
import { AnalyticsService } from "../lib/services/analytics";
import { config } from "dotenv";

// Load env vars
config({ path: ".env.local" });

async function main() {
    console.log("Testing AnalyticsService...");

    try {
        await AnalyticsService.logEvent("test_event", {
            sessionId: "test-session-123",
            userId: undefined, // Test without user
            metadata: {
                source: "verification_script",
                timestamp: new Date().toISOString(),
            },
        });

        console.log("✅ Successfully logged test event");

        // Test Chat Logging
        await AnalyticsService.logEvent("message_sent", {
            sessionId: "session-abc",
            metadata: {
                role: "user",
                contentLength: 42,
                simulated: true,
            },
        });
        console.log("✅ Successfully logged simulated chat event");

    } catch (error) {
        console.error("❌ Failed to log event:", error);
        process.exit(1);
    }
}

main();
