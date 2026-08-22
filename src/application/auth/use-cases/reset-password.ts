import { ISessionStore } from "@/application/abstractions/auth/session-store.interface.js";
import { ICache } from "@/application/abstractions/cache/cache.interface.js";
import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { IPasswordHasher } from "@/application/abstractions/security/password-hasher.interface.js";
import { authCacheKeys } from "@/application/auth/auth-cache-keys.js";
import { invalidTokenError, userNotFoundError } from "@/application/auth/auth-errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { Password } from "@/domain/user/password.js";
import { UserId } from "@/domain/user/user-id.js";
import { IUserRepository } from "@/domain/user/user-repository.interface.js";

export class ResetPasswordCommand implements ICommand<void> {
  constructor(
    public readonly email: Email,
    public readonly token: NonEmptyString,
    public readonly newPassword: Password,
  ) {}
}

export class ResetPasswordCommandHandler implements ICommandHandler<ResetPasswordCommand, void> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cache: ICache,
    private readonly passwordHasher: IPasswordHasher,
    private readonly sessionStore: ISessionStore,
  ) {}

  handle(command: ResetPasswordCommand): ResultAsync<void> {
    return this.cache
      .getDel<string>(authCacheKeys.passwordResetToken(command.token.value))
      .andThen((id) => {
        if (id === null) return invalidTokenError;

        return UserId.create(id);
      })
      .andThen((userId) =>
        this.userRepository
          .getById(userId)
          .andThen((user) => {
            if (!user) return userNotFoundError;
            if (!user.email.equals(command.email)) return invalidTokenError;

            return this.passwordHasher
              .hash(command.newPassword)
              .map((hashedPassword) => ({ hashedPassword, user }));
          })
          .andThen(({ hashedPassword, user }) => {
            user.updatePassword(hashedPassword);

            return this.sessionStore
              .deleteAll(user.id)
              .andThen(() => this.userRepository.update(user));
          }),
      );
  }
}
