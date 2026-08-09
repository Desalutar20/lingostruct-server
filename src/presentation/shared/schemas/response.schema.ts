import z, { ZodType } from "zod";

export const SuccessResponseSchema = <T extends ZodType>(schema: T) => {
  return z.object({
    status: z.literal("success"),
    data: schema,
  });
};

export const ErrorResponseSchema = z.object({
  status: z.literal("error"),
  error: z.string(),
});

export const ValidationErrorResponseSchema = z.object({
  status: z.literal("error"),
  errors: z.record(z.string(), z.string().array()),
});
