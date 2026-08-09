export type AppError =
  | { type: "NotFound"; message: string }
  | { type: "Conflict"; message: string }
  | { type: "Failure"; message: string }
  | { type: "Validation"; field: string; errors: string[] }
  | { type: "Unauthorized" }
  | { type: "AccessForbidden" }
  | { type: "Internal"; message: string; error: unknown };

export const notFound = (message: string): AppError => ({
  type: "NotFound",
  message,
});

export const conflict = (message: string): AppError => ({
  type: "Conflict",
  message,
});

export const failure = (message: string): AppError => ({
  type: "Failure",
  message,
});

export const validation = (
  field: string,
  errors: string[],
): Extract<AppError, { type: "Validation" }> => ({
  type: "Validation",
  field,
  errors,
});

export const internal = (message: string, error?: unknown): AppError => ({
  type: "Internal",
  message,
  error,
});

export const unauthorized = (): AppError => ({
  type: "Unauthorized",
});

export const accessForbidden = (): AppError => ({
  type: "AccessForbidden",
});
