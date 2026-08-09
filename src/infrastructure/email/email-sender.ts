import { EmailMessage } from "@/application/abstractions/email/email-message.type.js";
import { IEmailSender } from "@/application/abstractions/email/email-sender.interface.js";
import { SmtpConfig } from "@/application/config/smtp.config.js";
import { internal } from "@/domain/abstractions/errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { fromPromise } from "neverthrow";
import nodemailer, { Transporter } from "nodemailer";

export class EmailSender implements IEmailSender {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: SmtpConfig) {
    this.from = config.from;

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
      connectionTimeout: config.connectionTimeoutInSeconds * 1000,
    });
  }

  send(message: EmailMessage): ResultAsync<void> {
    return fromPromise(
      this.transporter.sendMail({
        from: this.from,
        to: message.to.value,
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      (err) => internal("Email sender", err),
    );
  }
}
