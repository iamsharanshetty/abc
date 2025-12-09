// tests/unit/validation.test.ts
import { describe, it, expect } from "vitest";
import {
  validateAndSanitizeUrl,
  validateMaxPages,
  validateBoolean,
} from "@/lib/utils/validation";
import { ValidationError } from "@/lib/errors/AppError";

describe("Validation Utilities", () => {
  describe("validateAndSanitizeUrl", () => {
    it("should accept valid HTTP URL", () => {
      const url = "http://example.com";
      expect(validateAndSanitizeUrl(url)).toBe("http://example.com/");
    });

    it("should accept valid HTTPS URL", () => {
      const url = "https://example.com";
      expect(validateAndSanitizeUrl(url)).toBe("https://example.com/");
    });

    it("should normalize URLs", () => {
      const url = "https://example.com/page?query=1";
      expect(validateAndSanitizeUrl(url)).toBe(
        "https://example.com/page?query=1"
      );
    });

    it("should reject empty URL", () => {
      expect(() => validateAndSanitizeUrl("")).toThrow(ValidationError);
    });

    it("should reject non-string input", () => {
      expect(() => validateAndSanitizeUrl(123 as any)).toThrow(ValidationError);
    });

    it("should reject invalid URL format", () => {
      expect(() => validateAndSanitizeUrl("not-a-url")).toThrow(
        ValidationError
      );
    });

    it("should reject localhost URLs", () => {
      expect(() => validateAndSanitizeUrl("http://localhost:3000")).toThrow(
        ValidationError
      );
    });

    it("should reject private IP addresses", () => {
      expect(() => validateAndSanitizeUrl("http://192.168.1.1")).toThrow(
        ValidationError
      );
      expect(() => validateAndSanitizeUrl("http://10.0.0.1")).toThrow(
        ValidationError
      );
      expect(() => validateAndSanitizeUrl("http://172.16.0.1")).toThrow(
        ValidationError
      );
    });

    it("should reject non-HTTP protocols", () => {
      expect(() => validateAndSanitizeUrl("ftp://example.com")).toThrow(
        ValidationError
      );
      expect(() => validateAndSanitizeUrl("file:///etc/passwd")).toThrow(
        ValidationError
      );
    });
  });

  describe("validateMaxPages", () => {
    it("should accept valid number", () => {
      expect(validateMaxPages(10)).toBe(10);
    });

    it("should accept string number", () => {
      expect(validateMaxPages("25")).toBe(25);
    });

    it("should use default if undefined", () => {
      expect(validateMaxPages(undefined)).toBe(50);
    });

    it("should reject negative numbers", () => {
      expect(() => validateMaxPages(-5)).toThrow(ValidationError);
    });

    it("should reject zero", () => {
      expect(() => validateMaxPages(0)).toThrow(ValidationError);
    });

    it("should reject numbers over 100", () => {
      expect(() => validateMaxPages(150)).toThrow(ValidationError);
    });

    it("should reject NaN", () => {
      expect(() => validateMaxPages("not-a-number")).toThrow(ValidationError);
    });
  });

  describe("validateBoolean", () => {
    it("should accept boolean true", () => {
      expect(validateBoolean(true)).toBe(true);
    });

    it("should accept boolean false", () => {
      expect(validateBoolean(false)).toBe(false);
    });

    it('should parse string "true"', () => {
      expect(validateBoolean("true")).toBe(true);
    });

    it('should parse string "false"', () => {
      expect(validateBoolean("false")).toBe(false);
    });

    it("should use default if undefined", () => {
      expect(validateBoolean(undefined, true)).toBe(true);
      expect(validateBoolean(undefined, false)).toBe(false);
    });

    it("should return default for invalid input", () => {
      expect(validateBoolean("invalid", true)).toBe(true);
      expect(validateBoolean(123, false)).toBe(false);
    });
  });
});
