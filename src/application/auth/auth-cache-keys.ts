export const authCacheKeys = {
  verificationToken: (token: string) => `verification-token:${token}` as const,
};
