import { Config } from "@/application/config/index.js";
import { Database } from "@/infrastructure/data/database.js";
import { createServer } from "@/presentation/server.js";
import { BackgroundJobs } from "@/infrastructure/background-jobs/index.js";
import { Redis } from "@/infrastructure/cache/redis.js";
import { PinoLogger } from "@/infrastructure/logger/pino-logger.js";
import { RedisSessionStore } from "@/infrastructure/cache/redis-session-store.js";
import { setupRepositories } from "@/app/setup-repositories.js";
import { setupServices } from "@/app/setup-services.js";
import { setupDomainEventPublisher } from "@/app/setup-domain-event-publisher.js";
import { setupUseCases } from "@/app/setup-use-cases.js";
import { S3ObjectStorage } from "@/infrastructure/object-storage/s3-object-storage.js";

export const createApp = async (config: Config) => {
  const logger = new PinoLogger(config.logger);

  const db = new Database(config.database);
  const redis = new Redis(config.redis, logger);

  await redis.connect();

  const { unitOfWork, userRepository, outboxRepository, workspaceRepository } =
    setupRepositories(db);
  const { passwordHasher, tokenGenerator, emailSender, emailTemplateRenderer, oauthClientFactory } =
    setupServices(config.application, config.smtp, config.oauth);

  const sessionStore = new RedisSessionStore(redis.client, config.redis);
  const objectStorage = new S3ObjectStorage(config.s3);

  const domainEventPublisher = setupDomainEventPublisher(sessionStore, logger);

  const useCases = setupUseCases({
    unitOfWork,
    userRepository,
    outboxRepository,
    workspaceRepository,
    passwordHasher,
    tokenGenerator,
    cache: redis,
    sessionStore,
    config: config.application,
    oauthClientFactory,
    domainEventPublisher,
    objectStorage,
  });

  const backgroundJobs = new BackgroundJobs(
    unitOfWork,
    emailSender,
    emailTemplateRenderer,
    sessionStore,
    logger,
  );

  const server = await createServer(config, useCases, {
    logger: logger.logger,
    onListen: () => backgroundJobs.start(),
    onClose: async () => {
      backgroundJobs.stop();
      objectStorage.close();
      await Promise.all([db.destroy(), redis.close()]);
    },
  });

  return server;
};
