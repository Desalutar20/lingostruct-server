import { IOAuthClientFactory } from "@/application/abstractions/auth/oauth-client-factory.interface.js";
import { IEmailSender } from "@/application/abstractions/email/email-sender.interface.js";
import { IPasswordHasher } from "@/application/abstractions/security/password-hasher.interface.js";
import { ITokenGenerator } from "@/application/abstractions/security/token-generator.interface.js";
import { ApplicationConfig } from "@/application/config/application.config.js";
import { OAuthConfig } from "@/application/config/oauth.config.js";
import { SmtpConfig } from "@/application/config/smtp.config.js";
import { OAuthClientFactory } from "@/infrastructure/auth/oauth-client-factory.js";
import { EmailSender } from "@/infrastructure/email/email-sender.js";
import { EmailTemplateRenderer } from "@/infrastructure/email/email-template-renderer.js";
import { PasswordHasher } from "@/infrastructure/security/password-hasher.js";
import { TokenGenerator } from "@/infrastructure/security/token-generator.js";

export const setupServices = (
  applicationConfig: ApplicationConfig,
  smtpConfig: SmtpConfig,
  oauthConfig: OAuthConfig,
): {
  passwordHasher: IPasswordHasher;
  tokenGenerator: ITokenGenerator;
  emailSender: IEmailSender;
  emailTemplateRenderer: EmailTemplateRenderer;
  oauthClientFactory: IOAuthClientFactory;
} => {
  return {
    passwordHasher: new PasswordHasher(),
    tokenGenerator: new TokenGenerator(),
    emailSender: new EmailSender(smtpConfig),
    emailTemplateRenderer: new EmailTemplateRenderer(applicationConfig),
    oauthClientFactory: new OAuthClientFactory(oauthConfig),
  };
};
