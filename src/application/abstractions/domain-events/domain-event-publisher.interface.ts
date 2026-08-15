import { DomainEvent } from "@/domain/abstractions/domain-event.js";

export interface IDomainEventPublisher {
  publish<T>(event: DomainEvent<T>[]): void;
}
