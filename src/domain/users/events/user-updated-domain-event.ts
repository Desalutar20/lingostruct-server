import { DomainEvent } from "@/domain/abstractions/domain-event.js";
import { User } from "@/domain/users/user.js";

type PartialUser = Pick<User, "id" | "email" | "firstName" | "lastName" | "role" | "avatarUrl">;

export class UserUpdatedDomainEvent extends DomainEvent<PartialUser> {
  public data: PartialUser;
  constructor(public readonly user: PartialUser) {
    super();
    this.data = user;
  }
}
