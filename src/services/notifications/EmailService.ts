import nodemailer from "nodemailer";

/**
 * Enterprise Email Service using Nodemailer
 */
export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.resend.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "resend",
      pass: process.env.SMTP_PASSWORD,
    },
  });

  /**
   * Sends a password reset email to the user
   */
  static async sendPasswordResetEmail(email: string, resetLink: string) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@payxmint.com",
      to: email,
      subject: "Reset your PayxMint password",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
          <h2 style="color: #0f172a; font-weight: 800; tracking: -0.025em;">Reset your password</h2>
          <p style="color: #64748b; font-size: 14px; line-height: 24px;">
            Someone requested a password reset for your PayxMint account. If this was you, click the button below to set a new password.
          </p>
          <div style="margin: 32px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">
              Reset Password
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 20px;">
            If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.
          </p>
          <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">
            © 2026 PayxMint Core Infrastructure
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL_SERVICE] Reset email sent successfully to ${email}`);
    } catch (error: any) {
      console.error("[EMAIL_SERVICE_ERROR] Failed to send email:", error.message);
      throw new Error("Failed to send reset email");
    }
  }
}
