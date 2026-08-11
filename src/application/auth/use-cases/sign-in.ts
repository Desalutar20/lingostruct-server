import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { IPasswordHasher } from "@/application/abstractions/security/password-hasher.interface.js";
import { invalidCredentialsError } from "@/application/auth/auth-errors.js";
import { Session } from "@/application/abstractions/auth/session.type.js";
import { ApplicationConfig } from "@/application/config/application.config.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { Password } from "@/domain/users/password.js";
import { IUserRepository } from "@/domain/users/user-repository.interface.js";
import { okAsync } from "neverthrow";
import { ISessionStore } from "@/application/abstractions/auth/session-store.interface.js";

export class SignInCommand implements ICommand<Readonly<[Session, UUID]>> {
  constructor(
    public readonly email: Email,
    public readonly password: Password,
  ) {}
}

export class SignInCommandHandler implements ICommandHandler<
  SignInCommand,
  Readonly<[Session, UUID]>
> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly sessionStore: ISessionStore,
    private readonly config: ApplicationConfig,
  ) {}

  handle(command: SignInCommand): ResultAsync<Readonly<[Session, UUID]>> {
    return this.userRepository
      .getByEmail(command.email)
      .andThen((user) => {
        if (user === null || user.hashedPassword === null || !user.isValid)
          return invalidCredentialsError;

        return this.passwordHasher.verify(command.password, user.hashedPassword).map((success) => ({
          success,
          user,
        }));
      })
      .andThen(({ success, user }) => {
        if (!success) return invalidCredentialsError;

        const sessionId = UUID.generate();

        const sessionTTLSeconds = PositiveInt.create(
          this.config.sessionTTLMinutes * 60,
        )._unsafeUnwrap();

        const session: Session = {
          id: user.id.value,
          email: user.email.value,
          firstName: user.firstName.value,
          lastName: user.lastName.value,
          role: user.role.value as "admin" | "regular",
        };

        return this.sessionStore
          .getSessionIds(user.id)
          .andThen((sessionIds) => {
            if (sessionIds.length >= this.config.maxSessions) {
              return this.sessionStore.delete(user.id, sessionIds[0]);
            }

            return okAsync();
          })
          .andThen(() => this.sessionStore.save(user.id, sessionId, session, sessionTTLSeconds))
          .map(() => [session, sessionId] as const);
      });
  }
}
