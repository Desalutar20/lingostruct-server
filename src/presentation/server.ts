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
import { VerifyAccountCommand } from "@/application/auth/use-cases/verify-account.js";
import { SignInCommand } from "@/application/auth/use-cases/sign-in.js";
import { Session } from "@/application/abstractions/auth/session.type.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { ForgotPasswordCommand } from "@/application/auth/use-cases/forgot-password.js";
import { ResetPasswordCommand } from "@/application/auth/use-cases/reset-password.js";
import { AuthenticateCommand } from "@/application/auth/use-cases/authenticate.js";
import { LogoutCommand } from "@/application/auth/use-cases/logout.js";
import { GenerateOAuthUrlCommand } from "@/application/auth/use-cases/generate-oauth-url.js";
import { OAuthSignInCommand } from "@/application/auth/use-cases/oauth-sign-in.js";
import { UpdateProfileCommand } from "@/application/user/use-cases/update-profile.js";
import { IObjectStorage } from "@/application/abstractions/object-storage/object-storage.interface.js";
import { URL } from "@/domain/shared/value-objects/url.js";
import { CreatePresignedUrlCommand } from "@/application/object-storage/use-cases/create-presigned-url.js";
import { OAuthState } from "@/application/abstractions/auth/oauth-state.js";
import { IQueryHandler } from "@/application/abstractions/cqrs/query-handler.interface.js";
import { GetUsersQuery } from "@/application/admin/users/use-cases/get-users.js";
import { KeysetPaginated } from "@/domain/shared/pagination/keyset-paginated.js";
import { UserId } from "@/domain/user/user-id.js";
import { AdminUserDto } from "@/application/admin/users/dto/admin-user.dto.js";

export type UseCases = {
  auth: {
    signUp: ICommandHandler<SignUpCommand, void>;
    signIn: ICommandHandler<SignInCommand, Readonly<[Session, UUID]>>;
    verifyAccount: ICommandHandler<VerifyAccountCommand, void>;
    forgotPassword: ICommandHandler<ForgotPasswordCommand, void>;
    resetPassword: ICommandHandler<ResetPasswordCommand, void>;
    authenticate: ICommandHandler<AuthenticateCommand, Session>;
    logout: ICommandHandler<LogoutCommand, void>;
    generateOAuthUrl: ICommandHandler<GenerateOAuthUrlCommand, [URL, OAuthState]>;
    oauthSignIn: ICommandHandler<OAuthSignInCommand, UUID>;
  };
  users: {
    getUsers: IQueryHandler<GetUsersQuery, KeysetPaginated<AdminUserDto, UserId>>;
    updateProfile: ICommandHandler<UpdateProfileCommand, void>;
  };
  files: {
    createPresignedUrl: ICommandHandler<
      CreatePresignedUrlCommand,
      { uploadUrl: URL; publicUrl: URL }
    >;
  };
};

declare module "fastify" {
  interface FastifyInstance {
    applicationConfig: ApplicationConfig;
    rateLimitConfig: RateLimitConfig;
    useCases: UseCases;
    objectStorage: IObjectStorage;
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

  app.addHook("onListen", async () => await onListen?.());
  app.addHook("onClose", async () => await onClose?.());

  await app.ready();

  return app;
};
