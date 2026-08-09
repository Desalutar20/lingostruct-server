import { validation } from "@/domain/abstractions/errors.js";
import { err, ok } from "neverthrow";
import { Result } from "@/domain/abstractions/result.js";

export class PositiveInt {
  constructor(private readonly _value: number) {}

  public get value() {
    return this._value;
  }

  public static create(value: number, field = "value", label = "Value"): Result<PositiveInt> {
    if (!Number.isInteger(value) || value < 1) {
      return err(validation(field, [`${label} must be a positive integer`]));
    }

    return ok(new PositiveInt(value));
  }
}
