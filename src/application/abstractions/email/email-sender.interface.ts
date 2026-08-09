import { EmailMessage } from "@/application/abstractions/email/email-message.type.js";
import { ResultAsync } from "@/domain/abstractions/result.js";

export interface IEmailSender {
  send: (message: EmailMessage) => ResultAsync<void>;
}
