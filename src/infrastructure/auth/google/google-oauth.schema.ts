import z from "zod";

export const GoogleOAuthAccessTokenSchema = z.object({
  access_token: z.string().trim().nonempty(),
});

export const GoogleOAuthUserSchema = z.object({
  id: z.string().trim().nonempty(),
  email: z.email().trim().nonempty(),
  verified_email: z.boolean(),
});
