import { DomainEvent } from "@/domain/abstractions/domain-event.js";
import { User } from "@/domain/user/user.js";

type PartialUser = Pick<User, "id" | "email" | "firstName" | "lastName" | "role" | "avatarUrl">;

export class UserUpdatedDomainEvent extends DomainEvent<PartialUser> {
  public data: PartialUser;
  constructor(user: PartialUser) {
    super();
    this.data = user;
  }
}
