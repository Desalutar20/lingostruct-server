import { UUID } from "../shared/value-objects/uuid.js";

export abstract class Entity<T extends UUID = UUID> {
  protected constructor(
    protected _id: T,
    protected _createdAt: string,
    protected _updatedAt: string,
  ) {}

  public get id(): T {
    return this._id;
  }

  public get createdAt(): string {
    return this._createdAt;
  }

  public get updatedAt(): string {
    return this._updatedAt;
  }

  public equals(other: Entity<T>) {
    if (!other) return false;
    if (this === other) return true;

    return other.id.value === this._id.value;
  }
}
