import { Result } from "@/domain/abstractions/result.js";
import z, { RefinementCtx } from "zod";

export const transformToValueObject =
  <T, U>(fn: (value: T) => Result<U>) =>
  (arg: T, ctx: RefinementCtx): U => {
    const result = fn(arg);

    if (result.isOk()) {
      return result.value;
    }

    if (result.error.type === "Validation") {
      for (const message of result.error.errors) {
        ctx.addIssue({
          code: "custom",
          message,
        });
      }
    } else {
      ctx.addIssue({
        code: "custom",
        message: "Invalid data",
      });
    }

    return z.NEVER;
  };
