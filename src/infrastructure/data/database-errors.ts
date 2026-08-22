import { UserConstraints } from "./user/user-constraints.js";
import { AppError, failure, internal } from "@/domain/abstractions/errors.js";

const PostgresErrorCode = {
  UniqueViolation: "23505",
  NotNullViolation: "23502",
} as const;

type DatabaseError = {
  code: (typeof PostgresErrorCode)[keyof typeof PostgresErrorCode];
  detail: string;
  table: string;
  constraint?: string;
  column?: string;
};

const isDatabaseError = (error: unknown): error is DatabaseError => {
  const err = error as DatabaseError;

  return (
    err !== undefined &&
    err.table !== undefined &&
    err.detail !== undefined &&
    err.code !== undefined
  );
};

export const mapDbErrorToAppError = (error: unknown, context = ""): AppError => {
  const message = context ? `Unexpected database error - ${context}` : "Unexpected database error";

  if (!isDatabaseError(error)) return internal(message, error);

  if (
    error.code === PostgresErrorCode.UniqueViolation &&
    error.constraint === UserConstraints.EmailUnique
  ) {
    return failure("User with this email already exists", "USER_ALREADY_EXISTS");
  }

  return internal(message, error);
};
