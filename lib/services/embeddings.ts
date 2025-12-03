//  OPTIMIZED VERSION
import OpenAI from "openai";
import { config } from "../config";
import { createClient } from "../supabase/server";
import type { Database } from "../database.types";
import { withRateLimit } from "./rateLimiter";

type EmbeddingMetadata =
  Database["public"]["Tables"]["website_embeddings"]["Row"]["metadata"];
type WebsiteEmbeddingInsert =
  Database["public"]["Tables"]["website_embeddings"]["Insert"];

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export class EmbeddingService {
  /**
   * OPTIMIZATION 1: Smart chunking based on semantic boundaries
   */
  private chunkTextSmartly(text: string): string[] {
    const { chunkSize, chunkOverlap } = config.ingestion;

    if (text.length <= chunkSize) {
      return [text];
    }

    const chunks: string[] = [];

    // Split by paragraphs first (semantic boundaries)
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = "";

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();

      // If paragraph alone is too long, split it by sentences
      if (trimmedParagraph.length > chunkSize) {
        // Save current chunk if exists
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = "";
        }

        // Split long paragraph into sentences
        const sentences = trimmedParagraph.match(/[^.!?]+[.!?]+/g) || [
          trimmedParagraph,
        ];
        let paragraphChunk = "";

        for (const sentence of sentences) {
          if ((paragraphChunk + sentence).length > chunkSize) {
            if (paragraphChunk) {
              chunks.push(paragraphChunk.trim());
            }
            paragraphChunk = sentence;
          } else {
            paragraphChunk += sentence;
          }
        }

        if (paragraphChunk) {
          currentChunk = paragraphChunk;
        }
      } else {
        // Try to add paragraph to current chunk
        if ((currentChunk + "\n\n" + trimmedParagraph).length > chunkSize) {
          // Current chunk is full, save it
          if (currentChunk) {
            chunks.push(currentChunk.trim());
          }

          // Add overlap from end of previous chunk
          const words = currentChunk.split(" ");
          const overlapWords = words.slice(-Math.ceil(chunkOverlap / 5));
          currentChunk = overlapWords.join(" ") + "\n\n" + trimmedParagraph;
        } else {
          currentChunk += (currentChunk ? "\n\n" : "") + trimmedParagraph;
        }
      }
    }

    // Add the last chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * OPTIMIZATION 2: Deduplicate similar chunks to reduce redundancy
   */
  private deduplicateChunks(chunks: string[]): string[] {
    const unique: string[] = [];
    const seen = new Set<string>();

    for (const chunk of chunks) {
      // Create a fingerprint of the chunk
      const fingerprint = this.createChunkFingerprint(chunk);

      if (!seen.has(fingerprint)) {
        seen.add(fingerprint);
        unique.push(chunk);
      } else {
        console.log(`  Skipped duplicate chunk`);
      }
    }

    return unique;
  }

  /**
   * Create a simple fingerprint for chunk comparison
   */
  private createChunkFingerprint(text: string): string {
    // Normalize and create a simple hash
    const normalized = text
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 200);

    return normalized;
  }

  /**
   * OPTIMIZATION 3: Filter out low-value chunks
   */
  private filterLowValueChunks(chunks: string[]): string[] {
    return chunks.filter((chunk) => {
      const wordCount = chunk.split(/\s+/).length;

      // Skip very short chunks (less than 20 words)
      if (wordCount < 20) {
        return false;
      }

      // Skip chunks that are mostly boilerplate
      const boilerplatePatterns = [
        /^(copyright|all rights reserved)/i,
        /^(terms of service|privacy policy)/i,
        /^(cookie|cookies|we use cookies)/i,
        /^(subscribe|sign up|newsletter)/i,
      ];

      for (const pattern of boilerplatePatterns) {
        if (pattern.test(chunk)) {
          return false;
        }
      }

      // Check for meaningful content (should have sentence structure)
      const hasSentences = /[.!?]/.test(chunk);
      const hasWords = wordCount >= 20;

      return hasSentences && hasWords;
    });
  }

  /**
   * Generate embedding with retry logic and rate limiting
   */
  async generateEmbedding(text: string, retryCount = 0): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error("Cannot generate embedding for empty text");
    }

    if (text.length > config.ingestion.maxContentLength) {
      throw new Error(
        `Text length (${text.length}) exceeds maximum (${config.ingestion.maxContentLength})`
      );
    }

    try {
      const embedding = await withRateLimit(async () => {
        const response = await openai.embeddings.create({
          model: config.openai.embeddingModel,
          input: text,
        });
        return response.data[0].embedding;
      });

      return embedding;
    } catch (error) {
      if (retryCount < config.openai.maxRetries) {
        const isRetryable = this.isRetryableError(error);

        if (isRetryable) {
          const delay = config.openai.retryDelay * Math.pow(2, retryCount);
          console.warn(
            `  Retrying embedding generation (attempt ${retryCount + 1}/${
              config.openai.maxRetries
            }) after ${delay}ms`
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.generateEmbedding(text, retryCount + 1);
        }
      }

      console.error("Error generating embedding:", error);
      throw new Error(
        `Failed to generate embedding: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableStatuses = [429, 500, 502, 503, 504];
    const status = error?.status || error?.response?.status;

    return (
      retryableStatuses.includes(status) ||
      error?.code === "ECONNRESET" ||
      error?.code === "ETIMEDOUT"
    );
  }

  /**
   * OPTIMIZATION 4: Batch embedding generation
   */
  private async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += config.openai.batchSize) {
      const batch = texts.slice(i, i + config.openai.batchSize);

      const batchEmbeddings = await Promise.all(
        batch.map((text) => this.generateEmbedding(text))
      );

      embeddings.push(...batchEmbeddings);

      console.log(
        `  Generated embeddings: ${embeddings.length}/${texts.length}`
      );
    }

    return embeddings;
  }

  /**
   * Store embeddings with FULL OPTIMIZATION pipeline
   */
  async storeEmbeddings(
    websiteUrl: string,
    pageUrl: string,
    content: string,
    metadata?: { title?: string; scrapedAt?: string }
  ): Promise<{
    chunksCreated: number;
    chunksSaved: number;
    chunksSkipped: number;
  }> {
    if (!websiteUrl || !pageUrl || !content) {
      throw new Error("Missing required parameters for storing embeddings");
    }

    try {
      console.log(`\n  Processing: ${pageUrl}`);

      // STEP 1: Smart chunking
      console.log(`  1. Chunking content...`);
      const chunks = this.chunkTextSmartly(content);
      console.log(`     Created ${chunks.length} initial chunks`);

      // STEP 2: Deduplicate
      console.log(`  2. Deduplicating chunks...`);
      const uniqueChunks = this.deduplicateChunks(chunks);
      console.log(`     ${uniqueChunks.length} unique chunks`);

      // STEP 3: Filter low-value chunks
      console.log(`  3. Filtering low-value chunks...`);
      const valuableChunks = this.filterLowValueChunks(uniqueChunks);
      console.log(`     ${valuableChunks.length} valuable chunks`);

      if (valuableChunks.length === 0) {
        console.log(`  ✗ No valuable content to embed`);
        return {
          chunksCreated: chunks.length,
          chunksSaved: 0,
          chunksSkipped: chunks.length,
        };
      }

      // STEP 4: Generate embeddings
      console.log(`  4. Generating embeddings...`);
      const embeddings = await this.generateEmbeddingsBatch(valuableChunks);

      // STEP 5: Store in database
      console.log(`  5. Storing in database...`);
      const supabase = await createClient();

      const records: WebsiteEmbeddingInsert[] = valuableChunks.map(
        (chunk, index) => ({
          website_url: websiteUrl,
          page_url: pageUrl,
          content_section: chunk,
          embedding: embeddings[index] as any,
          metadata: {
            title: metadata?.title,
            scrapedAt: metadata?.scrapedAt || new Date().toISOString(),
            contentLength: chunk.length,
            chunkIndex: index,
            totalChunks: valuableChunks.length,
            wordCount: chunk.split(/\s+/).length,
          } as any,
        })
      );

      // Insert in batches
      const batchSize = config.supabase.maxBatchSize;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        const { error } = await supabase
          .from("website_embeddings")
          .insert(batch);

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }
      }

      const result = {
        chunksCreated: chunks.length,
        chunksSaved: valuableChunks.length,
        chunksSkipped: chunks.length - valuableChunks.length,
      };

      console.log(`  ✓ Saved ${result.chunksSaved} embeddings`);
      console.log(
        `  💰 Cost saved: ~${Math.round(
          (result.chunksSkipped / chunks.length) * 100
        )}% reduction`
      );

      return result;
    } catch (error) {
      console.error(`Error storing embeddings for ${pageUrl}:`, error);
      throw new Error(
        `Failed to store embeddings: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Delete embeddings with error handling
   */
  async deleteWebsiteEmbeddings(websiteUrl: string): Promise<void> {
    if (!websiteUrl) {
      throw new Error("Website URL is required for deletion");
    }

    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("website_embeddings")
        .delete()
        .eq("website_url", websiteUrl);

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      console.log(`✓ Successfully deleted embeddings for ${websiteUrl}`);
    } catch (error) {
      console.error(`Error deleting embeddings for ${websiteUrl}:`, error);
      throw new Error(
        `Failed to delete embeddings: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
