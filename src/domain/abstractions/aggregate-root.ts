import { DomainEvent } from "./domain-event.interface.js";
import { Entity } from "./entity.js";
import { UUID } from "../shared/value-objects/uuid.js";

export abstract class AggregateRoot<T extends UUID> extends Entity<T> {
  private readonly _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents.length = 0;

    return events;
  }
}
