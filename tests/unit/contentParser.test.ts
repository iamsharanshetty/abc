// tests/unit/contentParser.test.ts
import { describe, it, expect } from "vitest";
import { ContentParser } from "@/lib/services/contentParser";

describe("ContentParser", () => {
  const parser = new ContentParser();

  describe("parse", () => {
    it("should extract title from h1", () => {
      const html = `
        <html>
          <body>
            <h1>Test Title</h1>
            <p>Some content</p>
          </body>
        </html>
      `;

      const result = parser.parse(html, "https://example.com");
      expect(result.title).toBe("Test Title");
    });

    it("should extract main content", () => {
      const html = `
        <html>
          <body>
            <nav>Navigation</nav>
            <article>
              <h1>Article Title</h1>
              <p>Main content paragraph</p>
            </article>
            <footer>Footer content</footer>
          </body>
        </html>
      `;

      const result = parser.parse(html, "https://example.com");
      expect(result.mainContent).toContain("Main content paragraph");
      expect(result.mainContent).not.toContain("Navigation");
      expect(result.mainContent).not.toContain("Footer content");
    });

    it("should extract headings with hierarchy", () => {
      const html = `
        <html>
          <body>
            <h1>Heading 1</h1>
            <h2>Heading 2</h2>
            <h3>Heading 3</h3>
          </body>
        </html>
      `;

      const result = parser.parse(html, "https://example.com");
      expect(result.headings).toHaveLength(3);
      expect(result.headings[0]).toEqual({ level: 1, text: "Heading 1" });
      expect(result.headings[1]).toEqual({ level: 2, text: "Heading 2" });
    });

    it("should calculate word count", () => {
      const html = `
        <html>
          <body>
            <p>This is a test sentence with ten words here.</p>
          </body>
        </html>
      `;

      const result = parser.parse(html, "https://example.com");
      expect(result.metadata.wordCount).toBeGreaterThan(0);
    });

    it("should detect boilerplate content", () => {
      const html = `
        <html>
          <body>
            <p>Copyright © 2024. All rights reserved.</p>
            <p>This is actual content that should be included.</p>
          </body>
        </html>
      `;

      const result = parser.parse(html, "https://example.com");
      expect(result.metadata.hasBoilerplate).toBe(true);
    });
  });

  describe("calculateQualityScore", () => {
    it("should give high score to quality content", () => {
      const content = {
        title: "Good Title",
        mainContent:
          "This is substantial content with multiple sentences. ".repeat(50),
        headings: [
          { level: 1, text: "Heading 1" },
          { level: 2, text: "Heading 2" },
          { level: 2, text: "Heading 3" },
        ],
        paragraphs: [
          "Paragraph 1",
          "Paragraph 2",
          "Paragraph 3",
          "Paragraph 4",
          "Paragraph 5",
        ],
        metadata: {
          wordCount: 300,
          estimatedReadTime: 2,
          uniqueWordRatio: 0.7,
          hasBoilerplate: false,
        },
      };

      const score = parser.calculateQualityScore(content);
      expect(score).toBeGreaterThan(70);
    });

    it("should give low score to poor content", () => {
      const content = {
        title: "",
        mainContent: "Short content.",
        headings: [],
        paragraphs: [],
        metadata: {
          wordCount: 5,
          estimatedReadTime: 0,
          uniqueWordRatio: 0.2,
          hasBoilerplate: true,
        },
      };

      const score = parser.calculateQualityScore(content);
      expect(score).toBeLessThan(50);
    });
  });
});
