import { ISessionStore } from "@/application/abstractions/auth/session-store.interface.js";
import { ILogger } from "@/application/abstractions/logger/logger.interface.js";
import { IObjectStorage } from "@/application/abstractions/object-storage/object-storage.interface.js";
import { UserUpdatedDomainEventHandler } from "@/application/user/domain-event-handlers/user-updated-domain-event-handler.js";
import { UserUpdatedDomainEvent } from "@/domain/user/events/user-updated-domain-event.js";
import { DomainEventPublisher } from "@/infrastructure/domain-events/domain-event-publisher.js";

export const setupDomainEventPublisher = (
  sessionStore: ISessionStore,
  objectStorage: IObjectStorage,
  logger: ILogger,
) => {
  const domainEventPublisher = new DomainEventPublisher(logger);

  domainEventPublisher.subscribe(UserUpdatedDomainEvent, [
    new UserUpdatedDomainEventHandler(sessionStore, objectStorage),
  ]);

  return domainEventPublisher;
};
