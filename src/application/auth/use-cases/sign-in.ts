import { ICache } from "@/application/abstractions/cache/cache.interface.js";
import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { IPasswordHasher } from "@/application/abstractions/security/password-hasher.interface.js";
import { authCacheKeys } from "@/application/auth/auth-cache-keys.js";
import { invalidCredentials } from "@/application/auth/auth-errors.js";
import { SessionUser } from "@/application/auth/types/session-user.js";
import { ApplicationConfig } from "@/application/config/application.config.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { Password } from "@/domain/users/password.js";
import { IUserRepository } from "@/domain/users/user-repository.interface.js";
import { okAsync, ResultAsync as RsAsync } from "neverthrow";

export class SignInCommand implements ICommand<Readonly<[SessionUser, UUID]>> {
  constructor(
    public readonly email: Email,
    public readonly password: Password,
  ) {}
}

export class SignInCommandHandler implements ICommandHandler<
  SignInCommand,
  Readonly<[SessionUser, UUID]>
> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly cache: ICache,
    private readonly config: ApplicationConfig,
  ) {}

  handle(command: SignInCommand): ResultAsync<Readonly<[SessionUser, UUID]>> {
    return this.userRepository
      .getByEmail(command.email)
      .andThen((user) => {
        if (user === null || user.hashedPassword === null || !user.isValid())
          return invalidCredentials;

        return this.passwordHasher.verify(command.password, user.hashedPassword).map((success) => ({
          success,
          user,
        }));
      })
      .andThen(({ success, user }) => {
        if (!success) return invalidCredentials;

        const sessionId = UUID.generate();
        const sessionKey = authCacheKeys.session(sessionId);
        const userSessionsKey = authCacheKeys.userSessions(user.id);

        const sessionTTLSeconds = PositiveInt.create(
          this.config.sessionTTLMinutes * 60,
        )._unsafeUnwrap();
        const score = Date.now() + sessionTTLSeconds.value * 1000;

        return this.cache
          .getSortedSet<string>(userSessionsKey, "asc")
          .andThen((values) => {
            if (values.length >= this.config.maxSessions) {
              return RsAsync.combine([
                this.cache.removeFromSortedSet(userSessionsKey, values[0]),
                this.cache.del(authCacheKeys.session(UUID.create(values[0])._unsafeUnwrap())),
              ]);
            }

            return okAsync();
          })
          .andThen(() =>
            this.cache.addToSortedSet(
              userSessionsKey,
              sessionId.value,
              PositiveInt.create(score)._unsafeUnwrap(),
            ),
          )
          .andThen(() => {
            const sessionUser: SessionUser = {
              id: user.id.value,
              email: user.email.value,
              firstName: user.firstName.value,
              lastName: user.lastName.value,
              role: user.role.value as "admin" | "regular",
            };

            return this.cache
              .set(sessionKey, sessionUser, sessionTTLSeconds)
              .map(() => [sessionUser, sessionId] as const);
          });
      });
  }
}
