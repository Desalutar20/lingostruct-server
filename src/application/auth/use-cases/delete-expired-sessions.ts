import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { ISessionStore } from "@/application/abstractions/auth/session-store.interface.js";

export class DeleteExpiredSessionsCommand implements ICommand<void> {}

export class DeleteExpiredSessionsCommandHandler implements ICommandHandler<
  DeleteExpiredSessionsCommand,
  void
> {
  constructor(private readonly sessionStore: ISessionStore) {}

  handle(command: DeleteExpiredSessionsCommand): ResultAsync<void> {
    return this.sessionStore.deleteExpired();
  }
}
