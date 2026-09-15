(function () {
  "use strict";

  // Prevent multiple initializations
  if (window.__ZeroRouteWidgetLoaded) return;
  window.__ZeroRouteWidgetLoaded = true;

  // Find script element and extract bot ID and host
  var scriptTag = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  var botId = scriptTag ? scriptTag.getAttribute("data-bot-id") : "demo";
  if (!botId) botId = "demo";
  var customHost = scriptTag ? scriptTag.getAttribute("data-host") : null;
  var host = customHost || (scriptTag && scriptTag.src && scriptTag.src.startsWith("http") ? new URL(scriptTag.src).origin : (typeof window !== "undefined" ? window.location.origin : ""));
  var customTitle = scriptTag ? scriptTag.getAttribute("data-title") : null;
  var customGreeting = scriptTag ? scriptTag.getAttribute("data-greeting") : null;
  var customPromptsRaw = scriptTag ? scriptTag.getAttribute("data-prompts") : null;
  var customColor = (scriptTag ? scriptTag.getAttribute("data-color") : null) || "#ef4444";

  // Inject CSS Styles
  var style = document.createElement("style");
  style.textContent = `
    #zr-widget-container {
      position: fixed;
      bottom: max(24px, env(safe-area-inset-bottom, 24px));
      right: max(16px, env(safe-area-inset-right, 16px));
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #zr-widget-btn {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${customColor};
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    #zr-widget-btn:hover {
      transform: scale(1.06);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
    }
    #zr-widget-btn svg {
      width: 26px;
      height: 26px;
      fill: #ffffff;
      transition: transform 0.2s ease;
    }
    #zr-widget-box {
      position: absolute;
      bottom: 72px;
      right: 0;
      width: 380px;
      height: 560px;
      max-height: calc(100vh - 100px);
      max-width: calc(100vw - 32px);
      background: #080a0f;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.85);
      display: none;
      flex-direction: column;
      overflow: hidden;
      animation: zrFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes zrFadeIn {
      from { opacity: 0; transform: translateY(16px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    #zr-header {
      padding: 12px 16px;
      background: ${customColor};
      color: #ffffff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    #zr-header .title-box {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    #zr-header .zr-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #ffffff;
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-transform: uppercase;
      flex-shrink: 0;
    }
    #zr-header .title-wrap {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    #zr-header .title {
      font-weight: 700;
      font-size: 14px;
      color: #ffffff;
      letter-spacing: -0.01em;
      line-height: 1.2;
    }
    #zr-header .status-wrap {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.85);
      font-weight: 500;
    }
    #zr-header .status-dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
      display: inline-block;
    }
    #zr-header .close-btn {
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: #ffffff;
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    #zr-header .close-btn:hover {
      background: rgba(255, 255, 255, 0.28);
    }
    #zr-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }
    .zr-msg {
      max-width: 88%;
      padding: 11px 15px;
      font-size: 13px;
      line-height: 1.55;
      border-radius: 16px;
      word-break: break-word;
    }
    .zr-msg.bot {
      align-self: flex-start;
      background: #111622;
      color: #e2e8f0;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-bottom-left-radius: 4px;
    }
    .zr-msg.bot strong {
      color: #ffffff;
      font-weight: 700;
    }
    .zr-msg.bot em {
      color: #f1f5f9;
      font-style: italic;
    }
    .zr-msg.bot a {
      color: ${customColor};
      text-decoration: underline;
      text-underline-offset: 2px;
      font-weight: 600;
      transition: opacity 0.15s;
    }
    .zr-msg.bot a:hover {
      opacity: 0.85;
    }
    .zr-msg.bot p {
      margin: 0 0 8px 0;
    }
    .zr-msg.bot p:last-child {
      margin-bottom: 0;
    }
    .zr-msg.user {
      align-self: flex-end;
      background: ${customColor};
      color: #ffffff;
      border-bottom-right-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      white-space: pre-wrap;
    }
    .zr-inline-code {
      background: rgba(255, 255, 255, 0.08);
      color: #fca5a5;
      padding: 2px 5px;
      border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .zr-code-block {
      background: #06080d;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 8px 10px;
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
      overflow-x: auto;
      margin: 6px 0;
      color: #e2e8f0;
      white-space: pre-wrap;
    }
    .zr-cursor {
      display: inline-block;
      width: 2px;
      height: 13px;
      background: ${customColor};
      margin-left: 3px;
      vertical-align: middle;
      animation: zrBlink 0.8s infinite;
    }
    @keyframes zrBlink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    #zr-suggestions-wrapper {
      padding: 0 16px 12px 16px;
    }
    #zr-suggestions-label {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
      display: block;
    }
    #zr-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .zr-pill {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      font-size: 11.5px;
      padding: 6px 12px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
    }
    .zr-pill:hover {
      background: ${customColor}22;
      border-color: ${customColor}66;
      color: #ffffff;
      transform: translateY(-1px);
    }
    #zr-input-area {
      padding: 12px 16px;
      padding-bottom: max(14px, env(safe-area-inset-bottom, 14px));
      background: rgba(12, 16, 26, 0.98);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      gap: 8px;
    }
    #zr-input {
      flex: 1;
      background: #080a0f;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 10px 14px;
      color: #ffffff;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      -webkit-appearance: none;
      touch-action: manipulation;
    }
    #zr-input:focus {
      border-color: ${customColor};
    }
    #zr-send-btn {
      background: ${customColor};
      border: none;
      border-radius: 12px;
      width: 44px;
      height: 44px;
      min-width: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #ffffff;
      transition: transform 0.15s, opacity 0.15s;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    #zr-send-btn:hover {
      transform: scale(1.05);
    }
    #zr-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
  `;
  document.head.appendChild(style);

  // Widget Container
  var container = document.createElement("div");
  container.id = "zr-widget-container";

  container.innerHTML = `
    <div id="zr-widget-box">
      <div id="zr-header">
        <div class="title-box">
          <div class="zr-avatar" id="zr-avatar-icon">A</div>
          <div class="title-wrap">
            <span class="title" id="zr-bot-title">AI Assistant</span>
            <div class="status-wrap">
              <span class="status-dot"></span>
              <span>Online • Active</span>
            </div>
          </div>
        </div>
        <button class="close-btn" id="zr-close-btn" aria-label="Close chat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div id="zr-messages"></div>
      <div id="zr-suggestions-wrapper" style="display:none;">
        <span id="zr-suggestions-label">Suggested Questions</span>
        <div id="zr-suggestions"></div>
      </div>
      <form id="zr-input-area">
        <input type="text" id="zr-input" placeholder="Ask anything…" autocomplete="off" />
        <button type="submit" id="zr-send-btn" aria-label="Send message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        </button>
      </form>
    </div>
    <button id="zr-widget-btn" aria-label="Open chat">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    </button>
  `;
  document.body.appendChild(container);

  var widgetBtn = document.getElementById("zr-widget-btn");
  var widgetBox = document.getElementById("zr-widget-box");
  var closeBtn = document.getElementById("zr-close-btn");
  var messagesContainer = document.getElementById("zr-messages");
  var suggestionsWrapper = document.getElementById("zr-suggestions-wrapper");
  var suggestionsContainer = document.getElementById("zr-suggestions");
  var inputForm = document.getElementById("zr-input-area");
  var inputField = document.getElementById("zr-input");
  var botTitleElem = document.getElementById("zr-bot-title");
  var avatarIconElem = document.getElementById("zr-avatar-icon");

  var isOpen = false;
  var chatHistory = [];

  function updateAvatar(title) {
    if (avatarIconElem && title) {
      avatarIconElem.textContent = title.trim().charAt(0).toUpperCase() || "A";
    }
  }

  function toggleChat() {
    isOpen = !isOpen;
    widgetBox.style.display = isOpen ? "flex" : "none";
    if (isOpen) {
      inputField.focus();
      scrollToBottom();
    }
  }

  widgetBtn.addEventListener("click", toggleChat);
  closeBtn.addEventListener("click", toggleChat);

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderMarkdown(rawText) {
    if (!rawText) return "";
    var escaped = escapeHtml(rawText);

    // Code blocks ```code```
    escaped = escaped.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, function (m, lang, code) {
      return '<pre class="zr-code-block"><code>' + code.trim() + '</code></pre>';
    });

    // Inline code `code`
    escaped = escaped.replace(/`([^`]+)`/g, '<code class="zr-inline-code">$1</code>');

    // Bold **text** or __text__
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong class="zr-bold">$1</strong>');
    escaped = escaped.replace(/__([^_]+)__/g, '<strong class="zr-bold">$1</strong>');

    // Italic *text* or _text_
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em class="zr-italic">$1</em>');

    // Links [text](url)
    escaped = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="zr-link">$1</a>');

    // Split paragraphs
    var paragraphs = escaped.split(/\n\s*\n/);
    if (paragraphs.length > 1) {
      return paragraphs.map(function (p) {
        return '<p>' + p.replace(/\n/g, '<br/>') + '</p>';
      }).join('');
    }

    return escaped.replace(/\n/g, '<br/>');
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function appendMessage(role, text) {
    var msgDiv = document.createElement("div");
    msgDiv.className = "zr-msg " + (role === "user" ? "user" : "bot");
    if (role === "user") {
      msgDiv.textContent = text;
    } else {
      msgDiv.innerHTML = renderMarkdown(text);
    }
    messagesContainer.appendChild(msgDiv);
    scrollToBottom();
    return msgDiv;
  }

  // Load Bot Configurations
  fetch(host + "/api/widget/config?bot_id=" + encodeURIComponent(botId))
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var bot = (data && data.bot) || {};
      var title = customTitle || bot.botTitle || "ZeroRoute AI";
      var greeting = customGreeting || bot.greeting || "Hi! 👋 How can I help you today?";
      var promptList = [];
      if (customPromptsRaw) {
        promptList = customPromptsRaw.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      } else if (Array.isArray(bot.prompts) && bot.prompts.length > 0) {
        promptList = bot.prompts;
      } else {
        promptList = ["What are your services?", "Pricing details", "How to get started?"];
      }

      botTitleElem.textContent = title;
      updateAvatar(title);

      if (greeting) {
        appendMessage("assistant", greeting);
        chatHistory.push({ role: "assistant", content: greeting });
      }

      if (promptList.length > 0) {
        suggestionsContainer.innerHTML = "";
        suggestionsWrapper.style.display = "block";
        promptList.forEach(function (promptText) {
          var pill = document.createElement("button");
          pill.className = "zr-pill";
          pill.textContent = promptText;
          pill.type = "button";
          pill.addEventListener("click", function () {
            sendMessage(promptText);
            suggestionsWrapper.style.display = "none";
          });
          suggestionsContainer.appendChild(pill);
        });
      }
    })
    .catch(function (err) {
      console.warn("[ZeroRoute Widget] Failed to load config:", err);
      var title = customTitle || "ZeroRoute AI";
      var greeting = customGreeting || "Hi! 👋 How can I help you today?";
      botTitleElem.textContent = title;
      updateAvatar(title);
      appendMessage("assistant", greeting);
    });

  async function sendMessage(text) {
    if (!text || !text.trim()) return;
    var userText = text.trim();
    inputField.value = "";

    // Instantly remove quick starter questions once any message is sent
    if (suggestionsWrapper) {
      suggestionsWrapper.style.display = "none";
      try {
        suggestionsWrapper.remove();
      } catch (e) {}
    }

    appendMessage("user", userText);
    chatHistory.push({ role: "user", content: userText });

    var botMsgElem = appendMessage("assistant", "Thinking...");

    try {
      var res = await fetch(host + "/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Bot-Id": botId
        },
        body: JSON.stringify({
          stream: true,
          messages: chatHistory
        })
      });

      if (!res.ok) {
        var errJson = await res.json().catch(function () { return {}; });
        var errMsg = (errJson.error && errJson.error.message) || "Sorry, I am having trouble responding right now.";
        botMsgElem.innerHTML = renderMarkdown(errMsg);
        return;
      }

      if (res.body) {
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var buffer = "";
        var currentText = "";
        botMsgElem.innerHTML = '<span class="zr-cursor"></span>';

        while (true) {
          var chunk = await reader.read();
          if (chunk.done) break;
          buffer += decoder.decode(chunk.value, { stream: true });
          var lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.startsWith("data:")) {
              var jsonStr = line.slice(5).trim();
              if (jsonStr === "[DONE]") break;
              try {
                var parsed = JSON.parse(jsonStr);
                var content = parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content;
                if (content) {
                  currentText += content;
                  botMsgElem.innerHTML = renderMarkdown(currentText) + '<span class="zr-cursor"></span>';
                  scrollToBottom();
                }
              } catch (e) {}
            }
          }
        }
        botMsgElem.innerHTML = renderMarkdown(currentText);
        chatHistory.push({ role: "assistant", content: currentText });
      }
    } catch (err) {
      console.error("[ZeroRoute Chat Error]:", err);
      botMsgElem.innerHTML = renderMarkdown("Unable to reach server. Please check your connection.");
    }
  }

  inputForm.addEventListener("submit", function (e) {
    e.preventDefault();
    sendMessage(inputField.value);
  });
})();
