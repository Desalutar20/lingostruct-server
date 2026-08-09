import { UUID } from "../shared/value-objects/uuid.js";

export interface DomainEvent {
  readonly eventId: UUID;
  readonly occurredAt: Date;
}
