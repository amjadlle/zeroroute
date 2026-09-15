/**
 * ZeroRoute Transactional Email Service
 * Supports Resend API, Cloudflare Email Workers, Webhooks, and Dev Console Logging
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const { to, subject, html, text } = options;
  const fromAddress = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "ZeroRoute <notifications@zeroroute.io>";

  // 1. Resend API Dispatch if RESEND_API_KEY configured
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && resendApiKey.trim() !== "") {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject,
          html,
          text: text || html.replace(/<[^>]+>/g, ""),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[Email:Resend] Dispatched email to ${to} (ID: ${data.id})`);
        return { success: true, id: data.id };
      } else {
        const errText = await res.text();
        console.warn(`[Email:Resend] Failed to send to ${to}:`, errText);
      }
    } catch (err: any) {
      console.error(`[Email:Resend] Error sending to ${to}:`, err);
    }
  }

  // 2. Custom Webhook / Cloudflare Worker Email Dispatch
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL;
  if (webhookUrl && webhookUrl.trim() !== "") {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          html,
          text: text || html.replace(/<[^>]+>/g, ""),
          timestamp: Date.now(),
        }),
      });

      if (res.ok) {
        console.log(`[Email:Webhook] Dispatched email to ${to}`);
        return { success: true };
      }
    } catch (err: any) {
      console.error(`[Email:Webhook] Error dispatching to ${to}:`, err);
    }
  }

  // 3. Fallback: Log to server stdout (Development / Sandbox)
  console.log(`\n========================================`);
  console.log(`[EMAIL DISPATCH - DEV SIMULATOR]`);
  console.log(`TO: ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`BODY PREVIEW:\n${text || html.replace(/<[^>]+>/g, " ").slice(0, 300)}...`);
  console.log(`========================================\n`);

  return { success: true, id: "simulated_local" };
}

/**
 * Send 6-Digit Password Reset OTP Email
 */
export async function sendPasswordResetOtpEmail(params: {
  email: string;
  otp: string;
  name?: string;
}) {
  const { email, otp, name } = params;
  const greeting = name ? `Hi ${name},` : "Hello,";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset OTP - ZeroRoute</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050608; color: #f1f5f9; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #0c0f17; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }
    .logo { color: #ef4444; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(239, 68, 68, 0.15); color: #f87171; border-radius: 9999px; font-size: 11px; font-weight: 700; margin-bottom: 16px; }
    .otp-box { background: #050608; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #f87171; }
    .footer { font-size: 11px; color: #64748b; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">⚡ ZeroRoute</div>
    <div class="badge">SECURITY VERIFICATION</div>
    <h2 style="color: #ffffff; margin-top: 0;">Password Reset Code</h2>
    <p>${greeting}</p>
    <p>You requested a verification code to reset your ZeroRoute account password. Use the single-use code below to complete the reset:</p>
    
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div style="color: #94a3b8; font-size: 11px; margin-top: 8px;">Expires in 15 minutes • Single-use only</div>
    </div>

    <p style="color: #94a3b8; font-size: 12px;">If you did not request this password reset, you can safely ignore this email. Your account remains secure.</p>
    
    <div class="footer">
      ZeroRoute Cloud AI Gateway • Zero Cost. Max Route.<br>
      Automated Security Notification
    </div>
  </div>
</body>
</html>
`;

  const text = `ZeroRoute Security Verification\n\nYour 6-digit password reset OTP is: ${otp}\n\nThis code expires in 15 minutes. If you did not request this, please ignore this email.`;

  return sendEmail({
    to: email,
    subject: `Your ZeroRoute Security Code: ${otp}`,
    html,
    text,
  });
}

/**
 * Send Welcome & Credentials Email to New Subscriber
 */
export async function sendWelcomeCredentialsEmail(params: {
  email: string;
  name: string;
  key: string;
  botId: string;
  loginUrl?: string;
}) {
  const { email, name, key, botId, loginUrl } = params;
  const targetLoginUrl = loginUrl || (process.env.APP_URL ? `${process.env.APP_URL}/login` : "https://zeroroute.mapki.in/login");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to ZeroRoute Pro</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050608; color: #f1f5f9; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #0c0f17; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }
    .logo { color: #ef4444; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(16, 185, 129, 0.15); color: #34d399; border-radius: 9999px; font-size: 11px; font-weight: 700; margin-bottom: 16px; }
    .key-box { background: #050608; border: 1px solid #334155; border-radius: 12px; padding: 16px; font-family: monospace; font-size: 12px; color: #f87171; word-break: break-all; margin: 20px 0; }
    .btn { display: inline-block; padding: 12px 24px; background: #ef4444; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; margin: 16px 0; }
    .footer { font-size: 11px; color: #64748b; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">⚡ ZeroRoute Pro</div>
    <div class="badge">ACTIVE SUBSCRIPTION</div>
    <h2 style="color: #ffffff; margin-top: 0;">Welcome to ZeroRoute Cloud, ${name}!</h2>
    <p>Your subscription is now active with high-availability 10-cloud failover and your custom embeddable AI chatbot widget.</p>
    
    <h4 style="color: #cbd5e1; margin-bottom: 4px;">Your Master Router API Key:</h4>
    <div class="key-box">${key}</div>

    <h4 style="color: #cbd5e1; margin-bottom: 4px;">Your Live Bot ID:</h4>
    <div class="key-box">${botId}</div>

    <p><a href="${targetLoginUrl}" class="btn">Open Subscriber Console</a></p>

    <!-- Free Concierge Setup Box -->
    <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 20px; margin: 24px 0;">
      <div style="color: #34d399; font-weight: 700; font-size: 14px; margin-bottom: 6px;">
        🎧 Need Help Setting Up? We'll Do It For Free!
      </div>
      <p style="font-size: 12px; color: #cbd5e1; margin: 0 0 14px 0; line-height: 1.5;">
        Not sure how to add the chatbot to WordPress, Webflow, Shopify, or your website? Book a free 15-minute 1-on-1 onboarding call with our team or reply to this email, and we will personally configure and test your AI chatbot on your site at zero cost.
      </p>
      <div>
        <a href="https://cal.com/mapki/zeroroute-setup" style="display: inline-block; padding: 10px 18px; background: #059669; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 12px; margin-right: 8px; margin-bottom: 6px;">
          📅 Book a Free 1-on-1 Setup Call
        </a>
        <a href="mailto:mapkisolutions@gmail.com?subject=ZeroRoute%20Free%20Setup%20Assistance" style="display: inline-block; padding: 10px 18px; background: rgba(255,255,255,0.1); color: #f1f5f9; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 12px; border: 1px solid rgba(255,255,255,0.15); margin-bottom: 6px;">
          ✉️ Email Support (mapkisolutions@gmail.com)
        </a>
      </div>
    </div>

    <div class="footer">
      ZeroRoute Cloud AI Gateway • Zero Cost. Max Route.<br>
      Direct Support: <a href="mailto:mapkisolutions@gmail.com" style="color: #94a3b8; text-decoration: underline;">mapkisolutions@gmail.com</a> • <a href="https://cal.com/mapki/zeroroute-setup" style="color: #94a3b8; text-decoration: underline;">Book a Setup Call</a>
    </div>
  </div>
</body>
</html>
`;

  const text = `Welcome to ZeroRoute Pro, ${name}!

Your Master Router Key: ${key}
Your Bot ID: ${botId}

Access your console: ${targetLoginUrl}

---------------------------------------------------
NEED HELP SETTING UP? WE'LL DO IT FOR FREE!
---------------------------------------------------
If you're not sure how to embed the widget into your website (WordPress, Webflow, Shopify, HTML/React), we'll do it for you 100% free!

📅 Book a Free 1-on-1 Call: https://cal.com/mapki/zeroroute-setup
✉️ Email Support: mapkisolutions@gmail.com
---------------------------------------------------`;

  return sendEmail({
    to: email,
    subject: `⚡ Welcome to ZeroRoute Pro - Credentials & Access`,
    html,
    text,
  });
}

