import { IUnitOfWork } from "@/application/abstractions/database/unit-of-work.interface.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { FirstName } from "@/domain/users/first-name.js";
import { LastName } from "@/domain/users/last-name.js";
import { User } from "@/domain/users/user.js";
import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { Outbox } from "@/application/abstractions/database/outbox/outbox.js";
import { OutboxType } from "@/application/abstractions/database/outbox/outbox-type.js";
import { UserAlreadyExistsException } from "@/domain/users/exceptions/user-already-exists.exception.js";
import { Password } from "@/domain/users/password.js";
import { IPasswordHasher } from "@/application/abstractions/security/password-hasher.interface.js";
import { HashedPassword } from "@/domain/users/hashed-password.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { EmailVerificationOutboxData } from "@/application/abstractions/database/outbox/email-verification-outbox-data.type.js";
import { ITokenGenerator } from "@/application/abstractions/security/token-generator.interface.js";
import { ICache } from "@/application/abstractions/cache/cache.interface.js";

export class SignUpCommand implements ICommand {
  constructor(
    public readonly firstName: FirstName,
    public readonly lastName: LastName,
    public readonly email: Email,
    public readonly password: Password,
  ) {}
}

export class SignUpCommandHandler implements ICommandHandler<SignUpCommand> {
  constructor(
    private readonly unitOfWork: IUnitOfWork,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly cache: ICache,
  ) {}

  handle(command: SignUpCommand): ResultAsync<void> {
    return this.passwordHasher
      .hash(command.password)
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
        return this.cache.set(`verification-token:${token}`, user.id.value).andThen(() =>
          this.unitOfWork.execute(
            async ({ userRepository, outboxRepository }, { commit, rollback }) => {
              try {
                const outbox = Outbox.create(
                  OutboxType.Email,
                  new EmailVerificationOutboxData(user.email.value, token),
                );

                await userRepository.create(user);
                await outboxRepository.create(outbox);

                await commit();
              } catch (error) {
                await rollback();
                if (error instanceof UserAlreadyExistsException) {
                  return;
                }

                throw error;
              }
            },
          ),
        );
      });
  }
}
