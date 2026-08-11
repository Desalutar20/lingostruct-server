import { ICache } from "@/application/abstractions/cache/cache.interface.js";
import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { authCacheKeys } from "@/application/auth/auth-cache-keys.js";
import { invalidTokenError, userNotFoundError } from "@/application/auth/auth-errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { UserId } from "@/domain/users/user-id.js";
import { IUserRepository } from "@/domain/users/user-repository.interface.js";

export class VerifyAccountCommand implements ICommand {
  constructor(
    public readonly email: Email,
    public readonly token: NonEmptyString,
  ) {}
}

export class VerifyAccountCommandHandler implements ICommandHandler<VerifyAccountCommand> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cache: ICache,
  ) {}

  handle(command: VerifyAccountCommand): ResultAsync<void> {
    return this.cache
      .getDel<string>(authCacheKeys.verificationToken(command.token.value))
      .andThen((value) => {
        if (value === null) return invalidTokenError;

        var parsedId = UserId.create(value);
        if (parsedId.isErr()) return invalidTokenError;

        return this.userRepository.getById(parsedId.value).andThen((user) => {
          if (!user) return userNotFoundError;

          return user.verify().asyncAndThen(() => this.userRepository.update(user));
        });
      });
  }
}
