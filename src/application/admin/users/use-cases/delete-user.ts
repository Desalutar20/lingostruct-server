import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { OutboxUserDeletedData } from "@/application/abstractions/database/outbox/outbox-data.type.js";
import { OutboxType } from "@/application/abstractions/database/outbox/outbox-type.js";
import { Outbox } from "@/application/abstractions/database/outbox/outbox.js";
import { IUnitOfWork } from "@/application/abstractions/database/unit-of-work.interface.js";
import { failure } from "@/domain/abstractions/errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { UserId } from "@/domain/user/user-id.js";
import { err } from "neverthrow";

export class DeleteUserCommand implements ICommand<void> {
  constructor(public readonly userId: UserId) {}
}

export class DeleteUserCommandHandler implements ICommandHandler<DeleteUserCommand, void> {
  constructor(private readonly unitOfWork: IUnitOfWork) {}

  handle(command: DeleteUserCommand): ResultAsync<void> {
    return this.unitOfWork.execute(({ userRepository, outboxRepository }, { commit, rollback }) => {
      return userRepository
        .getById(command.userId)
        .andThen((user) => {
          if (!user)
            return err(
              failure(`User with id ${command.userId.value} not found`, "OPERATION_FAILED"),
            );

          const outboxData: OutboxUserDeletedData = {
            userId: user.id.value,
          };
          const outbox = new Outbox(OutboxType.UserDeleted, outboxData);

          return userRepository.delete(user).andThen(() => outboxRepository.create(outbox));
        })
        .andThen(() => commit())
        .orElse((error) => rollback().andThen(() => err(error)));
    });
  }
}
