import { ISessionStore } from "@/application/abstractions/auth/session-store.interface.js";
import { Session } from "@/application/abstractions/auth/session.type.js";
import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { unauthorized } from "@/domain/abstractions/errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { err, ok } from "neverthrow";

export class AuthenticateCommand implements ICommand<Session> {
  constructor(public readonly sessionId: UUID) {}
}

export class AuthenticateCommandHandler implements ICommandHandler<AuthenticateCommand, Session> {
  constructor(private readonly sessionStore: ISessionStore) {}

  handle(command: AuthenticateCommand): ResultAsync<Session> {
    return this.sessionStore
      .get(command.sessionId)
      .andThen((session) => (!session ? err(unauthorized()) : ok(session)));
  }
}
