import { Email } from "@/domain/shared/value-objects/email.js";
import { FirstName } from "./first-name.js";
import { HashedPassword } from "./hashed-password.js";
import { LastName } from "./last-name.js";
import { UserId } from "./user-id.js";
import { UserRole } from "./user-role.js";
import { Nullable } from "@/shared/types/nullable.type.js";
import { ProviderId } from "./provider-id.js";
import { AggregateRoot } from "@/domain/abstractions/aggregate-root.js";
import { UserCreatedDomainEvent } from "./events/user-created-domain-events.js";

export class User extends AggregateRoot<UserId> {
  private readonly _isBanned = false;
  private readonly _isVerified = false;

  private constructor(
    id: UserId,
    createdAt: Date,
    updatedAt: Date,
    private readonly _firstName: FirstName,
    private readonly _lastName: LastName,
    private readonly _email: Email,
    private readonly _hashedPassword: Nullable<HashedPassword>,
    private readonly _role: UserRole,
    private readonly _googleId: Nullable<ProviderId>,
    private readonly _githubId: Nullable<ProviderId>,
  ) {
    super(id, createdAt, updatedAt);
  }

  public get firstName() {
    return this._firstName;
  }
  public get lastName() {
    return this._lastName;
  }
  public get email() {
    return this._email;
  }
  public get hashedPassword() {
    return this._hashedPassword;
  }

  public get role() {
    return this._role;
  }

  public get isBanned() {
    return this._isBanned;
  }

  public get isVerified() {
    return this._isVerified;
  }

  public get googleId() {
    return this._googleId;
  }

  public get githubId() {
    return this._githubId;
  }

  public static create(
    firstName: FirstName,
    lastName: LastName,
    email: Email,
    hashedPassword: Nullable<HashedPassword>,
    googleId: Nullable<ProviderId>,
    githubId: Nullable<ProviderId>,
  ): User {
    const now = new Date();

    const user = new User(
      UserId.generate(),
      now,
      now,
      firstName,
      lastName,
      email,
      hashedPassword,
      UserRole.Regular,
      googleId,
      githubId,
    );

    user.addDomainEvent(new UserCreatedDomainEvent(user.email));

    return user;
  }

  public static restore(
    id: UserId,
    createdAt: Date,
    updatedAt: Date,
    firstName: FirstName,
    lastName: LastName,
    email: Email,
    hashedPassword: Nullable<HashedPassword>,
    userRole: UserRole,
    googleId: Nullable<ProviderId>,
    githubId: Nullable<ProviderId>,
  ): User {
    return new User(
      id,
      createdAt,
      updatedAt,
      firstName,
      lastName,
      email,
      hashedPassword,
      userRole,
      googleId,
      githubId,
    );
  }
}
