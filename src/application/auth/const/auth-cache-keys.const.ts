import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { UserId } from "@/domain/user/user-id.js";

export const AUTH_CACHE_KEYS = {
  VERIFICATION_TOKEN: (token: string) => `verification-token:${token}` as const,
  PASSWORD_RESET_TOKEN: (token: string) => `password-reset:${token}` as const,
  SESSION: (sessionId: UUID) => `session:${sessionId.value}` as const,
  USER_SESSIONS: (userId: UserId) => `sessions:${userId.value}` as const,
} as const;
