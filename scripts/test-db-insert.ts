
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing env vars");
    console.log("URL:", supabaseUrl);
    console.log("Service Key:", supabaseServiceKey ? "Set (length " + supabaseServiceKey.length + ")" : "Not Setup");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log("🚀 Testing DB access...");
    const testId = crypto.randomUUID();
    const testUrl = "https://test-insert.com";

    // 1. Try Insert
    console.log("Attempting insert...");
    const { data, error } = await supabase.from('website_embeddings').insert({
        id: testId,
        website_url: testUrl,
        page_url: testUrl + "/page",
        content: "Test content from script",
        // 0.01 repeated 1536 times
        embedding: Array(1536).fill(0.01),
        content_section: "Test Section",
        metadata: { test: true }
    }).select();

    if (error) {
        console.error("❌ Insert Failed:", error);
        return;
    }

    console.log("✅ Insert Success! ID:", data[0].id);

    // 2. Try Select
    console.log("Attempting read...");
    const { data: readData, error: readError } = await supabase
        .from('website_embeddings')
        .select('*')
        .eq('id', testId)
        .single();

    if (readError) {
        console.error("❌ Read Failed:", readError);
    } else {
        console.log("✅ Read Success:", readData.content);
    }

    // 3. Cleanup
    console.log("Cleaning up...");
    await supabase.from('website_embeddings').delete().eq('id', testId);
    console.log("✅ Cleanup done.");
}

main();
