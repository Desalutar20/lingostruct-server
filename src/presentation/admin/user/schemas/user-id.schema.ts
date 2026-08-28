import { UserId } from "@/domain/user/user-id.js";
import { transformToValueObject } from "@/presentation/shared/schemas/transform-value-object.js";
import z from "zod";

export const UserIdSchema = z
  .object({
    id: z.uuid().trim().nonempty().transform(transformToValueObject(UserId.create)),
  })
  .strict();
