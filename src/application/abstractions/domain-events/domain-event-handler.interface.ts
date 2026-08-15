import { DomainEvent } from "@/domain/abstractions/domain-event.js";
import { ResultAsync } from "@/domain/abstractions/result.js";

export interface IDomainEventHandler<T extends DomainEvent<unknown>> {
  handle(event: T): ResultAsync<void>;
}
