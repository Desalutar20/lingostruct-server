import { UserAlreadyExistsException } from "@/domain/users/exceptions/user-already-exists.exception.js";
import { UserConstraints } from "./users/user-constraints.js";

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

  return err !== undefined && err.table !== undefined && err.detail !== undefined;
};

export const throwDatabaseError = (error: unknown) => {
  if (!isDatabaseError(error)) throw error;

  if (
    error.code === PostgresErrorCode.UniqueViolation &&
    error.constraint === UserConstraints.EmailUnique
  ) {
    throw new UserAlreadyExistsException();
  }

  throw error;
};
