import { DomainEvent } from "@/domain/abstractions/domain-event.js";
import { Email } from "@/domain/shared/value-objects/email.js";

export class UserCreatedDomainEvent extends DomainEvent<Email> {
  public data: Email;

  constructor(public readonly userEmail: Email) {
    super();
    this.data = userEmail;
  }
}
