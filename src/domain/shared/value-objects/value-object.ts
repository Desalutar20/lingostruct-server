export abstract class ValueObject<T> {
  public abstract equals(other: T): boolean;
  public abstract toString(): string;
}
