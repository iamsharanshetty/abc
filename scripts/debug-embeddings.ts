
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('Fetching last 5 embeddings...');

    const { data, error } = await supabase
        .from('website_embeddings')
        .select('website_url, page_url, content')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching embeddings:', error);
        return;
    }

    if (data.length === 0) {
        console.log('No embeddings found.');
        return;
    }

    data.forEach((row, i) => {
        console.log(`\n--- [${i + 1}] ${row.website_url} (${row.page_url}) ---`);
        console.log(row.content.substring(0, 500) + '...');
    });
}

main();
