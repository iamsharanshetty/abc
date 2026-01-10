/**
 * WebRep Chat Widget Embed Script - FIXED VERSION
 *
 * This script allows website owners to embed the WebRep chat widget
 * by simply adding a <script> tag with their agent ID.
 *
 * Usage:
 * <script src="https://webrep.ai/embed.js" data-agent-id="your-agent-id"></script>
 *
 * Optional attributes:
 * - data-primary-color: Hex color for widget theme (default: #2563eb)
 * - data-position: Widget position - "bottom-right" or "bottom-left" (default: bottom-right)
 * - data-base-url: Override base URL for development (default: uses script origin)
 */

(function () {
  "use strict";

  // Prevent multiple initializations
  if (window.__WEBREP_INITIALIZED__) {
    console.warn("[WebRep] Widget already initialized, skipping...");
    return;
  }
  window.__WEBREP_INITIALIZED__ = true;

  // Get the current script tag to read attributes
  const currentScript =
    document.currentScript || document.querySelector("script[data-agent-id]");

  if (!currentScript) {
    console.error(
      "[WebRep] Could not find embed script tag. Make sure the script has a data-agent-id attribute."
    );
    return;
  }

  // Read configuration from data attributes
  const agentId = currentScript.getAttribute("data-agent-id");
  const primaryColor =
    currentScript.getAttribute("data-primary-color") || "#2563eb";
  const position =
    currentScript.getAttribute("data-position") || "bottom-right";

  if (!agentId) {
    console.error(
      "[WebRep] Missing required data-agent-id attribute on script tag"
    );
    return;
  }

  // Validate agent ID format (UUID v4)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(agentId)) {
    console.error("[WebRep] Invalid agent ID format. Expected UUID v4.");
    return;
  }

  // Determine the base URL
  let baseUrl = currentScript.getAttribute("data-base-url");

  if (!baseUrl) {
    const scriptSrc = currentScript.src;
    if (scriptSrc) {
      const url = new URL(scriptSrc);
      baseUrl = url.origin;
    } else {
      // Fallback for development
      baseUrl =
        window.location.hostname === "localhost"
          ? "http://localhost:3000"
          : window.location.origin;
    }
  }

  console.log("[WebRep] Initializing chat widget", {
    agentId,
    baseUrl,
    primaryColor,
    position,
  });

  // ✅ FIXED: Create iframe container that doesn't block content
  // The key is pointer-events: none on the container
  // and only the iframe content should be interactive
  const container = document.createElement("div");
  container.id = "webrep-chat-container";
  container.setAttribute("aria-label", "Chat widget");
  container.style.cssText = `
    position: fixed;
    bottom: 0;
    ${position === "bottom-left" ? "left: 0;" : "right: 0;"}
    width: 100%;
    height: 100%;
    z-index: 2147483647;
    pointer-events: none;
  `;

  // ✅ FIXED: Create iframe with proper styling
  const iframe = document.createElement("iframe");
  iframe.id = "webrep-chat-iframe";

  // Build iframe URL with query parameters
  const iframeUrl = new URL(`${baseUrl}/embed/chat/${agentId}`);
  iframeUrl.searchParams.set("color", primaryColor);
  iframeUrl.searchParams.set("position", position);
  iframeUrl.searchParams.set("embedded", "true");

  iframe.src = iframeUrl.toString();

  // ✅ CRITICAL FIX: Iframe should be full size but with pointer-events: none
  // This makes the iframe transparent to clicks except for the widget itself
  iframe.style.cssText = `
    border: none;
    width: 100%;
    height: 100%;
    position: fixed;
    bottom: 0;
    ${position === "bottom-left" ? "left: 0;" : "right: 0;"}
    background: transparent;
    pointer-events: auto;
  `;

  // Security and accessibility attributes
  iframe.setAttribute("allow", "clipboard-write");
  iframe.setAttribute("title", "WebRep Chat Widget");
  iframe.setAttribute("aria-label", "Chat with our AI assistant");

  // ✅ IMPORTANT: Allow scripts and same-origin for proper functionality
  iframe.setAttribute(
    "sandbox",
    "allow-scripts allow-same-origin allow-forms allow-popups"
  );

  // Append iframe to container
  container.appendChild(iframe);

  // Initialize the widget
  function init() {
    // Check if body exists
    if (!document.body) {
      console.warn("[WebRep] Document body not ready, retrying...");
      setTimeout(init, 100);
      return;
    }

    document.body.appendChild(container);
    console.log("[WebRep] Chat widget loaded successfully");

    // Track widget load event
    trackEvent("widget_loaded", {
      agentId,
      url: window.location.href,
      referrer: document.referrer,
    });
  }

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Optional: Track events
  function trackEvent(eventName, data) {
    try {
      console.log("[WebRep] Event:", eventName, data);
    } catch (err) {
      console.warn("[WebRep] Analytics tracking failed:", err);
    }
  }

  // Message handler for communication with iframe
  window.addEventListener("message", function (event) {
    // Verify the message is from our iframe
    if (event.origin !== baseUrl) {
      return;
    }

    const message = event.data;

    switch (message.action) {
      case "widget-opened":
        console.log("[WebRep] Widget opened");
        trackEvent("widget_opened", {});
        break;

      case "widget-closed":
        console.log("[WebRep] Widget closed");
        trackEvent("widget_closed", {});
        break;

      case "message-sent":
        console.log("[WebRep] Message sent");
        trackEvent("message_sent", {});
        break;

      case "lead-captured":
        console.log("[WebRep] Lead captured");
        trackEvent("lead_captured", message.data);
        break;

      default:
        console.log("[WebRep] Unknown message:", message);
    }
  });

  // Expose public API for programmatic control
  window.WebRep = {
    // Version
    version: "1.0.0",

    // Agent ID
    agentId: agentId,

    // Open the chat widget
    open: function () {
      iframe.contentWindow.postMessage({ action: "open" }, baseUrl);
      trackEvent("widget_opened_programmatic", {});
    },

    // Close the chat widget
    close: function () {
      iframe.contentWindow.postMessage({ action: "close" }, baseUrl);
      trackEvent("widget_closed_programmatic", {});
    },

    // Toggle the chat widget
    toggle: function () {
      iframe.contentWindow.postMessage({ action: "toggle" }, baseUrl);
      trackEvent("widget_toggled_programmatic", {});
    },

    // Send a message programmatically
    sendMessage: function (message) {
      if (!message || typeof message !== "string") {
        console.error("[WebRep] Invalid message");
        return;
      }
      iframe.contentWindow.postMessage(
        {
          action: "send-message",
          message: message,
        },
        baseUrl
      );
      trackEvent("message_sent_programmatic", { message });
    },

    // Update configuration
    updateConfig: function (config) {
      iframe.contentWindow.postMessage(
        {
          action: "update-config",
          config: config,
        },
        baseUrl
      );
    },

    // Check if widget is ready
    isReady: function () {
      return !!iframe && !!iframe.contentWindow;
    },

    // Get current configuration
    getConfig: function () {
      return {
        agentId,
        primaryColor,
        position,
        baseUrl,
      };
    },

    // Destroy the widget (removes it from DOM)
    destroy: function () {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
        console.log("[WebRep] Widget destroyed");
        trackEvent("widget_destroyed", {});
      }
      window.__WEBREP_INITIALIZED__ = false;
    },
  };

  // Log successful initialization
  console.log("[WebRep] API ready:", window.WebRep);
})();
