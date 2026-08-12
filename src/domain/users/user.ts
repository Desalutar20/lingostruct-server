import { Email } from "@/domain/shared/value-objects/email.js";
import { FirstName } from "./first-name.js";
import { HashedPassword } from "./hashed-password.js";
import { LastName } from "./last-name.js";
import { UserId } from "./user-id.js";
import { UserRole } from "./user-role.js";
import { Nullable } from "@/shared/types.js";
import { ProviderId } from "./provider-id.js";
import { AggregateRoot } from "@/domain/abstractions/aggregate-root.js";
import { UserCreatedDomainEvent } from "./events/user-created-domain-events.js";
import { Result } from "@/domain/abstractions/result.js";
import { err, ok } from "neverthrow";
import { failure } from "@/domain/abstractions/errors.js";
import { OAuthProvider } from "@/domain/users/oauth-provider.js";

export class User extends AggregateRoot<UserId> {
  private constructor(
    id: UserId,
    createdAt: Date,
    updatedAt: Date,
    private _firstName: Nullable<FirstName>,
    private _lastName: Nullable<LastName>,
    private _email: Email,
    private _hashedPassword: Nullable<HashedPassword>,
    private _role: UserRole,
    private _isBanned: boolean,
    private _isVerified: boolean,
    private _googleId: Nullable<ProviderId>,
    private _githubId: Nullable<ProviderId>,
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

  public verify(): Result<void> {
    if (this.isBanned) {
      return err(failure("User is banned", "OPERATION_FAILED"));
    }

    if (!this.isVerified) {
      this._isVerified = true;
      this._updatedAt = new Date();
    }

    return ok();
  }

  public updatePassword(newPassword: HashedPassword) {
    this._hashedPassword = newPassword;
    this._updatedAt = new Date();
  }

  public linkProvider(provider: OAuthProvider, providerId: ProviderId): boolean {
    switch (provider.value) {
      case "google":
        if (this._googleId) return false;

        this._googleId = providerId;
        this._updatedAt = new Date();

        return true;
      case "github":
        if (this._githubId) return false;

        this._githubId = providerId;
        this._updatedAt = new Date();

        return true;
      default:
        const x: never = provider.value;
        return x;
    }
  }

  public get isValid(): boolean {
    return !this.isBanned && this.isVerified;
  }

  public static create(
    firstName: Nullable<FirstName>,
    lastName: Nullable<LastName>,
    email: Email,
    hashedPassword: Nullable<HashedPassword>,
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
      false,
      false,
      null,
      null,
    );

    user.addDomainEvent(new UserCreatedDomainEvent(user.email));

    return user;
  }

  public static restore(
    id: UserId,
    createdAt: Date,
    updatedAt: Date,
    firstName: Nullable<FirstName>,
    lastName: Nullable<LastName>,
    email: Email,
    hashedPassword: Nullable<HashedPassword>,
    userRole: UserRole,
    isBanned: boolean,
    isVerified: boolean,
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
      isBanned,
      isVerified,
      googleId,
      githubId,
    );
  }
}
