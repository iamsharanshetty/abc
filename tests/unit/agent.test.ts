// tests/unit/agent.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AgentService } from "@/lib/services/agentService";
import { PromptTemplateService } from "@/lib/services/promptTemplate";
import { ChatService } from "@/lib/services/chatService";

// Mock dependencies
vi.mock("@/lib/openai");
vi.mock("@/lib/supabase/server");
vi.mock("@/lib/utils/logger");

describe("AgentService", () => {
  let agent: AgentService;

  beforeEach(() => {
    agent = new AgentService({
      id: "test_agent_1",
      name: "Test Agent",
      websiteUrl: "https://example.com",
      role: "support",
      tone: "professional",
    });
  });

  describe("Initialization", () => {
    it("should initialize agent with system prompt", async () => {
      await agent.initialize();
      const history = agent.getConversationHistory();

      expect(history).toBeDefined();
      expect(agent).toBeDefined();
    });
  });

  describe("Message Processing", () => {
    it("should process user message and return response", async () => {
      await agent.initialize();

      // Mock ChatService
      vi.spyOn(ChatService, "generateResponse").mockResolvedValue({
        message: "Hello! How can I help you?",
        isLeadCapture: false,
        context: [],
      });

      const response = await agent.processMessage("Hi there!");

      expect(response).toBeDefined();
      expect(typeof response).toBe("string");
    });

    it("should reject empty messages", async () => {
      await agent.initialize();

      const response = await agent.processMessage("");

      expect(response).toContain("empty");
    });

    it("should reject very long messages", async () => {
      await agent.initialize();

      const longMessage = "a".repeat(3000);
      const response = await agent.processMessage(longMessage);

      expect(response).toContain("too long");
    });
  });

  describe("Lead Capture Flow", () => {
    it("should initiate lead capture when intent detected", async () => {
      await agent.initialize();

      vi.spyOn(ChatService, "generateResponse").mockResolvedValue({
        message: "I'd be happy to help with a demo!",
        isLeadCapture: true,
        context: [],
      });

      const response = await agent.processMessage("I want a demo");

      expect(response).toContain("name");
    });

    it("should validate email during lead capture", async () => {
      await agent.initialize();

      // Trigger lead capture
      vi.spyOn(ChatService, "generateResponse").mockResolvedValue({
        message: "Great!",
        isLeadCapture: true,
        context: [],
      });

      await agent.processMessage("I'm interested");
      await agent.processMessage("John Doe"); // Provide name

      // Try invalid email
      const response = await agent.processMessage("not-an-email");

      expect(response).toContain("valid email");
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      await agent.initialize();

      vi.spyOn(ChatService, "generateResponse").mockRejectedValue(
        new Error("API Error")
      );

      const response = await agent.processMessage("Test message");

      expect(response).toBeDefined();
      expect(response).not.toContain("Error");
      expect(response.length).toBeGreaterThan(0);
    });
  });

  describe("Conversation Management", () => {
    it("should maintain conversation history", async () => {
      await agent.initialize();

      vi.spyOn(ChatService, "generateResponse").mockResolvedValue({
        message: "Response",
        isLeadCapture: false,
        context: [],
      });

      await agent.processMessage("Message 1");
      await agent.processMessage("Message 2");

      const history = agent.getConversationHistory();

      expect(history.length).toBeGreaterThanOrEqual(4); // 2 user + 2 assistant
    });

    it("should reset conversation properly", async () => {
      await agent.initialize();

      vi.spyOn(ChatService, "generateResponse").mockResolvedValue({
        message: "Response",
        isLeadCapture: false,
        context: [],
      });

      await agent.processMessage("Message");
      agent.resetConversation();

      const history = agent.getConversationHistory();

      expect(history.length).toBe(0);
    });
  });
});

describe("PromptTemplateService", () => {
  describe("System Prompt Generation", () => {
    it("should generate system prompt with context", () => {
      const prompt = PromptTemplateService.generateSystemPrompt({
        websiteUrl: "https://example.com",
        companyName: "Example Corp",
        websiteContent: "We sell widgets",
        agentRole: "sales",
        agentName: "SalesBot",
        tone: "professional",
      });

      expect(prompt).toContain("Example Corp");
      expect(prompt).toContain("SalesBot");
      expect(prompt).toContain("sales");
    });

    it("should include role-specific instructions", () => {
      const salesPrompt = PromptTemplateService.generateSystemPrompt({
        websiteUrl: "https://example.com",
        companyName: "Example Corp",
        websiteContent: "Content",
        agentRole: "sales",
        agentName: "Agent",
      });

      const supportPrompt = PromptTemplateService.generateSystemPrompt({
        websiteUrl: "https://example.com",
        companyName: "Example Corp",
        websiteContent: "Content",
        agentRole: "support",
        agentName: "Agent",
      });

      expect(salesPrompt).toContain("sales");
      expect(supportPrompt).toContain("support");
      expect(salesPrompt).not.toEqual(supportPrompt);
    });
  });

  describe("Lead Intent Detection", () => {
    it("should detect demo request", () => {
      expect(PromptTemplateService.detectLeadIntent("I want a demo")).toBe(
        true
      );
      expect(PromptTemplateService.detectLeadIntent("Can I get a demo?")).toBe(
        true
      );
    });

    it("should detect contact request", () => {
      expect(PromptTemplateService.detectLeadIntent("Please contact me")).toBe(
        true
      );
      expect(
        PromptTemplateService.detectLeadIntent("I'd like to be contacted")
      ).toBe(true);
    });

    it("should not detect intent in normal questions", () => {
      expect(
        PromptTemplateService.detectLeadIntent("What are your hours?")
      ).toBe(false);
      expect(
        PromptTemplateService.detectLeadIntent("How much does it cost?")
      ).toBe(false);
    });
  });
});

describe("ChatService", () => {
  describe("Message Validation", () => {
    it("should accept valid messages", () => {
      const validation = ChatService.validateMessage("Hello, how are you?");

      expect(validation.valid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it("should reject empty messages", () => {
      const validation = ChatService.validateMessage("");

      expect(validation.valid).toBe(false);
      expect(validation.error).toBeDefined();
    });

    it("should reject messages with dangerous patterns", () => {
      const validation1 = ChatService.validateMessage(
        "<script>alert('xss')</script>"
      );
      const validation2 = ChatService.validateMessage("javascript:void(0)");

      expect(validation1.valid).toBe(false);
      expect(validation2.valid).toBe(false);
    });

    it("should reject messages that are too long", () => {
      const longMessage = "a".repeat(2500);
      const validation = ChatService.validateMessage(longMessage);

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain("too long");
    });
  });
});
