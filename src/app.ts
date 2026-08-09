import { Kysely } from "kysely";
import { Config } from "@/application/config/index.js";
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

const setupRepositories = (db: Kysely<DB>) => {
  return {
    unitOfWork: new UnitOfWork(db),
    userRepository: new UserRepository(db),
  };
};

const setupServices = (
  config: SmtpConfig,
): {
  passwordHasher: IPasswordHasher;
  tokenGenerator: ITokenGenerator;
  emailSender: IEmailSender;
} => {
  return {
    passwordHasher: new PasswordHasher(),
    tokenGenerator: new TokenGenerator(),
    emailSender: new EmailSender(config),
  };
};

const setupUseCases = (
  unitOfWork: IUnitOfWork,
  passwordHasher: IPasswordHasher,
  tokenGenerator: ITokenGenerator,
  cache: ICache,
): UseCases => {
  return {
    auth: {
      signUp: new SignUpCommandHandler(unitOfWork, passwordHasher, tokenGenerator, cache),
    },
  };
};

export const createApp = async (config: Config) => {
  const logger = new PinoLogger(config.logger);

  const db = new Database(config.database);
  const redis = new Redis(config.redis, logger);

  await redis.connect();

  const { unitOfWork } = setupRepositories(db);
  const { passwordHasher, tokenGenerator, emailSender } = setupServices(config.smtp);
  const backgroundJobs = new BackgroundJobs(unitOfWork, emailSender, logger);

  const useCases = setupUseCases(unitOfWork, passwordHasher, tokenGenerator, redis);

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
