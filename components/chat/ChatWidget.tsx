"use client";

<<<<<<< HEAD
=======
// ✅ Correct imports for AI SDK v4
import { useChat } from "@ai-sdk/react";
>>>>>>> ale-27-integrate-openai-api-for-agent-prompt-development-testing
import { useState, useRef, useEffect } from "react";
import { Send, X, MessageCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  agentId?: string;
  websiteUrl?: string;
  primaryColor?: string;
  title?: string;
}

<<<<<<< HEAD
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget({
  agentId,
  websiteUrl,
  primaryColor = "#2563eb",
  title = "WebRep AI",
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localInput, setLocalInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: localInput.trim(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setLocalInput("");
    setIsLoading(true);
    setError(null);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    const assistantMessageId = `assistant-${Date.now()}`;
    let assistantContent = "";
    let hasAddedAssistantMessage = false;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          agentId,
          websiteUrl,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let buffer = "";

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          // Parse different streaming formats
          // Format 1: "0:content" (AI SDK format)
          if (line.startsWith("0:")) {
            const content = line.substring(2).trim();
            // Remove surrounding quotes if present
            const cleanContent = content.replace(/^["'](.*)["']$/, "$1");
            assistantContent += cleanContent;
          }
          // Format 2: data: {json} (SSE format)
          else if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.substring(6);
              if (jsonStr === "[DONE]") continue;

              const data = JSON.parse(jsonStr);
              if (data.content) {
                assistantContent += data.content;
              } else if (data.choices?.[0]?.delta?.content) {
                assistantContent += data.choices[0].delta.content;
              }
            } catch (e) {
              // Not valid JSON, might be plain text
              console.debug("Non-JSON data chunk:", line);
            }
          }
          // Format 3: Plain text chunks
          else if (line.trim()) {
            assistantContent += line.trim();
          }

          // Add or update assistant message
          if (assistantContent && !hasAddedAssistantMessage) {
            setMessages((prev) => [
              ...prev,
              {
                id: assistantMessageId,
                role: "assistant",
                content: assistantContent,
              },
            ]);
            hasAddedAssistantMessage = true;
          } else if (assistantContent && hasAddedAssistantMessage) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: assistantContent }
                  : m
              )
            );
          }
        }
      }

      // Process any remaining buffer content
      if (buffer.trim()) {
        if (buffer.startsWith("0:")) {
          const content = buffer
            .substring(2)
            .trim()
            .replace(/^["'](.*)["']$/, "$1");
          assistantContent += content;
        }

        if (hasAddedAssistantMessage) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: assistantContent }
                : m
            )
          );
        }
      }

      // If we never got any content, show an error
      if (!assistantContent) {
        throw new Error("No response content received");
      }
    } catch (err: any) {
      console.error("Chat error:", err);

      // Don't show error if request was aborted (user closed chat, etc)
      if (err.name === "AbortError") {
        return;
      }

      setError("Failed to send message. Please try again.");

      // Remove the user message if there was an error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const reload = () => {
    setError(null);
    // Optionally: Could retry last message by getting it from messages array
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();
    if (lastUserMessage) {
      setLocalInput(lastUserMessage.content);
    }
  };

  const bgPrimary = { backgroundColor: primaryColor };

=======
export function ChatWidget({
  agentId,
  websiteUrl,
  primaryColor = "#2563eb",
  title = "WebRep AI",
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");

  // ✅ AI SDK v4 useChat - simplified configuration
  const { messages, isLoading, error, append, setMessages } = useChat({
    api: "/api/v2/chat",
    body: {
      agentId,
      websiteUrl,
    },
    onError: (err: Error) => {
      console.error("Chat error:", err);
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    append({ role: "user", content: input });
    setInput("");
  };

  const bgPrimary = { backgroundColor: primaryColor };

>>>>>>> ale-27-integrate-openai-api-for-agent-prompt-development-testing
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans",
        !isOpen && "pointer-events-none"
      )}
    >
      {/* Chat Window */}
      <div
        className={cn(
          "bg-white dark:bg-slate-900 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ease-in-out origin-bottom-right mb-4 border border-slate-200 dark:border-slate-800 pointer-events-auto",
          isOpen
            ? "w-[380px] h-[600px] opacity-100 scale-100"
            : "w-[380px] h-0 opacity-0 scale-95"
        )}
      >
        {/* Header */}
        <div
          className="p-4 flex items-center justify-between text-white"
          style={bgPrimary}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{title}</h3>
              <div className="flex items-center gap-1 opacity-80">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-xs">Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="h-[460px] overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950/50 space-y-4 scroll-smooth">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 mt-10">
              <p className="mb-2">👋 Hi! How can I help you today?</p>
              <p className="text-xs opacity-70">
                Ask me anything about {title}.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex w-full",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
<<<<<<< HEAD
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-wrap",
=======
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
>>>>>>> ale-27-integrate-openai-api-for-agent-prompt-development-testing
                  m.role === "user"
                    ? "text-white rounded-br-none"
                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none"
                )}
                style={m.role === "user" ? bgPrimary : {}}
              >
                {m.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700 flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center gap-2 text-red-500 text-xs mt-2">
<<<<<<< HEAD
              <span>{error}</span>
              <button
                onClick={() => reload()}
                className="underline hover:text-red-600"
              >
                Retry
              </button>
=======
              <span>Something went wrong. Please try again.</span>
>>>>>>> ale-27-integrate-openai-api-for-agent-prompt-development-testing
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 h-[84px]">
<<<<<<< HEAD
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <input
              className="flex-1 bg-slate-100 dark:bg-slate-800 p-3 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all pl-4"
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
=======
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              className="flex-1 bg-slate-100 dark:bg-slate-800 p-3 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all pl-4"
              value={input}
              onChange={(e) => setInput(e.target.value)}
>>>>>>> ale-27-integrate-openai-api-for-agent-prompt-development-testing
              placeholder="Type a message..."
              disabled={isLoading}
            />
            <button
              type="submit"
<<<<<<< HEAD
              disabled={isLoading || !localInput.trim()}
=======
              disabled={isLoading || !input.trim()}
>>>>>>> ale-27-integrate-openai-api-for-agent-prompt-development-testing
              className="p-3 rounded-full text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all transform active:scale-95"
              style={bgPrimary}
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all duration-300 pointer-events-auto"
        style={bgPrimary}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-7 h-7" />
        )}
      </button>
    </div>
  );
}
