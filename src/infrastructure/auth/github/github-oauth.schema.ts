import z from "zod";

export const GithubOAuthAccessTokenSchema = z.object({
  access_token: z.string().trim().nonempty(),
});

export const GithubOAuthUserSchema = z.object({
  id: z.number().positive(),
  email: z.email().trim().nullable(),
});

export const GithubOAuthUserEmailSchema = z.array(
  z.object({
    email: z.email().trim(),
    primary: z.boolean(),
    verified: z.boolean(),
  }),
);
