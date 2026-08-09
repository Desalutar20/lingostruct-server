import { DomainEvent } from "@/domain/abstractions/domain-event.interface.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";

export class UserCreatedDomainEvent implements DomainEvent {
  public readonly eventId: UUID;
  public readonly occurredAt: Date;

  constructor(public readonly userEmail: Email) {
    this.eventId = UUID.generate();
    this.occurredAt = new Date();
  }
}
