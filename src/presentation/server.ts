import Fastify from "fastify";
import { ApplicationConfig, Config } from "@/application/config/index.js";
import crypto from "node:crypto";
import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { SignUpCommand } from "@/application/auth/use-cases/sign-up.js";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import fastifyAutoload from "@fastify/autoload";
import path from "node:path";
import pino from "pino";
import { RateLimitConfig } from "@/application/config/rate-limit.config.js";

export type UseCases = {
  auth: {
    signUp: ICommandHandler<SignUpCommand>;
  };
};

declare module "fastify" {
  interface FastifyInstance {
    applicationConfig: ApplicationConfig;
    rateLimitConfig: RateLimitConfig;
    useCases: UseCases;
  }
}

export const createServer = async (
  config: Config,
  useCases: UseCases,
  {
    logger,
    onListen,
    onClose,
  }: {
    logger?: pino.Logger;
    onListen?: () => void | Promise<void>;
    onClose?: () => void | Promise<void>;
  } = {},
) => {
  const app = Fastify({
    ...(logger ? { loggerInstance: logger } : { logger: true }),
    genReqId: () => crypto.randomUUID(),
  }).withTypeProvider<ZodTypeProvider>();

  app.decorate("applicationConfig", config.application);
  app.decorate("rateLimitConfig", config.rateLimit);
  app.decorate("useCases", useCases);

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "shared/plugins/external"),
    options: { ...app.options },
  });

  app.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "shared/plugins/internal"),
    options: { ...app.options },
  });

  app.register(fastifyAutoload, {
    dir: import.meta.dirname,
    dirNameRoutePrefix: false,
    matchFilter: (path) => path.includes("/v1/"),
    options: {
      prefix: "/api/v1",
    },
  });

  app.addHook("onListen", () => onListen?.());
  app.addHook("preClose", () => onClose?.());

  await app.ready();

  return app;
};
