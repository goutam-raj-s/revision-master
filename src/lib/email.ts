import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  console.log("=== EMAIL DEBUG ===");
  console.log("GMAIL_USER:", process.env.GMAIL_USER);
  console.log("GMAIL_APP_PASSWORD:", process.env.GMAIL_APP_PASSWORD);
  console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);
  console.log("Attempting to send to:", to);

  try {
    const info = await transport.sendMail({
      from: `"lostbae" <${process.env.GMAIL_USER}>`,
      to,
    subject: "Reset your lostbae password",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #4f7942; border-radius: 16px; margin-bottom: 16px;">
                <span style="font-size: 28px;">🧠</span>
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #1c2e1a;">Reset your password</h1>
            </div>

            <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              We received a request to reset the password for your lostbae account. Click the button below to choose a new password.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #4f7942; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px;">
                Reset Password
              </a>
            </div>

            <p style="color: #718096; font-size: 13px; line-height: 1.6; margin: 0 0 8px;">
              This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
            </p>

            <p style="color: #a0aec0; font-size: 12px; margin: 24px 0 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
              Or copy this URL into your browser:<br />
              <span style="color: #4f7942; word-break: break-all;">${resetUrl}</span>
            </p>
          </div>
        </body>
      </html>
    `,
    });
    console.log("=== EMAIL SENT SUCCESSFULLY ===");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
  } catch (error) {
    console.error("=== NODEMAILER ERROR ===");
    console.error(error);
    throw error; // Re-throw so the auth.ts action can catch it
  }
}
