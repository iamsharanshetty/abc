
import { BrowserScraper } from '../lib/services/browserScraper';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
    const url = process.argv[2] || 'https://www.example.com';
    console.log(`Testing scraper on: ${url}`);

    try {
        const scraper = new BrowserScraper(url, 1);
        const pages = await scraper.scrapeWebsite();

        console.log(`Found ${pages.length} pages`);

        pages.forEach((p, i) => {
            console.log(`\n--- Page ${i + 1}: ${p.title} ---`);
            console.log(`URL: ${p.url}`);
            console.log(`Content Length: ${p.content.length}`);
            console.log(`Quality Score: ${p.qualityScore}`);
            console.log(`Sample: ${p.content.substring(0, 100)}...`);
        });

    } catch (error) {
        console.error("Scraper failed:", error);
    }
}

main();
