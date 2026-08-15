import { UUID } from "../shared/value-objects/uuid.js";

export abstract class DomainEvent<T> {
  public readonly eventId: UUID;
  public readonly occurredAt: Date;
  public abstract readonly data: T;

  constructor() {
    this.eventId = UUID.generate();
    this.occurredAt = new Date();
  }
}
