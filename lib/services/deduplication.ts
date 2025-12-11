// lib/services/deduplication.ts
import crypto from "crypto";
import { logger } from "@/lib/utils/logger";

interface PageFingerprint {
  url: string;
  contentHash: string;
  titleHash: string;
  length: number;
}

/**
 * Service for detecting and handling duplicate content across pages
 */
export class DeduplicationService {
  private fingerprints: Map<string, PageFingerprint> = new Map();
  private duplicateCount: number = 0;

  /**
   * Create a hash of content for comparison
   */
  private createHash(content: string): string {
    return crypto
      .createHash("sha256")
      .update(content.toLowerCase().replace(/\s+/g, " ").trim())
      .digest("hex");
  }

  /**
   * Create a fingerprint for a page
   */
  private createFingerprint(
    url: string,
    title: string,
    content: string
  ): PageFingerprint {
    return {
      url,
      contentHash: this.createHash(content),
      titleHash: this.createHash(title),
      length: content.length,
    };
  }

  /**
   * Calculate similarity between two pieces of content
   */
  private calculateSimilarity(
    hash1: string,
    hash2: string,
    length1: number,
    length2: number
  ): number {
    // If hashes are identical, 100% similar
    if (hash1 === hash2) {
      return 1.0;
    }

    // If lengths are very different, likely not similar
    const lengthRatio = Math.min(length1, length2) / Math.max(length1, length2);
    if (lengthRatio < 0.8) {
      return 0;
    }

    // For now, we'll use a simple approach
    // In production, you might want to use more sophisticated algorithms
    return 0;
  }

  /**
   * Check if a page is a duplicate or near-duplicate
   */
  isDuplicate(
    url: string,
    title: string,
    content: string,
    threshold: number = 0.95
  ): boolean {
    const fingerprint = this.createFingerprint(url, title, content);

    // Check against existing fingerprints
    for (const [
      existingUrl,
      existingFingerprint,
    ] of this.fingerprints.entries()) {
      // Skip checking against itself
      if (existingUrl === url) {
        continue;
      }

      // Check if content is very similar
      const similarity = this.calculateSimilarity(
        fingerprint.contentHash,
        existingFingerprint.contentHash,
        fingerprint.length,
        existingFingerprint.length
      );

      if (similarity >= threshold) {
        this.duplicateCount++;
        logger.info("Duplicate content detected", {
          url,
          duplicateOf: existingUrl,
          similarity: Math.round(similarity * 100) + "%",
        });
        return true;
      }

      // Also check for exact title matches (often indicates duplicate pages)
      if (
        fingerprint.titleHash === existingFingerprint.titleHash &&
        Math.abs(fingerprint.length - existingFingerprint.length) < 100
      ) {
        this.duplicateCount++;
        logger.info("Duplicate page detected (same title)", {
          url,
          duplicateOf: existingUrl,
          title,
        });
        return true;
      }
    }

    // Not a duplicate, store the fingerprint
    this.fingerprints.set(url, fingerprint);
    return false;
  }

  /**
   * Get deduplication statistics
   */
  getStats() {
    return {
      uniquePages: this.fingerprints.size,
      duplicatesFound: this.duplicateCount,
      duplicateRate:
        this.fingerprints.size > 0
          ? Math.round(
              (this.duplicateCount /
                (this.fingerprints.size + this.duplicateCount)) *
                100
            )
          : 0,
    };
  }

  /**
   * Reset the service
   */
  reset() {
    this.fingerprints.clear();
    this.duplicateCount = 0;
  }
}
