import { EmailMessage } from "@/application/abstractions/email/email-message.type.js";
import { ApplicationConfig } from "@/application/config/application.config.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const accountVerificationTemplateHtml = readFileSync(
  join(__dirname, "./templates/account-verification/account-verification.html"),
).toString();
const accountVerificationTemplateTxt = readFileSync(
  join(__dirname, "./templates/account-verification/account-verification.txt"),
).toString();

export class EmailTemplateRenderer {
  constructor(private readonly config: ApplicationConfig) {}

  public renderAccountVerificationEmail(email: Email, token: string): EmailMessage {
    const url = `${this.config.clientUrl}${this.config.accountVerificationPath}?token=${encodeURI(token)}&email=${encodeURI(email.value)}`;

    const html = accountVerificationTemplateHtml.replace("{{verificationUrl}}", url);
    const text = accountVerificationTemplateTxt.replace("{{verificationUrl}}", url);

    return {
      to: email,
      subject: "Account verification",
      text,
      html,
    };
  }
}
