import { validation } from "@/domain/abstractions/errors.js";
import { err, ok } from "neverthrow";
import { Result } from "@/domain/abstractions/result.js";

export class StringValue {
  protected readonly _value: string;

  protected constructor(value: string) {
    this._value = value;
  }

  public equals(other: StringValue): boolean {
    return this.constructor === other.constructor && this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }

  public get value(): string {
    return this._value;
  }

  public static create(
    value: string,
    field = "value",
    label = "Value",
    {
      maxLength,
      minLength,
      additionalCheck,
    }: {
      maxLength?: number;
      minLength?: number;
      additionalCheck?: (value: string) => Result<void>;
    } = {},
  ): Result<StringValue> {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return err(validation(field, [`${label} can't be empty`]));
    }

    if (minLength !== undefined && trimmed.length < minLength) {
      return err(validation(field, [`${label} can't be shorter than ${minLength} characters`]));
    }

    if (maxLength !== undefined && trimmed.length > maxLength) {
      return err(validation(field, [`${label} can't be longer than ${maxLength} characters`]));
    }

    const result = additionalCheck?.(trimmed);
    if (result?.isErr()) {
      return err(result.error);
    }

    return ok(new StringValue(trimmed));
  }
}
