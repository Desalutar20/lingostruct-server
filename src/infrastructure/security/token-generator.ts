import { ITokenGenerator } from "@/application/abstractions/security/token-generator.interface.js";
import { randomBytes } from "node:crypto";

export class TokenGenerator implements ITokenGenerator {
  generate(bytes: number = 32): string {
    return randomBytes(bytes).toString("hex");
  }
}
