import { UUID } from "../shared/value-objects/uuid.js";

export abstract class Entity<T extends UUID = UUID> {
  protected readonly _id: T;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;

  protected constructor(id: T, createdAt: Date, updatedAt: Date) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  public get id(): T {
    return this._id;
  }

  public get createdAt(): Date {
    return new Date(this._createdAt);
  }

  public get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  public equals(other: Entity<T>) {
    if (!other) return false;
    if (this === other) return true;

    return other.id.value === this._id.value;
  }
}
