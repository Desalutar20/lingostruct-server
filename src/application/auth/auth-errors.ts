import { failure } from "@/domain/abstractions/errors.js";
import { err } from "neverthrow";

export const invalidToken = err(failure("Invalid or expired token", "OPERATION_FAILED"));
export const userNotFound = err(failure("User not found", "OPERATION_FAILED"));
