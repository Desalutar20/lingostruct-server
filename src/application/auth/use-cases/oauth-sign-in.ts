import { IOAuthClientFactory } from "@/application/abstractions/auth/oauth-client-factory.interface.js";
import { OAuthState } from "@/application/abstractions/auth/oauth-state.js";
import { ISessionStore } from "@/application/abstractions/auth/session-store.interface.js";
import { Session } from "@/application/abstractions/auth/session.type.js";
import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { IObjectStorage } from "@/application/abstractions/object-storage/object-storage.interface.js";
import { ApplicationConfig } from "@/application/config/application.config.js";
import { failure } from "@/domain/abstractions/errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { OAuthProvider } from "@/domain/user/oauth-provider.js";
import { IUserRepository } from "@/domain/user/user-repository.interface.js";
import { User } from "@/domain/user/user.js";
import { errAsync, ok, okAsync } from "neverthrow";

export class OAuthSignInCommand implements ICommand<UUID> {
  constructor(
    public readonly provider: OAuthProvider,
    public readonly code: NonEmptyString,
    public readonly receivedState: OAuthState,
    public readonly expectedState: OAuthState,
  ) {}
}

export class OAuthSignInCommandHandler implements ICommandHandler<OAuthSignInCommand, UUID> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly oauthClientFactory: IOAuthClientFactory,
    private readonly sessionStore: ISessionStore,
    private readonly objectStorage: IObjectStorage,
    private readonly config: ApplicationConfig,
  ) {}

  handle(command: OAuthSignInCommand): ResultAsync<UUID> {
    const provider = this.oauthClientFactory.get(command.provider);

    if (!provider.isValidState(command.receivedState, command.expectedState)) {
      return errAsync(failure("Invalid state", "OPERATION_FAILED"));
    }

    return provider
      .getUser(command.code)
      .andThen((oauthUser) =>
        this.userRepository.getByEmail(oauthUser.email).map((user) => ({ user, oauthUser })),
      )
      .andThen(({ user, oauthUser }) => {
        if (!user) {
          const newUser = new User(null, null, oauthUser.email, null);
          newUser.linkProvider(command.provider, oauthUser.providerId);
          newUser.verify();

          return this.userRepository.create(newUser).map(() => newUser);
        }

        if (user.linkProvider(command.provider, oauthUser.providerId)) {
          return this.userRepository.update(user).map(() => user);
        }

        return ok(user);
      })
      .andThen((user) =>
        this.sessionStore
          .getSessionIds(user.id)
          .map((sessionIds) => ({ sessionIds, user }))
          .andThen(({ sessionIds, user }) => {
            if (sessionIds.length >= this.config.maxSessions) {
              return this.sessionStore.delete(user.id, sessionIds[0]).map(() => user);
            }

            return okAsync(user);
          })
          .andThen((user) => {
            const sessionId = UUID.generate();

            const session: Session = {
              id: user.id.value,
              email: user.email.value,
              firstName: user.firstName?.value ?? null,
              lastName: user.lastName?.value ?? null,
              role: user.role.value,
              avatarUrl: user.avatarUrl?.value ?? null,
            };

            const sessionTTLSeconds = PositiveInt.create(
              this.config.sessionTTLMinutes * 60,
            )._unsafeUnwrap();

            return this.sessionStore
              .save(user.id, sessionId, session, sessionTTLSeconds)
              .map(() => sessionId);
          }),
      );
  }
}
