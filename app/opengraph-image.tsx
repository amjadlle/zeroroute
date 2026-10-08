import { ImageResponse } from "next/og";

export const alt = "ZeroRoute — 1-Line Custom AI Chatbot & Multi-Cloud Gateway";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          backgroundColor: "#050608",
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(229, 51, 59, 0.25) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(245, 158, 11, 0.15) 0%, transparent 50%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#e5333b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: "900",
                color: "#ffffff",
                boxShadow: "0 4px 20px rgba(229, 51, 59, 0.5)",
              }}
            >
              ZR
            </div>
            <span style={{ fontSize: "36px", fontWeight: "800", letterSpacing: "-1px" }}>
              ZeroRoute
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "700",
                backgroundColor: "rgba(229, 51, 59, 0.2)",
                color: "#f87171",
                padding: "4px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(229, 51, 59, 0.4)",
              }}
            >
              v1.0.1
            </span>
          </div>

          <div
            style={{
              fontSize: "14px",
              fontWeight: "800",
              color: "#fbbf24",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              padding: "8px 18px",
              borderRadius: "10px",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            11 Pooled AI Providers
          </div>
        </div>

        {/* Main Pitch */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: "900",
              lineHeight: "1.15",
              letterSpacing: "-1.5px",
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>1-Line Custom AI Chatbot</span>
            <span
              style={{
                backgroundImage: "linear-gradient(90deg, #f87171, #fbbf24)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              &amp; Multi-Cloud API Gateway
            </span>
          </div>
          <p
            style={{
              fontSize: "22px",
              color: "#94a3b8",
              maxWidth: "950px",
              lineHeight: "1.4",
              margin: 0,
            }}
          >
            Intelligent sub-8ms routing across Gemini, Groq, Cerebras, Mistral, SambaNova, and Cohere.
            10,000 monthly requests, website crawler, and white-label widget included.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div style={{ display: "flex", gap: "12px" }}>
            {["1-Line Embed", "OpenAI Compatible", "&lt;8ms Response", "Auto-Failover", "White-Label"].map(
              (badge) => (
                <div
                  key={badge}
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    color: "#cbd5e1",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                  }}
                >
                  {badge}
                </div>
              )
            )}
          </div>

          <div
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "#f87171",
              fontFamily: "monospace",
            }}
          >
            zeroroute.mapki.in
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
