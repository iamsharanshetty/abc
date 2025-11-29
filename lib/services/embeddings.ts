// lib/services/embeddings.ts
import OpenAI from "openai";
import { config } from "../config";
import {
  supabase,
  WebsiteEmbeddingInsert,
  EmbeddingMetadata,
  handleSupabaseError,
} from "../supabase";
import { withRateLimit } from "./rateLimiter";

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export class EmbeddingService {
  /**
   * Generate embedding with retry logic and rate limiting
   */
  async generateEmbedding(text: string, retryCount = 0): Promise<number[]> {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error("Cannot generate embedding for empty text");
    }

    if (text.length > config.ingestion.maxContentLength) {
      throw new Error(
        `Text length (${text.length}) exceeds maximum (${config.ingestion.maxContentLength})`
      );
    }

    try {
      // Use rate limiter
      const embedding = await withRateLimit(async () => {
        const response = await openai.embeddings.create({
          model: config.openai.embeddingModel,
          input: text,
        });
        return response.data[0].embedding;
      });

      return embedding;
    } catch (error) {
      // Retry logic for transient errors
      if (retryCount < config.openai.maxRetries) {
        const isRetryable = this.isRetryableError(error);

        if (isRetryable) {
          const delay = config.openai.retryDelay * Math.pow(2, retryCount); // Exponential backoff
          console.warn(
            `Retrying embedding generation (attempt ${retryCount + 1}/${
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
    // Retry on rate limits, timeouts, and network errors
    const retryableStatuses = [429, 500, 502, 503, 504];
    const status = error?.status || error?.response?.status;

    return (
      retryableStatuses.includes(status) ||
      error?.code === "ECONNRESET" ||
      error?.code === "ETIMEDOUT"
    );
  }

  /**
   * Improved chunking with overlap
   */
  private chunkText(text: string): string[] {
    const { chunkSize, chunkOverlap } = config.ingestion;

    if (text.length <= chunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    // Split into sentences (improved regex)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    let currentChunk = "";

    for (const sentence of sentences) {
      // If adding this sentence would exceed chunk size
      if ((currentChunk + sentence).length > chunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());

          // Add overlap from the end of current chunk
          const overlapText = currentChunk.slice(-chunkOverlap);
          currentChunk = overlapText + sentence;
        } else {
          // Single sentence is longer than chunk size
          // Split it by character count
          for (let i = 0; i < sentence.length; i += chunkSize - chunkOverlap) {
            const chunk = sentence.slice(i, i + chunkSize);
            if (chunk.trim()) {
              chunks.push(chunk.trim());
            }
          }
          currentChunk = "";
        }
      } else {
        currentChunk += sentence;
      }
    }

    // Add the last chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Generate embeddings in batches
   */
  private async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    // Process in smaller batches to avoid memory issues
    for (let i = 0; i < texts.length; i += config.openai.batchSize) {
      const batch = texts.slice(i, i + config.openai.batchSize);

      // Generate embeddings for this batch concurrently
      const batchEmbeddings = await Promise.all(
        batch.map((text) => this.generateEmbedding(text))
      );

      embeddings.push(...batchEmbeddings);

      // Log progress
      console.log(`Generated embeddings: ${embeddings.length}/${texts.length}`);
    }

    return embeddings;
  }

  /**
   * Store embeddings with transaction handling
   */
  async storeEmbeddings(
    websiteUrl: string,
    pageUrl: string,
    content: string,
    metadata?: Omit<EmbeddingMetadata, "chunkIndex" | "totalChunks">
  ): Promise<void> {
    // Validate input
    if (!websiteUrl || !pageUrl || !content) {
      throw new Error("Missing required parameters for storing embeddings");
    }

    try {
      // Split content into chunks
      const chunks = this.chunkText(content);
      console.log(`Split content into ${chunks.length} chunks for ${pageUrl}`);

      // Generate embeddings for all chunks
      const embeddings = await this.generateEmbeddingsBatch(chunks);

      // Prepare records with enhanced metadata
      const records: WebsiteEmbeddingInsert[] = chunks.map((chunk, index) => ({
        website_url: websiteUrl,
        page_url: pageUrl,
        content_section: chunk,
        embedding: embeddings[index],
        metadata: {
          ...metadata,
          scrapedAt: metadata?.scrapedAt || new Date().toISOString(),
          contentLength: chunk.length,
          chunkIndex: index,
          totalChunks: chunks.length,
        },
      }));

      // Insert in batches to avoid hitting limits
      const batchSize = config.supabase.maxBatchSize;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        // Type assertion to help TypeScript understand the type
        const { error } = await supabase
          .from("website_embeddings")
          .insert(batch as any); // Temporary workaround for Supabase type issue

        if (error) {
          handleSupabaseError(error);
        }

        console.log(
          `Stored embeddings batch: ${Math.min(
            i + batchSize,
            records.length
          )}/${records.length}`
        );
      }

      console.log(
        `✓ Successfully stored ${records.length} embeddings for ${pageUrl}`
      );
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
      const { error } = await supabase
        .from("website_embeddings")
        .delete()
        .eq("website_url", websiteUrl);

      if (error) {
        handleSupabaseError(error);
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
