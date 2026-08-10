export type AppError =
  | { type: "Failure"; code: "USER_ALREADY_EXISTS" | "OPERATION_FAILED"; message: string }
  | { type: "Validation"; code: "VALIDATION"; field: string; errors: string[] }
  | { type: "Unauthorized"; code: "INVALID_CREDENTIALS" }
  | { type: "AccessForbidden"; code: "ACCESS_DENIED" }
  | { type: "Internal"; code: "UNEXPECTED_ERROR"; message: string; error: unknown };

export const failure = (
  message: string,
  code: Extract<AppError, { type: "Failure" }>["code"],
): AppError => ({
  type: "Failure",
  code,
  message,
});

export const validation = (
  field: string,
  errors: string[],
): Extract<AppError, { type: "Validation" }> => ({
  type: "Validation",
  code: "VALIDATION",
  field,
  errors,
});

export const internal = (message: string, error?: unknown): AppError => ({
  type: "Internal",
  code: "UNEXPECTED_ERROR",
  message,
  error,
});

export const unauthorized = (): AppError => ({
  type: "Unauthorized",
  code: "INVALID_CREDENTIALS",
});

export const accessForbidden = (): AppError => ({
  type: "AccessForbidden",
  code: "ACCESS_DENIED",
});
