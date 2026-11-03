import { render } from "@react-email/render";
import VerificationEmail from "@/emails/verification-email";
import WelcomeEmail from "@/emails/welcome-email";
import TransactionNotificationEmail from "@/emails/transaction-notification-email";
import { _escrowConfig } from "@/config";
import { zohomail, zohomailInMemory } from "@/services/zohomail.service";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  useZoho?: boolean;
}

export class EmailService {
  //   private transporter: nodemailer.Transporter;

  //   constructor() {
  //     this.transporter = nodemailer.createTransport({
  //       host: process.env.EMAIL_SERVER_HOST,
  //       port: Number(process.env.EMAIL_SERVER_PORT),
  //       auth: {
  //         user: process.env.EMAIL_SERVER_USER,
  //         pass: process.env.EMAIL_SERVER_PASSWORD,
  //       },
  //       secure: process.env.NODE_ENV === "production",
  //     });
  //   }

  public async sendEmail({
    to,
    subject,
    html,
    useZoho = false, // Default to using Zoho
  }: EmailOptions): Promise<void> {
    try {
      if (useZoho) {
        await zohomailInMemory.sendEmail("890104447", {
          from: {
            email: _escrowConfig.mails.noreply,
            user_name: "CMIGL Escrow", // Sender name
          },
          to: [
            {
              email: to,
              user_name: to.split("@")[0], // Extract name from email
            },
          ],
          subject,
          content: html,
          mail_format: "html",
        });
      } else {
        // Resend (no new dependency: plain fetch to the Resend API).
        // EMAIL_FROM must be an address on a domain verified in Resend
        // (escrow.cmigl.org); it falls back to noreply@escrow.cmigl.org.
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          throw new Error("RESEND_API_KEY environment variable not set");
        }
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:
              process.env.EMAIL_FROM ||
              "CMIGL Escrow <noreply@escrow.cmigl.org>",
            to: [to],
            subject,
            html,
          }),
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          throw new Error(
            `Resend send failed (${res.status}): ${detail}`.trim()
          );
        }
      }
    } catch (error) {
      console.error("Failed to send email:", error);
      throw new Error("Failed to send email");
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;
    const html = await render(VerificationEmail({ verificationUrl }));

    await this.sendEmail({
      to: email,
      subject: "Verify your email address",
      html,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const html = await render(WelcomeEmail({ name }));

    await this.sendEmail({
      to: email,
      subject: "Welcome to CMIGL Escrow",
      html,
    });
  }

  async sendTransactionNotificationEmail(
    email: string,
    transactionId: string,
    type: "created" | "updated" | "completed",
    details: Record<string, any>
  ): Promise<void> {
    const html = await render(
      TransactionNotificationEmail({
        transactionId,
        type,
        details,
      })
    );

    const subjects = {
      created: "New Transaction Created",
      updated: "Transaction Status Updated",
      completed: "Transaction Completed",
    };

    await this.sendEmail({
      to: email,
      subject: subjects[type],
      html,
    });
  }

  async sendPaymentReceiptEmail(
    email: string,
    amount: number,
    reference: string
  ): Promise<void> {
    const html = `
      <div>
        <h1>Payment Receipt</h1>
        <p>Thank you for your payment of ₦${amount.toFixed(2)}.</p>
        <p>Reference: ${reference}</p>
        <p>This is an automated email, please do not reply.</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: "Payment Receipt",
      html,
    });
  }
  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${_escrowConfig.publicUrl}auth/reset-password?token=${token}`;

    const subject = "Reset Your CMIGL Escrow Password";
    const text = `
      Hello,
      
      You requested to reset your password for your CMIGL Escrow account.
      
      Please click the link below to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you did not request a password reset, please ignore this email.
      
      Regards,
      CMIGL Escrow Team
    `;

    await this.sendEmail({
      to: email,
      subject,
      html: text,
    });
  }
}

export const emailService = new EmailService();
