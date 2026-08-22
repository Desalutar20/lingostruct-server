import { ApplicationConfig } from "@/application/config/index.js";
import { UseCases } from "@/presentation/server.js";
import { SignUpCommandHandler } from "@/application/auth/use-cases/sign-up.js";
import { IUnitOfWork } from "@/application/abstractions/database/unit-of-work.interface.js";
import { IPasswordHasher } from "@/application/abstractions/security/password-hasher.interface.js";
import { ITokenGenerator } from "@/application/abstractions/security/token-generator.interface.js";
import { ICache } from "@/application/abstractions/cache/cache.interface.js";
import { VerifyAccountCommandHandler } from "@/application/auth/use-cases/verify-account.js";
import { IUserRepository } from "@/domain/user/user-repository.interface.js";
import { SignInCommandHandler } from "@/application/auth/use-cases/sign-in.js";
import { ISessionStore } from "@/application/abstractions/auth/session-store.interface.js";
import { IOutboxRepository } from "@/application/abstractions/database/outbox/outbox-repository.interface.js";
import { ForgotPasswordCommandHandler } from "@/application/auth/use-cases/forgot-password.js";
import { ResetPasswordCommandHandler } from "@/application/auth/use-cases/reset-password.js";
import { AuthenticateCommandHandler } from "@/application/auth/use-cases/authenticate.js";
import { LogoutCommandHandler } from "@/application/auth/use-cases/logout.js";
import { IOAuthClientFactory } from "@/application/abstractions/auth/oauth-client-factory.interface.js";
import { GenerateOAuthUrlCommandHandler } from "@/application/auth/use-cases/generate-oauth-url.js";
import { OAuthSignInCommandHandler } from "@/application/auth/use-cases/oauth-sign-in.js";
import { UpdateProfileCommandHandler } from "@/application/user/use-cases/update-profile.js";
import { IDomainEventPublisher } from "@/application/abstractions/domain-events/domain-event-publisher.interface.js";
import { CreatePresignedUrlCommandHandler } from "@/application/object-storage/use-cases/create-presigned-url.js";
import { IObjectStorage } from "@/application/abstractions/object-storage/object-storage.interface.js";
import { GetUsersQueryHandlers } from "@/application/admin/users/use-cases/get-users.js";

export const setupUseCases = ({
  unitOfWork,
  userRepository,
  outboxRepository,
  passwordHasher,
  tokenGenerator,
  cache,
  sessionStore,
  config,
  oauthClientFactory,
  domainEventPublisher,
  objectStorage,
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
  domainEventPublisher: IDomainEventPublisher;
  objectStorage: IObjectStorage;
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
      signIn: new SignInCommandHandler(
        userRepository,
        passwordHasher,
        sessionStore,
        objectStorage,
        config,
      ),
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
        objectStorage,
        config,
      ),
    },
    users: {
      getUsers: new GetUsersQueryHandlers(userRepository),
      updateProfile: new UpdateProfileCommandHandler(
        userRepository,
        domainEventPublisher,
        objectStorage,
      ),
    },
    files: {
      createPresignedUrl: new CreatePresignedUrlCommandHandler(objectStorage),
    },
  };
};
