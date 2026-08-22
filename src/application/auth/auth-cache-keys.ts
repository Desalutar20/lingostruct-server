import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { UserId } from "@/domain/user/user-id.js";

export const authCacheKeys = {
  verificationToken: (token: string) => `verification-token:${token}` as const,
  passwordResetToken: (token: string) => `password-reset:${token}` as const,
  session: (sessionId: UUID) => `session:${sessionId.value}` as const,
  userSessions: (userId: UserId) => `sessions:${userId.value}` as const,
};
