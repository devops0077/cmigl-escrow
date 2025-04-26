import { render } from "@react-email/render";
import VerificationEmail from "@/emails/verification-email";
import WelcomeEmail from "@/emails/welcome-email";
import TransactionNotificationEmail from "@/emails/transaction-notification-email";
import axios from "axios";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
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

  private async sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
    try {
      //   await this.transporter.sendMail({
      //     from: `"Vokun Escrow" <${process.env.EMAIL_FROM}>`,
      //     to,
      //     subject,
      //     html,
      //   });
      await axios.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
        to,
        subject,
        html,
      });
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
      subject: "Welcome to Vokun Escrow",
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
}

export const emailService = new EmailService();
