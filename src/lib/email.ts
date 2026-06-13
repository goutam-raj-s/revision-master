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

export async function sendDocumentShareEmail(to: string, shareUrl: string, docTitle: string): Promise<void> {
  await transport.sendMail({
    from: `"lostbae" <${process.env.GMAIL_USER}>`,
    to,
    subject: `"${docTitle}" has been shared with you`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #4f7942; border-radius: 16px; margin-bottom: 16px;">
                <span style="font-size: 28px;">🧠</span>
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #1c2e1a;">A document was shared with you</h1>
            </div>
            <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              Someone shared <strong>${docTitle}</strong> with you on lostbae. Click below to view it — no account required.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${shareUrl}" style="display: inline-block; background: #4f7942; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px;">
                View Document
              </a>
            </div>
            <p style="color: #a0aec0; font-size: 12px; margin: 24px 0 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
              Or copy this URL into your browser:<br />
              <span style="color: #4f7942; word-break: break-all;">${shareUrl}</span>
            </p>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
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
    console.log("Password reset email sent:", info.messageId);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error; // Re-throw so the auth.ts action can catch it
  }
}

export interface ReminderItem {
  title: string;
  overdueDays: number;
}

export async function sendReviewReminderEmail(
  to: string,
  name: string,
  items: ReminderItem[],
  appUrl: string
): Promise<void> {
  const rows = items
    .slice(0, 10)
    .map(
      (i) => `
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #1c2e1a; font-size: 14px;">${i.title}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: ${i.overdueDays > 0 ? "#d97706" : "#059669"}; font-size: 13px; white-space: nowrap;">
            ${i.overdueDays > 0 ? `${i.overdueDays}d overdue` : "due today"}
          </td>
        </tr>`
    )
    .join("");
  const more = items.length > 10 ? `<p style="color:#a0aec0;font-size:13px;">…and ${items.length - 10} more.</p>` : "";

  await transport.sendMail({
    from: `"lostbae" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${items.length} review${items.length !== 1 ? "s" : ""} waiting for you today`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f2; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            <h1 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #1c2e1a;">Hi ${name}, time to revise 🧠</h1>
            <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              Spaced repetition only works when you show up — here's what's due:
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">${rows}</table>
            ${more}
            <div style="text-align: center; margin: 28px 0 8px;">
              <a href="${appUrl}/dashboard" style="display: inline-block; background: #059669; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 13px 30px; border-radius: 10px;">
                Start reviewing
              </a>
            </div>
            <p style="color: #a0aec0; font-size: 12px; margin: 24px 0 0; border-top: 1px solid #e2e8f0; padding-top: 14px;">
              You can turn these reminders off in Settings → Profile.
            </p>
          </div>
        </body>
      </html>
    `,
  });
}
