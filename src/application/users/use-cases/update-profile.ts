import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { FirstName } from "@/domain/users/first-name.js";
import { Nullable } from "@/app/types.js";
import { URL } from "@/domain/shared/value-objects/url.js";
import { LastName } from "@/domain/users/last-name.js";
import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { IUserRepository } from "@/domain/users/user-repository.interface.js";
import { UserId } from "@/domain/users/user-id.js";
import { errAsync, okAsync } from "neverthrow";
import { failure } from "@/domain/abstractions/errors.js";
import { IDomainEventPublisher } from "@/application/abstractions/domain-events/domain-event-publisher.interface.js";

export class UpdateProfileCommand implements ICommand<void> {
  constructor(
    public readonly userId: UserId,
    public readonly firstName: Nullable<FirstName>,
    public readonly lastName: Nullable<LastName>,
    public readonly avatarUrl: Nullable<URL>,
  ) {}
}

export class UpdateProfileCommandHandler implements ICommandHandler<UpdateProfileCommand, void> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly domainEventPublisher: IDomainEventPublisher,
  ) {}

  handle(command: UpdateProfileCommand): ResultAsync<void> {
    return this.userRepository.getById(command.userId).andThen((user) => {
      if (!user) return errAsync(failure("User not found", "OPERATION_FAILED"));

      const isUpdated = user.update(command.firstName, command.lastName, command.avatarUrl);
      if (!isUpdated) return okAsync();

      const domainEvents = user.pullDomainEvents();
      this.domainEventPublisher.publish(domainEvents);

      return this.userRepository.update(user);
    });
  }
}
