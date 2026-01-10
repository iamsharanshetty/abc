"use client";

<<<<<<< HEAD
import { useChat } from "@ai-sdk/react";
=======
>>>>>>> chat-backup
import { useState, useRef, useEffect } from "react";
import { Send, X, MessageCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
<<<<<<< HEAD
  agentId?: string;
=======
  agentId: string;
>>>>>>> chat-backup
  websiteUrl?: string;
  primaryColor?: string;
  title?: string;
}

<<<<<<< HEAD
export function ChatWidget({
  agentId,
  websiteUrl,
  primaryColor = "#2563eb",
  title = "WebRep AI",
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");

  // AI SDK v4 useChat - simplified configuration
  const { messages, isLoading, error, append, reload } = useChat({
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

=======
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
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>(
    () => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );

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

  // Load conversation history when widget opens
  useEffect(() => {
    if (isOpen && messages.length === 0 && conversationId) {
      loadConversationHistory();
    }
  }, [isOpen]);

  const loadConversationHistory = async () => {
    try {
      const response = await fetch(
        `/api/v2/chat?conversationId=${conversationId}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.messages.length > 0) {
          const formattedMessages: Message[] = result.data.messages.map(
            (msg: any, idx: number) => ({
              id: `${conversationId}_${idx}`,
              role: msg.role,
              content: msg.content,
            })
          );
          setMessages(formattedMessages);
        }
      }
    } catch (err) {
      console.error("Failed to load conversation history:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const userMessageId = `${conversationId}_${Date.now()}`;

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content: userMessage },
    ]);
    setInput("");
    setIsLoading(true);
    setError(null);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/v2/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          message: userMessage,
          conversationId,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let assistantMessage = "";
      const assistantMessageId = `${conversationId}_${Date.now()}_assistant`;
      let isFirstToken = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "token") {
                // CRITICAL FIX: On first token, hide loading and add assistant message in ONE update
                if (isFirstToken) {
                  isFirstToken = false;
                  setIsLoading(false); // Hide loading dots immediately
                  assistantMessage = data.token;

                  // Add assistant message with first token
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: assistantMessageId,
                      role: "assistant",
                      content: assistantMessage,
                    },
                  ]);
                } else {
                  // Subsequent tokens: just update the content
                  assistantMessage += data.token;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: assistantMessage }
                        : msg
                    )
                  );
                }
              } else if (data.type === "done") {
                // Final message
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: data.fullResponse }
                      : msg
                  )
                );
              } else if (data.type === "error") {
                throw new Error(data.error || "An error occurred");
              }
            } catch (parseError) {
              // Skip invalid JSON lines
              console.warn("Failed to parse SSE line:", line);
            }
          }
        }
      }

      setIsLoading(false);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Chat error:", err);
        setError(err.message || "Failed to send message. Please try again.");
        // Remove the empty assistant message on error
        setMessages((prev) => prev.filter((msg) => msg.content !== ""));
      }
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const bgPrimary = { backgroundColor: primaryColor };

>>>>>>> chat-backup
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
              <p className="mb-2">Hi! How can I help you today?</p>
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
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
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

<<<<<<< HEAD
=======
          {/* CRITICAL FIX: Only show loading dots when isLoading is true */}
>>>>>>> chat-backup
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
<<<<<<< HEAD
            <div className="flex items-center justify-center gap-2 text-red-500 text-xs mt-2">
              <span>Something went wrong. Please try again.</span>
              <button
                onClick={() => reload()}
                className="underline hover:text-red-600"
              >
                Retry
              </button>
=======
            <div className="flex items-center justify-center gap-2 text-red-500 text-xs mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded">
              <span>{error}</span>
>>>>>>> chat-backup
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 h-[84px]">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              className="flex-1 bg-slate-100 dark:bg-slate-800 p-3 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all pl-4"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={isLoading}
            />
            <button
<<<<<<< HEAD
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 rounded-full text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all transform active:scale-95"
              style={bgPrimary}
            >
              <Send className="w-4 h-4 ml-0.5" />
=======
              type={isLoading ? "button" : "submit"}
              onClick={isLoading ? handleStop : undefined}
              disabled={!isLoading && !input.trim()}
              className="p-3 rounded-full text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all transform active:scale-95"
              style={bgPrimary}
            >
              {isLoading ? (
                <X className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4 ml-0.5" />
              )}
>>>>>>> chat-backup
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
