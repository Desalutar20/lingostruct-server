import { Kysely } from "kysely";
import { ApplicationConfig, Config } from "@/application/config/index.js";
import { Database } from "@/infrastructure/data/database.js";
import { UnitOfWork } from "@/infrastructure/data/unit-of-work.js";
import { UserRepository } from "@/infrastructure/data/users/user-repository.js";
import { createServer, UseCases } from "@/presentation/server.js";
import { DB } from "@/infrastructure/data/db.types.js";
import { SignUpCommandHandler } from "@/application/auth/use-cases/sign-up.js";
import { IUnitOfWork } from "@/application/abstractions/database/unit-of-work.interface.js";
import { IPasswordHasher } from "@/application/abstractions/security/password-hasher.interface.js";
import { PasswordHasher } from "@/infrastructure/security/password-hasher.js";
import { IEmailSender } from "@/application/abstractions/email/email-sender.interface.js";
import { SmtpConfig } from "@/application/config/smtp.config.js";
import { EmailSender } from "@/infrastructure/email/email-sender.js";
import { BackgroundJobs } from "@/infrastructure/background-jobs/index.js";
import { ITokenGenerator } from "@/application/abstractions/security/token-generator.interface.js";
import { TokenGenerator } from "@/infrastructure/security/token-generator.js";
import { Redis } from "@/infrastructure/cache/redis.js";
import { ICache } from "@/application/abstractions/cache/cache.interface.js";
import { PinoLogger } from "@/infrastructure/logger/pino-logger.js";
import { VerifyAccountCommandHandler } from "@/application/auth/use-cases/verify-account.js";
import { IUserRepository } from "@/domain/users/user-repository.interface.js";
import { EmailTemplateRenderer } from "@/infrastructure/email/email-template-renderer.js";
import { SignInCommandHandler } from "@/application/auth/use-cases/sign-in.js";
import { ISessionStore } from "@/application/abstractions/auth/session-store.interface.js";
import { RedisSessionStore } from "@/infrastructure/cache/redis-session-store.js";
import { DeleteExpiredSessionsCommandHandler } from "@/application/auth/use-cases/delete-expired-sessions.js";
import { IOutboxRepository } from "@/application/abstractions/database/outbox/outbox-repository.interface.js";
import { ForgotPasswordCommandHandler } from "@/application/auth/use-cases/forgot-password.js";
import { OutboxRepository } from "@/infrastructure/data/outbox/outbox-repository.js";
import { ResetPasswordCommandHandler } from "@/application/auth/use-cases/reset-password.js";
import { AuthenticateCommandHandler } from "@/application/auth/use-cases/authenticate.js";
import { LogoutCommandHandler } from "@/application/auth/use-cases/logout.js";
import { IOAuthClientFactory } from "@/application/abstractions/auth/oauth-client-factory.interface.js";
import { OAuthClientFactory } from "@/infrastructure/auth/oauth-client-factory.js";
import { OAuthConfig } from "@/application/config/oauth.config.js";
import { GenerateOAuthUrlCommandHandler } from "@/application/auth/use-cases/generate-oauth-url.js";
import { OAuthSignInCommandHandler } from "@/application/auth/use-cases/oauth-sign-in.js";

const setupRepositories = (db: Kysely<DB>) => {
  return {
    unitOfWork: new UnitOfWork(db),
    userRepository: new UserRepository(db),
    outboxRepository: new OutboxRepository(db),
  };
};

const setupServices = (
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

const setupUseCases = ({
  unitOfWork,
  userRepository,
  outboxRepository,
  passwordHasher,
  tokenGenerator,
  cache,
  sessionStore,
  config,
  oauthClientFactory,
}: {
  unitOfWork: IUnitOfWork;
  userRepository: IUserRepository;
  outboxRepository: IOutboxRepository;
  passwordHasher: IPasswordHasher;
  tokenGenerator: ITokenGenerator;
  cache: ICache;
  sessionStore: ISessionStore;
  config: ApplicationConfig;
  oauthClientFactory: IOAuthClientFactory;
}): UseCases => {
  return {
    auth: {
      signUp: new SignUpCommandHandler(
        unitOfWork,
        userRepository,
        passwordHasher,
        tokenGenerator,
        cache,
        config,
      ),
      signIn: new SignInCommandHandler(userRepository, passwordHasher, sessionStore, config),
      verifyAccount: new VerifyAccountCommandHandler(userRepository, cache),
      forgotPassword: new ForgotPasswordCommandHandler(
        userRepository,
        outboxRepository,
        cache,
        tokenGenerator,
        config,
      ),
      resetPassword: new ResetPasswordCommandHandler(
        userRepository,
        cache,
        passwordHasher,
        sessionStore,
      ),
      authenticate: new AuthenticateCommandHandler(sessionStore),
      logout: new LogoutCommandHandler(sessionStore),
      generateOAuthUrl: new GenerateOAuthUrlCommandHandler(oauthClientFactory),
      oauthSignIn: new OAuthSignInCommandHandler(
        userRepository,
        oauthClientFactory,
        sessionStore,
        config,
      ),
    },
  };
};

export const createApp = async (config: Config) => {
  const logger = new PinoLogger(config.logger);

  const db = new Database(config.database);
  const redis = new Redis(config.redis, logger);

  await redis.connect();

  const { unitOfWork, userRepository, outboxRepository } = setupRepositories(db);
  const { passwordHasher, tokenGenerator, emailSender, emailTemplateRenderer, oauthClientFactory } =
    setupServices(config.application, config.smtp, config.oauth);
  const sessionStore = new RedisSessionStore(redis.client, config.redis);

  const useCases = setupUseCases({
    unitOfWork,
    userRepository,
    outboxRepository,
    passwordHasher,
    tokenGenerator,
    cache: redis,
    sessionStore,
    config: config.application,
    oauthClientFactory,
  });

  const backgroundJobs = new BackgroundJobs(
    unitOfWork,
    emailSender,
    logger,
    emailTemplateRenderer,
    new DeleteExpiredSessionsCommandHandler(sessionStore),
  );

  const server = await createServer(config, useCases, {
    logger: logger.logger,
    onListen: () => backgroundJobs.start(),
    onClose: async () => {
      backgroundJobs.stop();

      await Promise.all([db.destroy(), redis.close()]);
    },
  });

  return server;
};
