import { Email } from "@/domain/shared/value-objects/email.js";

export type EmailMessage = {
  to: Email;
  subject: string;
  text: string;
  html?: string;
};
