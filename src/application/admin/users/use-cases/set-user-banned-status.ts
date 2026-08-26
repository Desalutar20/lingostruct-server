import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { OutboxUserBannedData } from "@/application/abstractions/database/outbox/outbox-data.type.js";
import { OutboxType } from "@/application/abstractions/database/outbox/outbox-type.js";
import { Outbox } from "@/application/abstractions/database/outbox/outbox.js";
import { IUnitOfWork } from "@/application/abstractions/database/unit-of-work.interface.js";
import { failure } from "@/domain/abstractions/errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { UserId } from "@/domain/user/user-id.js";
import { err, ok } from "neverthrow";

export class SetUserBannedStatusCommand implements ICommand<void> {
  constructor(
    readonly userId: UserId,
    readonly isBanned: boolean,
  ) {}
}

export class SetUserBannedStatusCommandHandler implements ICommandHandler<
  SetUserBannedStatusCommand,
  void
> {
  constructor(private readonly unitOfWork: IUnitOfWork) {}

  handle(command: SetUserBannedStatusCommand): ResultAsync<void> {
    return this.unitOfWork.execute(({ userRepository, outboxRepository }, { commit, rollback }) => {
      return userRepository
        .getById(command.userId)
        .andThen((user) => {
          if (!user)
            return err(
              failure(`User with id ${command.userId.value} not found`, "OPERATION_FAILED"),
            );

          const isUpdated = user.update(undefined, undefined, undefined, command.isBanned);
          if (!isUpdated) return ok();

          const outboxData: OutboxUserBannedData = {
            userId: user.id.value,
          };
          const outbox = new Outbox(OutboxType.UserBanStatusChanged, outboxData);

          return userRepository
            .update(user)
            .andThen(() => (user.isBanned ? outboxRepository.create(outbox) : ok()));
        })
        .andThen(() => {
          console.log("COMMITING TRANSACTION");
          return commit();
        })
        .orElse((error) => rollback().andThen(() => err(error)));
    });
  }
}
