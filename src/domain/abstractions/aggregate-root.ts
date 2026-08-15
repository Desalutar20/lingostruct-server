import { DomainEvent } from "./domain-event.js";
import { Entity } from "./entity.js";
import { UUID } from "../shared/value-objects/uuid.js";

export abstract class AggregateRoot<T extends UUID> extends Entity<T> {
  private readonly _domainEvents: DomainEvent<unknown>[] = [];

  protected addDomainEvent<T>(event: DomainEvent<T>): void {
    this._domainEvents.push(event);
  }

  public pullDomainEvents(): DomainEvent<unknown>[] {
    const events = [...this._domainEvents];
    this._domainEvents.length = 0;

    return events;
  }
}
