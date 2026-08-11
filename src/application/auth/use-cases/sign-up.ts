import { IUnitOfWork } from "@/application/abstractions/database/unit-of-work.interface.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { FirstName } from "@/domain/users/first-name.js";
import { LastName } from "@/domain/users/last-name.js";
import { User } from "@/domain/users/user.js";
import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { Outbox } from "@/application/abstractions/database/outbox/outbox.js";
import { OutboxType } from "@/application/abstractions/database/outbox/outbox-type.js";
import { Password } from "@/domain/users/password.js";
import { IPasswordHasher } from "@/application/abstractions/security/password-hasher.interface.js";
import { HashedPassword } from "@/domain/users/hashed-password.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { ITokenGenerator } from "@/application/abstractions/security/token-generator.interface.js";
import { ICache } from "@/application/abstractions/cache/cache.interface.js";
import { err, errAsync, fromPromise, ok, okAsync } from "neverthrow";
import { authCacheKeys } from "@/application/auth/auth-cache-keys.js";
import { OutboxEmailData } from "@/application/abstractions/database/outbox/outbox-data.type.js";
import { ApplicationConfig } from "@/application/config/application.config.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { IUserRepository } from "@/domain/users/user-repository.interface.js";
import { sleep } from "@/shared/helpers.js";
import { failure, internal } from "@/domain/abstractions/errors.js";

export class SignUpCommand implements ICommand {
  constructor(
    public readonly firstName: FirstName,
    public readonly lastName: LastName,
    public readonly email: Email,
    public readonly password: Password,
  ) {}
}

export class SignUpCommandHandler implements ICommandHandler<SignUpCommand> {
  private readonly accountVerificationTTl: PositiveInt;

  constructor(
    private readonly unitOfWork: IUnitOfWork,
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly cache: ICache,
    applicationConfig: ApplicationConfig,
  ) {
    this.accountVerificationTTl = PositiveInt.create(
      applicationConfig.accountVerificationTTLMinutes * 60,
    )._unsafeUnwrap();
  }

  handle(command: SignUpCommand): ResultAsync<void> {
    return this.userRepository
      .getByEmail(command.email)
      .andThen((user) => {
        if (user)
          return fromPromise(sleep(1000), (err) => internal("", err)).andThen(() =>
            err(failure("User already exists", "USER_ALREADY_EXISTS")),
          );

        return okAsync();
      })
      .orElse((err) =>
        err.type === "Failure" && err.code === "USER_ALREADY_EXISTS"
          ? okAsync()
          : errAsync(internal("Failed to delay sign-up response", err)),
      )
      .andThen(() => this.passwordHasher.hash(command.password))
      .andThen((hashed) => HashedPassword.create(hashed.value))
      .andThen((hashedPassword) => {
        const user = User.create(
          command.firstName,
          command.lastName,
          command.email,
          hashedPassword,
          null,
          null,
        );

        const token = this.tokenGenerator.generate();
        return this.cache
          .set(authCacheKeys.verificationToken(token), user.id.value, this.accountVerificationTTl)
          .andThen(() =>
            this.unitOfWork.execute(
              ({ userRepository, outboxRepository }, { commit, rollback }) => {
                const outboxEmailData: OutboxEmailData = {
                  type: "accountVerification",
                  email: user.email.value,
                  token,
                };
                const outbox = Outbox.create(OutboxType.Email, outboxEmailData);

                return userRepository
                  .create(user)
                  .andThen(() => outboxRepository.create(outbox))
                  .andThen(() => commit())
                  .orElse((error) =>
                    rollback().andThen(() =>
                      error.type === "Failure" && error.code === "USER_ALREADY_EXISTS"
                        ? ok()
                        : err(error),
                    ),
                  );
              },
            ),
          );
      });
  }
}
