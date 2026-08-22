import { SuccessResponseSchema } from "@/presentation/shared/schemas/response.schema.js";
import z, { ZodType } from "zod";

export const CursorPaginatedSchema = <T extends ZodType>(data: T) =>
  SuccessResponseSchema(z.array(data).readonly()).and(
    z
      .object({
        prevCursor: z.string().trim().nonempty().nullable(),
        nextCursor: z.string().trim().nonempty().nullable(),
      })
      .strict(),
  );
