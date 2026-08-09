import { AppException } from "@/domain/abstractions/app-exception.js";

export class UserAlreadyExistsException extends AppException {
  constructor() {
    super("User already exists");
  }
}
