import { OutboxEmailData } from "@/application/abstractions/database/outbox/outbox-data.type.js";
import { EmailMessage } from "@/application/abstractions/email/email-message.type.js";
import { ApplicationConfig } from "@/application/config/application.config.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const data: Record<
  OutboxEmailData["type"],
  {
    templates: { html: string; text: string };
    placeholder: string;
    subject: string;
  }
> = {
  accountVerification: {
    templates: {
      html: readFileSync(
        join(__dirname, "./templates/account-verification/account-verification.html"),
      ).toString(),
      text: readFileSync(
        join(__dirname, "./templates/account-verification/account-verification.txt"),
      ).toString(),
    },
    placeholder: "{{verificationUrl}}",
    subject: "Account verification",
  },
  passwordReset: {
    templates: {
      html: readFileSync(
        join(__dirname, "./templates/reset-password/reset-password.html"),
      ).toString(),
      text: readFileSync(
        join(__dirname, "./templates/reset-password/reset-password.txt"),
      ).toString(),
    },
    placeholder: "{{resetPasswordUrl}}",
    subject: "Reset password",
  },
};

export class EmailTemplateRenderer {
  constructor(private readonly config: ApplicationConfig) {}

  public render(type: OutboxEmailData["type"], email: Email, token: string): EmailMessage {
    const path = this.getPath(type);
    const url = new URL(path, this.config.clientUrl);

    url.searchParams.set("token", token);
    url.searchParams.set("email", email.value);

    const {
      templates: { html, text },
      placeholder,
      subject,
    } = data[type];

    return {
      to: email,
      subject,
      html: html.replaceAll(placeholder, url.toString()),
      text: text.replaceAll(placeholder, url.toString()),
    };
  }

  private getPath(type: OutboxEmailData["type"]) {
    switch (type) {
      case "accountVerification":
        return this.config.accountVerificationPath;
      case "passwordReset":
        return this.config.resetPasswordPath;

      default:
        const x: never = type;
        return x;
    }
  }
}
