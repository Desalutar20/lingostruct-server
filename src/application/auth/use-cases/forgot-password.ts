import { ICache } from "@/application/abstractions/cache/cache.interface.js";
import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { OutboxEmailData } from "@/application/abstractions/database/outbox/outbox-data.type.js";
import { IOutboxRepository } from "@/application/abstractions/database/outbox/outbox-repository.interface.js";
import { OutboxType } from "@/application/abstractions/database/outbox/outbox-type.js";
import { Outbox } from "@/application/abstractions/database/outbox/outbox.js";
import { ITokenGenerator } from "@/application/abstractions/security/token-generator.interface.js";
import { authCacheKeys } from "@/application/auth/auth-cache-keys.js";
import { ApplicationConfig } from "@/application/config/application.config.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { IUserRepository } from "@/domain/user/user-repository.interface.js";
import { okAsync } from "neverthrow";

export class ForgotPasswordCommand implements ICommand<void> {
  constructor(public readonly email: Email) {}
}

export class ForgotPasswordCommandHandler implements ICommandHandler<ForgotPasswordCommand, void> {
  private readonly resetPasswordTTLSeconds: PositiveInt;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly outboxRepository: IOutboxRepository,
    private readonly cache: ICache,
    private readonly tokenGenerator: ITokenGenerator,
    applicationConfig: ApplicationConfig,
  ) {
    this.resetPasswordTTLSeconds = PositiveInt.create(
      applicationConfig.resetPasswordTTLMinutes * 60,
    )._unsafeUnwrap();
  }

  handle(command: ForgotPasswordCommand): ResultAsync<void> {
    return this.userRepository.getByEmail(command.email).andThen((user) => {
      if (!user || !user.isValid) return okAsync();

      const token = this.tokenGenerator.generate();
      const cacheKey = authCacheKeys.passwordResetToken(token);

      return this.cache.set(cacheKey, user.id.value, this.resetPasswordTTLSeconds).andThen(() => {
        const outboxEmailData: OutboxEmailData = {
          type: "passwordReset",
          email: user.email.value,
          token,
        };

        const outbox = new Outbox(OutboxType.Email, outboxEmailData);

        return this.outboxRepository.create(outbox);
      });
    });
  }
}
