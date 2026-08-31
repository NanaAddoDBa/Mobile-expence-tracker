import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, Transporter } from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;
  private readonly fromAddress: string | null;
  private readonly frontendUrl: string;

  constructor(config: ConfigService) {
    const host = config.get<string>("SMTP_HOST")?.trim();
    const fromAddress = config.get<string>("EMAIL_FROM")?.trim();
    const user = config.get<string>("SMTP_USER")?.trim();
    const password = config.get<string>("SMTP_PASSWORD")?.trim();
    const port = Number(config.get<string>("SMTP_PORT") || 587);
    const secure = config.get<string>("SMTP_SECURE") === "true";
    const connectionTimeout = Number(
      config.get<string>("SMTP_CONNECTION_TIMEOUT_MS") || 10_000,
    );

    this.frontendUrl = (
      config.get<string>("APP_PUBLIC_URL") ||
      config.get<string>("FRONTEND_ORIGIN") ||
      "http://localhost:3000"
    )
      .split(",")[0]
      .trim();
    this.fromAddress = fromAddress || null;
    this.transporter =
      host && fromAddress
        ? createTransport({
            host,
            port,
            secure,
            connectionTimeout,
            greetingTimeout: connectionTimeout,
            socketTimeout: Math.max(connectionTimeout, 20_000),
            ...(user && password
              ? { auth: { user, pass: password } }
              : {}),
          })
        : null;
  }

  async sendEmailVerification(
    recipient: string,
    token: string,
  ): Promise<boolean> {
    const verificationUrl = this.createFrontendUrl(
      "emailVerificationToken",
      token,
    );
    return this.send({
      recipient,
      subject: "Verify your Expense Tracker email",
      text: `Verify your email address by opening this link: ${verificationUrl}`,
      html: `<p>Verify your email address to secure your Expense Tracker account.</p><p><a href="${verificationUrl}">Verify email address</a></p><p>This link expires in 24 hours.</p>`,
    });
  }

  async sendPasswordReset(recipient: string, token: string): Promise<boolean> {
    const resetUrl = this.createFrontendUrl("passwordResetToken", token);
    return this.send({
      recipient,
      subject: "Reset your Expense Tracker password",
      text: `Reset your password by opening this link: ${resetUrl}`,
      html: `<p>A password reset was requested for your Expense Tracker account.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 30 minutes. Ignore this email if you did not request it.</p>`,
    });
  }

  private createFrontendUrl(parameter: string, token: string): string {
    const url = new URL(this.frontendUrl);
    url.searchParams.set(parameter, token);
    return url.toString();
  }

  private async send(input: {
    recipient: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<boolean> {
    if (!this.transporter || !this.fromAddress) {
      this.logger.warn(
        "Email delivery is not configured; account email was not sent",
      );
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: input.recipient,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      return true;
    } catch (error: unknown) {
      this.logger.error(
        "Account email delivery failed",
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }
}
