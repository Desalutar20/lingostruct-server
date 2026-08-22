import { ISessionStore } from "@/application/abstractions/auth/session-store.interface.js";
import { Session } from "@/application/abstractions/auth/session.type.js";
import { IDomainEventHandler } from "@/application/abstractions/domain-events/domain-event-handler.interface.js";
import { IObjectStorage } from "@/application/abstractions/object-storage/object-storage.interface.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { UserUpdatedDomainEvent } from "@/domain/user/events/user-updated-domain-event.js";
import { URL } from "@/domain/shared/value-objects/url.js";

export class UserUpdatedDomainEventHandler implements IDomainEventHandler<UserUpdatedDomainEvent> {
  constructor(
    private readonly sessionStore: ISessionStore,
    private readonly objectStorage: IObjectStorage,
  ) {}

  handle(event: UserUpdatedDomainEvent): ResultAsync<void> {
    const { id, email, firstName, lastName, role, avatarId } = event.data;

    const createSession = (avatarUrl: URL | null): ResultAsync<void> => {
      const session: Session = {
        id: id.value,
        email: email.value,
        firstName: firstName?.value ?? null,
        lastName: lastName?.value ?? null,
        role: role.value,
        avatarUrl: avatarUrl?.value ?? null,
      };

      return this.sessionStore.updateAll(id, session);
    };

    if (!avatarId) {
      return createSession(null);
    }

    return this.objectStorage.createDownloadUrl(avatarId).andThen(createSession);
  }
}
