import { ISessionStore } from "@/application/abstractions/auth/session-store.interface.js";
import { Session } from "@/application/abstractions/auth/session.type.js";
import { IDomainEventHandler } from "@/application/abstractions/domain-events/domain-event-handler.interface.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { UserUpdatedDomainEvent } from "@/domain/user/events/user-updated-domain-event.js";

export class UserUpdatedDomainEventHandler implements IDomainEventHandler<UserUpdatedDomainEvent> {
  constructor(private readonly sessionStore: ISessionStore) {}

  handle(event: UserUpdatedDomainEvent): ResultAsync<void> {
    const { id, email, firstName, lastName, role, avatarUrl } = event.data;

    const session: Session = {
      id: id.value,
      email: email.value,
      firstName: firstName?.value ?? null,
      lastName: lastName?.value ?? null,
      role: role.value,
      avatarUrl: avatarUrl?.value ?? null,
    };

    return this.sessionStore.updateAll(id, session);
  }
}
