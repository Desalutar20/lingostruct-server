import z, { ZodType } from "zod";

export const SuccessResponseSchema = <T extends ZodType>(schema: T) => {
  return z
    .object({
      status: z.literal("success"),
      data: schema,
    })
    .strict();
};

export const ErrorResponseSchema = z
  .object({
    status: z.literal("error"),
    code: z.string(),
    error: z.string(),
  })
  .strict();

export const ValidationErrorResponseSchema = z
  .object({
    status: z.literal("error"),
    code: z.string(),
    errors: z.record(z.string(), z.string().array()),
  })
  .strict();
