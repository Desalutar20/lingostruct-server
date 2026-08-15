import { ISessionStore } from "@/application/abstractions/auth/session-store.interface.js";
import { ILogger } from "@/application/abstractions/logger/logger.interface.js";
import { UserUpdatedDomainEventHandler } from "@/application/users/domain-event-handlers/user-updated-domain-event-handler.js";
import { UserUpdatedDomainEvent } from "@/domain/users/events/user-updated-domain-event.js";
import { DomainEventPublisher } from "@/infrastructure/domain-events/domain-event-publisher.js";

export const setupDomainEventPublisher = (sessionStore: ISessionStore, logger: ILogger) => {
  const domainEventPublisher = new DomainEventPublisher(logger);

  domainEventPublisher.subscribe(UserUpdatedDomainEvent, [
    new UserUpdatedDomainEventHandler(sessionStore),
  ]);

  return domainEventPublisher;
};
