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
  var customLinkColor = scriptTag ? scriptTag.getAttribute("data-link-color") : null;
  var customLogo = scriptTag ? scriptTag.getAttribute("data-logo") : null;

  function getAccessibleLinkColor(brandColor, explicitLinkColor) {
    if (explicitLinkColor && explicitLinkColor.trim()) return explicitLinkColor.trim();
    if (!brandColor || typeof brandColor !== "string") return "#38bdf8";
    var hex = brandColor.replace("#", "").trim();
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) return "#38bdf8";
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    // Perceived luminance formula (ITU-R BT.709)
    var luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    if (luminance < 0.52 || (b > 115 && r < 110)) {
      return "#38bdf8";
    }
    return brandColor;
  }

  var linkColor = getAccessibleLinkColor(customColor, customLinkColor);

  // Inject CSS Styles inside Shadow Root
  var style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      position: fixed !important;
      bottom: max(24px, env(safe-area-inset-bottom, 24px)) !important;
      right: max(16px, env(safe-area-inset-right, 16px)) !important;
      z-index: 2147483647 !important;
      display: block !important;
      pointer-events: auto !important;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      margin: 0;
      padding: 0;
    }
    #zr-widget-container {
      position: relative;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #zr-widget-btn {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(145deg, #ff4d56 0%, ${customColor} 55%, #a81018 100%);
      box-shadow: 
        0 4px 16px rgba(0, 0, 0, 0.35),
        0 1px 3px rgba(0, 0, 0, 0.2),
        inset 0 1.5px 2px rgba(255, 255, 255, 0.6),
        inset 0 -2px 4px rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.32);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      position: relative;
      overflow: hidden;
    }
    #zr-widget-btn::after {
      content: "";
      position: absolute;
      top: 2px;
      left: 8px;
      right: 8px;
      height: 45%;
      border-radius: 50px 50px 30px 30px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 100%);
      pointer-events: none;
    }
    #zr-widget-btn:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 
        0 8px 24px rgba(0, 0, 0, 0.45),
        0 2px 6px rgba(0, 0, 0, 0.3),
        inset 0 1.5px 2px rgba(255, 255, 255, 0.75),
        inset 0 -2px 4px rgba(0, 0, 0, 0.4);
    }
    #zr-widget-btn:active {
      transform: scale(0.96);
    }
    #zr-widget-btn svg {
      width: 25px;
      height: 25px;
      fill: #ffffff;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
      transition: transform 0.2s ease;
      position: relative;
      z-index: 1;
    }
    #zr-widget-box {
      position: absolute;
      bottom: 74px;
      right: 0;
      width: 390px;
      height: 580px;
      max-height: calc(100vh - 105px);
      max-width: calc(100vw - 32px);
      background: rgba(11, 15, 23, 0.88);
      backdrop-filter: blur(28px) saturate(180%);
      -webkit-backdrop-filter: blur(28px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 22px;
      box-shadow: 
        0 28px 75px rgba(0, 0, 0, 0.85),
        0 8px 24px rgba(0, 0, 0, 0.4),
        inset 0 1px 1.5px rgba(255, 255, 255, 0.15);
      display: none;
      flex-direction: column;
      overflow: hidden;
      animation: zrFadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes zrFadeIn {
      from { opacity: 0; transform: translateY(18px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    #zr-header {
      padding: 13px 16px;
      background: linear-gradient(180deg, rgba(235, 45, 56, 0.96) 0%, ${customColor} 60%, rgba(185, 20, 28, 0.98) 100%);
      color: #ffffff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.18);
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 
        inset 0 1px 1.5px rgba(255, 255, 255, 0.45),
        0 4px 18px rgba(0, 0, 0, 0.3);
      position: relative;
    }
    #zr-header::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 40%;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 100%);
      pointer-events: none;
    }
    #zr-header .title-box {
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 1;
    }
    #zr-header .zr-logo {
      height: 28px;
      width: auto;
      max-width: 36px;
      object-fit: contain;
      border-radius: 0;
      border: none;
      background: transparent;
      flex-shrink: 0;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.25));
    }
    #zr-header .title-wrap {
      display: flex;
      flex-direction: column;
      gap: 1.5px;
    }
    #zr-header .title {
      font-weight: 700;
      font-size: 14.5px;
      color: #ffffff;
      letter-spacing: -0.01em;
      line-height: 1.2;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
    }
    #zr-header .status-wrap {
      display: flex;
      align-items: center;
      gap: 5.5px;
      font-size: 10.5px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
    }
    #zr-header .status-dot {
      width: 6.5px;
      height: 6.5px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10b981, 0 0 3px #10b981;
      display: inline-block;
      animation: zrPulse 2s infinite ease-in-out;
    }
    @keyframes zrPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.65; transform: scale(0.85); }
    }
    #zr-header .close-btn {
      background: rgba(255, 255, 255, 0.16);
      border: 1px solid rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #ffffff;
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      z-index: 1;
    }
    #zr-header .close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }
    #zr-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
      scroll-behavior: smooth;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
      -webkit-overflow-scrolling: touch;
    }
    #zr-messages::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    #zr-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    #zr-messages::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
    }
    #zr-messages::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    #zr-messages::-webkit-scrollbar-button {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    #zr-messages::-webkit-scrollbar-corner {
      background: transparent;
    }

    /* Message Bubbles */
    .zr-msg {
      max-width: 88%;
      padding: 11px 15px;
      font-size: 13px;
      line-height: 1.55;
      word-break: break-word;
    }

    /* Liquid Glass Bot Bubble */
    .zr-msg.bot {
      align-self: flex-start;
      background: rgba(16, 22, 34, 0.78);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      color: #e2e8f0;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 18px 18px 18px 4px;
      box-shadow: 
        inset 0 1px 1px rgba(255, 255, 255, 0.07),
        0 4px 16px rgba(0, 0, 0, 0.35);
    }
    .zr-msg.bot strong {
      color: #ffffff;
      font-weight: 700;
    }
    .zr-heading {
      display: block;
      font-size: 13.5px;
      font-weight: 700;
      color: #ffffff;
      margin: 8px 0 4px 0;
    }
    .zr-msg.bot em {
      color: #f1f5f9;
      font-style: italic;
    }
    .zr-msg.bot a, .zr-link {
      color: ${linkColor};
      text-decoration: underline;
      text-underline-offset: 3px;
      text-decoration-color: ${linkColor}99;
      font-weight: 600;
      transition: all 0.15s ease;
      word-break: break-word;
    }
    .zr-msg.bot a:hover, .zr-link:hover {
      color: #ffffff;
      text-decoration-color: #ffffff;
      text-shadow: 0 0 8px ${linkColor}88;
    }
    .zr-msg.bot p {
      margin: 0 0 8px 0;
    }
    .zr-msg.bot p:last-child {
      margin-bottom: 0;
    }
    .zr-msg.bot ul, .zr-msg.bot ol {
      margin: 6px 0 8px 0;
      padding-left: 0;
      list-style: none;
    }
    .zr-msg.bot ul li {
      position: relative;
      padding-left: 16px;
      margin-bottom: 5px;
    }
    .zr-msg.bot ul li::before {
      content: "•";
      position: absolute;
      left: 3px;
      top: -1px;
      color: #ff4d56;
      font-size: 15px;
      line-height: 1;
    }
    .zr-msg.bot ol {
      counter-reset: zr-counter;
    }
    .zr-msg.bot ol li {
      position: relative;
      padding-left: 20px;
      margin-bottom: 5px;
      counter-increment: zr-counter;
    }
    .zr-msg.bot ol li::before {
      content: counter(zr-counter) ".";
      position: absolute;
      left: 0;
      top: 0;
      color: #ff6b72;
      font-weight: 600;
      font-size: 12px;
    }

    /* Beveled Liquid Red User Pill */
    .zr-msg.user {
      align-self: flex-end;
      background: linear-gradient(180deg, #ff4d56 0%, ${customColor} 48%, #ba121b 100%);
      color: #ffffff;
      border-radius: 18px 18px 4px 18px;
      border: 1px solid rgba(255, 255, 255, 0.28);
      box-shadow: 
        inset 0 1.5px 2px rgba(255, 255, 255, 0.55),
        inset 0 -1.5px 2px rgba(0, 0, 0, 0.25),
        0 2px 8px rgba(0, 0, 0, 0.3);
      white-space: pre-wrap;
      font-weight: 500;
      text-shadow: 0 1px 1.5px rgba(0, 0, 0, 0.2);
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
      background: rgba(6, 8, 14, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 9px 12px;
      border-radius: 10px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
      overflow-x: auto;
      margin: 7px 0;
      color: #e2e8f0;
      white-space: pre-wrap;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
    }
    .zr-cursor {
      display: inline-block;
      width: 2px;
      height: 13px;
      background: #ff4d56;
      margin-left: 3px;
      vertical-align: middle;
      animation: zrBlink 0.8s infinite;
    }
    @keyframes zrBlink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    .zr-typing-dots {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 4px;
      height: 18px;
    }
    .zr-typing-dots .zr-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ff4d56;
      opacity: 0.4;
      animation: zrTypingBounce 1.4s infinite ease-in-out both;
    }
    .zr-typing-dots .zr-dot:nth-child(1) {
      animation-delay: -0.32s;
    }
    .zr-typing-dots .zr-dot:nth-child(2) {
      animation-delay: -0.16s;
    }
    @keyframes zrTypingBounce {
      0%, 80%, 100% {
        transform: scale(0.6);
        opacity: 0.3;
      }
      40% {
        transform: scale(1.15);
        opacity: 1;
      }
    }
    #zr-suggestions-wrapper {
      padding: 0 16px 12px 16px;
    }
    #zr-suggestions-label {
      font-size: 9.5px;
      text-transform: uppercase;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.05em;
      margin-bottom: 7px;
      display: block;
    }
    #zr-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 6.5px;
    }
    .zr-pill {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #e2e8f0;
      font-size: 11.5px;
      padding: 6.5px 12.5px;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.18s ease;
      text-align: left;
    }
    .zr-pill:hover {
      background: rgba(255, 77, 86, 0.15);
      border-color: rgba(255, 77, 86, 0.45);
      color: #ffffff;
      transform: translateY(-1px);
    }
    #zr-input-area {
      padding: 12px 16px;
      padding-bottom: max(14px, env(safe-area-inset-bottom, 14px));
      background: rgba(12, 16, 26, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      gap: 8px;
      align-items: center;
    }
    #zr-input {
      flex: 1;
      background: rgba(7, 10, 16, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.11);
      border-radius: 14px;
      padding: 10.5px 15px;
      color: #ffffff;
      font-size: 13.5px;
      outline: none;
      transition: all 0.2s ease;
      -webkit-appearance: none;
      touch-action: manipulation;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.35);
    }
    #zr-input::placeholder {
      color: rgba(148, 163, 184, 0.7);
    }
    #zr-input:focus {
      border-color: rgba(255, 77, 86, 0.65);
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.35);
    }
    #zr-send-btn {
      background: linear-gradient(145deg, #ff4d56 0%, ${customColor} 55%, #ba121b 100%);
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 13px;
      width: 44px;
      height: 44px;
      min-width: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #ffffff;
      box-shadow: 
        0 2px 8px rgba(0, 0, 0, 0.35),
        inset 0 1px 1.5px rgba(255, 255, 255, 0.5);
      transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    #zr-send-btn:hover {
      transform: scale(1.05) translateY(-1px);
      box-shadow: 
        0 4px 12px rgba(0, 0, 0, 0.45),
        inset 0 1px 1.5px rgba(255, 255, 255, 0.6);
    }
    #zr-send-btn:active {
      transform: scale(0.96);
    }
    #zr-send-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    #zr-footer-badge {
      text-align: center;
      padding: 5px 0 7px 0;
      background: rgba(12, 16, 26, 0.85);
      border-top: 1px solid rgba(255, 255, 255, 0.04);
    }
    #zr-footer-badge a {
      font-size: 10.5px;
      color: #64748b;
      text-decoration: none;
      font-weight: 500;
      letter-spacing: 0.02em;
      transition: color 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    #zr-footer-badge a:hover {
      color: #94a3b8;
    }
    #zr-footer-badge a span {
      color: #f1f5f9;
      font-weight: 600;
    }
  `;

  // Mount Widget inside Closed Shadow DOM for absolute isolation from host page styles and tampering
  var hostElement = document.createElement("div");
  hostElement.id = "zeroroute-widget-root";

  var shadowRoot = hostElement.attachShadow ? hostElement.attachShadow({ mode: "closed" }) : hostElement;
  shadowRoot.appendChild(style);

  var container = document.createElement("div");
  container.id = "zr-widget-container";
  container.innerHTML = `
    <div id="zr-widget-box">
      <div id="zr-header">
        <div class="title-box">
          <img class="zr-logo" id="zr-avatar-logo" src="${customLogo || ''}" alt="" style="display:${customLogo ? 'block' : 'none'};" onerror="this.style.display='none'" />
          <div class="title-wrap">
            <span class="title" id="zr-bot-title">AI Assistant</span>
            <div class="status-wrap">
              <span class="status-dot"></span>
              <span>Online • Active</span>
            </div>
          </div>
        </div>
        <button class="close-btn" id="zr-close-btn" aria-label="Close chat">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
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
      <div id="zr-footer-badge" style="display:none;">
        <a href="https://zeroroute.mapki.in" target="_blank" rel="noopener noreferrer">⚡ Powered by <span>ZeroRoute</span></a>
      </div>
    </div>
    <button id="zr-widget-btn" aria-label="Open chat">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    </button>
  `;
  shadowRoot.appendChild(container);
  document.body.appendChild(hostElement);

  function getEl(id) {
    return shadowRoot.getElementById ? shadowRoot.getElementById(id) : shadowRoot.querySelector("#" + id);
  }

  var widgetBtn = getEl("zr-widget-btn");
  var widgetBox = getEl("zr-widget-box");
  var closeBtn = getEl("zr-close-btn");
  var messagesContainer = getEl("zr-messages");
  var suggestionsWrapper = getEl("zr-suggestions-wrapper");
  var suggestionsContainer = getEl("zr-suggestions");
  var inputForm = getEl("zr-input-area");
  var inputField = getEl("zr-input");
  var botTitleElem = getEl("zr-bot-title");
  var avatarLogoElem = getEl("zr-avatar-logo");
  var footerBadgeElem = getEl("zr-footer-badge");

  // Tamper-Proof Watchdog for Free Tier
  function initBrandingWatchdog() {
    var ensureBadgeIntegrity = function () {
      if (!footerBadgeElem) {
        footerBadgeElem = getEl("zr-footer-badge");
      }
      if (!footerBadgeElem) return;

      // 1. Force visibility against any script overrides
      if (footerBadgeElem.style.display === "none") {
        footerBadgeElem.style.setProperty("display", "block", "important");
      }
      if (footerBadgeElem.style.visibility === "hidden") {
        footerBadgeElem.style.setProperty("visibility", "visible", "important");
      }
      if (parseFloat(footerBadgeElem.style.opacity) < 0.5) {
        footerBadgeElem.style.setProperty("opacity", "1", "important");
      }
      // 2. Ensure badge is present in widgetBox DOM
      var box = getEl("zr-widget-box");
      if (box && !box.contains(footerBadgeElem)) {
        box.appendChild(footerBadgeElem);
      }
      // 3. Ensure anchor link integrity
      var link = footerBadgeElem.querySelector("a");
      if (!link || !link.href || !link.href.includes("zeroroute")) {
        footerBadgeElem.innerHTML = '<a href="https://zeroroute.mapki.in" target="_blank" rel="noopener noreferrer">⚡ Powered by <span>ZeroRoute</span></a>';
      }
    };

    setInterval(ensureBadgeIntegrity, 2000);
    if (typeof MutationObserver !== "undefined") {
      var observer = new MutationObserver(function () {
        ensureBadgeIntegrity();
      });
      observer.observe(container, { childList: true, subtree: true, attributes: true });
    }
  }

  var isOpen = false;
  var chatHistory = [];

  function toggleChat() {
    isOpen = !isOpen;
    widgetBox.style.display = isOpen ? "flex" : "none";
    if (isOpen) {
      inputField.focus();
      scrollToBottom();
    }
  }

  function openChat() {
    if (!isOpen) {
      toggleChat();
    }
  }

  function closeChat() {
    if (isOpen) {
      toggleChat();
    }
  }

  // Global API & Custom Event Triggers for Host Pages
  window.ZeroRoute = window.ZeroRoute || {};
  window.ZeroRoute.open = openChat;
  window.ZeroRoute.close = closeChat;
  window.ZeroRoute.toggle = toggleChat;

  window.addEventListener("zeroroute:open", openChat);
  window.addEventListener("zeroroute:close", closeChat);
  window.addEventListener("zeroroute:toggle", toggleChat);

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

  function getLinkTargetAttr(url) {
    if (typeof window === "undefined" || !window.location) return 'target="_blank" rel="noopener noreferrer"';
    try {
      var linkUrl = new URL(url, window.location.href);
      var linkHost = linkUrl.hostname.toLowerCase().replace(/^www\./, '');
      var currentHost = window.location.hostname.toLowerCase().replace(/^www\./, '');
      if (linkHost === currentHost) {
        return 'target="_self"';
      }
    } catch (e) {}
    return 'target="_blank" rel="noopener noreferrer"';
  }

  function renderMarkdown(rawText) {
    if (!rawText) return "";
    var escaped = escapeHtml(rawText);

    // 1. Tokenize Code blocks ```code```
    var codeBlocks = [];
    escaped = escaped.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, function (m, lang, code) {
      codeBlocks.push('<pre class="zr-code-block"><code>' + code.trim() + '</code></pre>');
      return '§§ZRBLOCK' + (codeBlocks.length - 1) + '§§';
    });

    // 2. Tokenize Inline code `code`
    var inlineCodes = [];
    escaped = escaped.replace(/`([^`]+)`/g, function (m, code) {
      inlineCodes.push('<code class="zr-inline-code">$1</code>'.replace('$1', code));
      return '§§ZRCODE' + (inlineCodes.length - 1) + '§§';
    });

    // 3. Tokenize Markdown Links [text](url)
    var links = [];
    escaped = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, function (m, text, url) {
      var targetAttr = getLinkTargetAttr(url);
      links.push('<a href="' + url + '" ' + targetAttr + ' class="zr-link">' + text + '</a>');
      return '§§ZRLINK' + (links.length - 1) + '§§';
    });

    // 4. Auto-link Standalone Raw URLs (https://... or http://...)
    escaped = escaped.replace(/(https?:\/\/[^\s<)]+)/g, function (m, url) {
      var cleanUrl = url.replace(/[.,!?;:]+$/, '');
      var trailing = url.slice(cleanUrl.length);
      var targetAttr = getLinkTargetAttr(cleanUrl);
      links.push('<a href="' + cleanUrl + '" ' + targetAttr + ' class="zr-link">' + cleanUrl + '</a>');
      return '§§ZRLINK' + (links.length - 1) + '§§' + trailing;
    });

    // 5. Headings #, ##, ###, ####
    escaped = escaped.replace(/^(#{1,6})\s+(.+)$/gm, '<strong class="zr-heading">$2</strong>');

    // 6. Bold **text** or __text__
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong class="zr-bold">$1</strong>');
    escaped = escaped.replace(/__([^_]+)__/g, '<strong class="zr-bold">$1</strong>');

    // 7. Italic *text* or _text_
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em class="zr-italic">$1</em>');

    // 8. Process Unordered and Ordered Lists
    var lines = escaped.split('\n');
    var inUl = false;
    var inOl = false;
    var processedLines = [];

    for (var l = 0; l < lines.length; l++) {
      var line = lines[l];
      var ulMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
      var olMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);

      if (ulMatch) {
        if (inOl) { processedLines.push('</ol>'); inOl = false; }
        if (!inUl) { processedLines.push('<ul>'); inUl = true; }
        processedLines.push('<li>' + ulMatch[1] + '</li>');
      } else if (olMatch) {
        if (inUl) { processedLines.push('</ul>'); inUl = false; }
        if (!inOl) { processedLines.push('<ol>'); inOl = true; }
        processedLines.push('<li>' + olMatch[1] + '</li>');
      } else {
        if (inUl) { processedLines.push('</ul>'); inUl = false; }
        if (inOl) { processedLines.push('</ol>'); inOl = false; }
        processedLines.push(line);
      }
    }
    if (inUl) processedLines.push('</ul>');
    if (inOl) processedLines.push('</ol>');

    escaped = processedLines.join('\n');

    // 9. Split paragraphs
    var paragraphs = escaped.split(/\n\s*\n/);
    var html = paragraphs.length > 1
      ? paragraphs.map(function (p) { 
          if (p.startsWith('<ul>') || p.startsWith('<ol>') || p.startsWith('<pre')) return p;
          return '<p>' + p.replace(/\n/g, '<br/>') + '</p>'; 
        }).join('')
      : escaped.replace(/\n/g, '<br/>');

    // Clean up br tags inside list tags if any
    html = html.replace(/<\/li><br\/>/g, '</li>');
    html = html.replace(/<ul><br\/>/g, '<ul>');
    html = html.replace(/<ol><br\/>/g, '<ol>');

    // 10. Restore Links
    for (var i = 0; i < links.length; i++) {
      html = html.split('§§ZRLINK' + i + '§§').join(links[i]);
    }

    // 11. Restore Inline Codes
    for (var j = 0; j < inlineCodes.length; j++) {
      html = html.split('§§ZRCODE' + j + '§§').join(inlineCodes[j]);
    }

    // 12. Restore Code Blocks
    for (var k = 0; k < codeBlocks.length; k++) {
      html = html.split('§§ZRBLOCK' + k + '§§').join(codeBlocks[k]);
    }

    return html;
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function appendMessage(role, text, isRawHtml) {
    var msgDiv = document.createElement("div");
    msgDiv.className = "zr-msg " + (role === "user" ? "user" : "bot");
    if (role === "user") {
      msgDiv.textContent = text;
    } else if (isRawHtml) {
      msgDiv.innerHTML = text;
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
      var logo = customLogo || bot.logo || null;
      if (avatarLogoElem) {
        if (logo) {
          avatarLogoElem.src = logo;
          avatarLogoElem.style.display = "block";
        } else {
          avatarLogoElem.style.display = "none";
        }
      }

      if (footerBadgeElem) {
        if (bot.showBadge) {
          footerBadgeElem.style.display = "block";
          initBrandingWatchdog();
        } else {
          footerBadgeElem.style.display = "none";
        }
      }

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

    var botMsgElem = appendMessage(
      "assistant",
      '<div class="zr-typing-dots"><span class="zr-dot"></span><span class="zr-dot"></span><span class="zr-dot"></span></div>',
      true
    );

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

