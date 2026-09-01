import { AdminWorkspaceDto } from "@/application/admin/workspace/dto/admin-workspace.dto.js";
import { NonEmptyStringSchema } from "@/presentation/shared/schemas/common.schema.js";
import z from "zod";

export const WorkspaceSchema = z
  .object({
    name: NonEmptyStringSchema,
    country: NonEmptyStringSchema,
    city: NonEmptyStringSchema,
    street: NonEmptyStringSchema,
    streetNumber: NonEmptyStringSchema,
    postalCode: NonEmptyStringSchema,
  })
  .strict() satisfies z.ZodType<
  Pick<AdminWorkspaceDto, "name" | "country" | "city" | "street" | "streetNumber" | "postalCode">
>;
