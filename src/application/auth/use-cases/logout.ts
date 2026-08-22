import { ISessionStore } from "@/application/abstractions/auth/session-store.interface.js";
import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { UserId } from "@/domain/user/user-id.js";

export class LogoutCommand implements ICommand<void> {
  constructor(
    public readonly userId: UserId,
    public readonly sessionId: UUID,
  ) {}
}

export class LogoutCommandHandler implements ICommandHandler<LogoutCommand, void> {
  constructor(private readonly sessionStore: ISessionStore) {}

  handle(command: LogoutCommand): ResultAsync<void> {
    return this.sessionStore.delete(command.userId, command.sessionId);
  }
}
