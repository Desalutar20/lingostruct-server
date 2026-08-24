import { Nullable } from "@/app/types.js";
import { User } from "@/domain/user/user.js";

export class AdminUserDto {
  public readonly id: string;
  public readonly createdAt: string;
  public readonly updatedAt: string;
  public readonly email: string;
  public readonly firstName: Nullable<string>;
  public readonly lastName: Nullable<string>;
  public readonly role: string;
  public readonly isBanned: boolean;
  public readonly isVerified: boolean;
  public readonly avatarUrl: Nullable<string>;
  public readonly googleId: Nullable<string>;
  public readonly githubId: Nullable<string>;

  constructor(user: User) {
    this.id = user.id.value;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.email = user.email.value;
    this.firstName = user.firstName?.value ?? null;
    this.lastName = user.lastName?.value ?? null;
    this.role = user.role.value;
    this.isBanned = user.isBanned;
    this.isVerified = user.isVerified;
    this.avatarUrl = user.avatarUrl?.value ?? null;
    this.googleId = user.googleId?.value ?? null;
    this.githubId = user.githubId?.value ?? null;
  }
}
