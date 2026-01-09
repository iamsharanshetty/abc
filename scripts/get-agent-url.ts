
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    // Agent ID from logs
    const agentId = '8fdc1111-97cf-46d0-94c7-6c3e075e19ee';

    const { data, error } = await supabase
        .from('agents')
        .select('name, settings')
        .eq('id', agentId)
        .single();

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Agent:", data.name);
    console.log("Settings:", JSON.stringify(data.settings, null, 2));
}

main();
