import { Email } from "@/domain/shared/value-objects/email.js";
import { FirstName } from "./first-name.js";
import { HashedPassword } from "./hashed-password.js";
import { LastName } from "./last-name.js";
import { UserId } from "./user-id.js";
import { UserRole } from "./user-role.js";
import { Nullable } from "@/app/types.js";
import { ProviderId } from "./provider-id.js";
import { AggregateRoot } from "@/domain/abstractions/aggregate-root.js";
import { UserCreatedDomainEvent } from "./events/user-created-domain-event.js";
import { Result } from "@/domain/abstractions/result.js";
import { err, ok } from "neverthrow";
import { failure } from "@/domain/abstractions/errors.js";
import { OAuthProvider } from "@/domain/user/oauth-provider.js";
import { UserUpdatedDomainEvent } from "@/domain/user/events/user-updated-domain-event.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { nowIso } from "@/app/helpers.js";

export class User extends AggregateRoot<UserId> {
  private _role: UserRole;
  private _isBanned: boolean;
  private _isVerified: boolean;
  private _googleId: Nullable<ProviderId>;
  private _githubId: Nullable<ProviderId>;
  private _avatarId: Nullable<NonEmptyString>;

  public constructor(
    private _firstName: Nullable<FirstName>,
    private _lastName: Nullable<LastName>,
    private _email: Email,
    private _hashedPassword: Nullable<HashedPassword>,
  ) {
    const now = nowIso();
    super(UserId.generate(), now, now);

    this.addDomainEvent(new UserCreatedDomainEvent(_email));

    this._role = UserRole.Regular;
    this._isBanned = false;
    this._isVerified = false;
    this._googleId = null;
    this._githubId = null;
    this._avatarId = null;
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

  public get avatarId() {
    return this._avatarId;
  }

  public verify(): Result<void> {
    if (this.isBanned) {
      return err(failure("User is banned", "OPERATION_FAILED"));
    }

    if (!this.isVerified) {
      this._isVerified = true;
      this._updatedAt = nowIso();
    }

    return ok();
  }

  public updatePassword(newPassword: HashedPassword) {
    this._hashedPassword = newPassword;
    this._updatedAt = nowIso();
  }

  public linkProvider(provider: OAuthProvider, providerId: ProviderId): boolean {
    switch (provider.value) {
      case "google":
        if (this._googleId) return false;

        this._googleId = providerId;
        this._updatedAt = nowIso();

        return true;
      case "github":
        if (this._githubId) return false;

        this._githubId = providerId;
        this._updatedAt = nowIso();

        return true;
      default:
        const x: never = provider.value;
        return x;
    }
  }

  public update(
    firstName?: Nullable<FirstName>,
    lastName?: Nullable<LastName>,
    avatarId?: Nullable<NonEmptyString>,
  ): boolean {
    let isUpdated = false;

    if (firstName !== undefined) {
      const changed =
        firstName === null
          ? this.firstName !== null
          : this.firstName === null || !firstName.equals(this.firstName);

      if (changed) {
        this._firstName = firstName;
        isUpdated = true;
      }
    }

    if (lastName !== undefined) {
      const changed =
        lastName === null
          ? this.lastName !== null
          : this.lastName === null || !lastName.equals(this.lastName);

      if (changed) {
        this._lastName = lastName;
        isUpdated = true;
      }
    }

    if (avatarId !== undefined) {
      const changed =
        avatarId === null
          ? this.avatarId !== null
          : this.avatarId === null || !avatarId.equals(this.avatarId);

      if (changed) {
        this._avatarId = avatarId;
        isUpdated = true;
      }
    }

    if (isUpdated) {
      this._updatedAt = nowIso();
      this.addDomainEvent(new UserUpdatedDomainEvent(this));
    }

    return isUpdated;
  }

  public get isValid(): boolean {
    return !this.isBanned && this.isVerified;
  }

  public static restore(
    id: UserId,
    createdAt: string,
    updatedAt: string,
    firstName: Nullable<FirstName>,
    lastName: Nullable<LastName>,
    email: Email,
    hashedPassword: Nullable<HashedPassword>,
    role: UserRole,
    isBanned: boolean,
    isVerified: boolean,
    googleId: Nullable<ProviderId>,
    githubId: Nullable<ProviderId>,
    avatarId: Nullable<NonEmptyString>,
  ): User {
    const user = new User(firstName, lastName, email, hashedPassword);

    user._id = id;
    user._createdAt = createdAt;
    user._updatedAt = updatedAt;
    user._role = role;
    user._isBanned = isBanned;
    user._isVerified = isVerified;
    user._googleId = googleId;
    user._githubId = githubId;
    user._avatarId = avatarId;

    return user;
  }
}
