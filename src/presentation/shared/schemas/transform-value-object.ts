import { AppError } from "@/domain/abstractions/errors.js";
import { Result, ResultWithAllErrors } from "@/domain/abstractions/result.js";
import z, { RefinementCtx } from "zod";

const setError = (error: AppError, ctx: RefinementCtx) => {
  if (error.type === "Validation") {
    for (const message of error.errors) {
      ctx.addIssue({
        code: "custom",
        message,
        path: [error.field],
      });
    }
  } else {
    ctx.addIssue({
      code: "custom",
      message: "Invalid data",
    });
  }
};

const transform = <T, U>(
  fn: (value: T) => Result<U> | ResultWithAllErrors<U>,
  arg: T,
  ctx: RefinementCtx,
): U => {
  const result = fn(arg);

  if (result.isOk()) {
    return result.value;
  }

  if (Array.isArray(result.error)) {
    for (const error of result.error) {
      setError(error, ctx);
    }
  } else {
    setError(result.error, ctx);
  }

  return z.NEVER;
};

export const transformToValueObjectOptional =
  <T, U>(fn: (value: T) => Result<U> | ResultWithAllErrors<U>) =>
  (arg: T | undefined | null, ctx: RefinementCtx): U | undefined | null => {
    if (arg === undefined) return undefined;
    if (arg === null) return null;

    return transform(fn, arg, ctx);
  };

export const transformToValueObject =
  <T, U>(fn: (value: T) => Result<U> | ResultWithAllErrors<U>) =>
  (arg: T, ctx: RefinementCtx): U =>
    transform(fn, arg, ctx);
