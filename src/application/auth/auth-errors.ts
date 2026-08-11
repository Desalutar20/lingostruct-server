import { failure } from "@/domain/abstractions/errors.js";
import { err } from "neverthrow";

export const invalidTokenError = err(failure("Invalid or expired token", "OPERATION_FAILED"));
export const invalidCredentialsError = err(failure("Invalid credentials", "OPERATION_FAILED"));
export const userNotFoundError = err(failure("User not found", "OPERATION_FAILED"));
