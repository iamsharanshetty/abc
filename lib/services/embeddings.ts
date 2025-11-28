// lib/services/embeddings.ts
import OpenAI from "openai";
import { config } from "../config";
import { supabase, WebsiteEmbedding } from "../supabase";

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export class EmbeddingService {
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: config.openai.embeddingModel,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error("Failed to generate embedding");
    }
  }

  private chunkText(text: string, maxLength: number = 1000): string[] {
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentChunk = "";

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  async storeEmbeddings(
    websiteUrl: string,
    pageUrl: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Split content into chunks
    const chunks = this.chunkText(content);

    // Generate embeddings for each chunk
    const embeddingPromises = chunks.map(async (chunk) => {
      const embedding = await this.generateEmbedding(chunk);

      const record: WebsiteEmbedding = {
        website_url: websiteUrl,
        page_url: pageUrl,
        content_section: chunk,
        embedding,
        metadata,
      };

      return record;
    });

    const embeddings = await Promise.all(embeddingPromises);

    // Store in Supabase
    const { error } = await supabase
      .from("website_embeddings")
      .insert(embeddings);

    if (error) {
      console.error("Error storing embeddings:", error);
      throw new Error("Failed to store embeddings");
    }
  }

  async deleteWebsiteEmbeddings(websiteUrl: string): Promise<void> {
    const { error } = await supabase
      .from("website_embeddings")
      .delete()
      .eq("website_url", websiteUrl);

    if (error) {
      console.error("Error deleting embeddings:", error);
      throw new Error("Failed to delete embeddings");
    }
  }
}
