import { AppError } from "@/domain/abstractions/errors.js";
import { Result as Rs, ResultAsync as RsAsync } from "neverthrow";

export type Result<T> = Rs<T, AppError>;
export type ResultAsync<T> = RsAsync<T, AppError>;
