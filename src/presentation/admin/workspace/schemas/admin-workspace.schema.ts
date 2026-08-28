import { AdminWorkspaceDto } from "@/application/admin/workspace/dto/admin-workspace.dto.js";
import {
  IsoStringSchema,
  NonEmptyStringSchema,
} from "@/presentation/shared/schemas/common.schema.js";
import z from "zod";

export const AdminWorkspaceSchema = z.object({
  id: NonEmptyStringSchema,
  createdAt: IsoStringSchema,
  updatedAt: IsoStringSchema,
  name: NonEmptyStringSchema,
  country: NonEmptyStringSchema,
  city: NonEmptyStringSchema,
  street: NonEmptyStringSchema,
  streetNumber: NonEmptyStringSchema,
  postalCode: NonEmptyStringSchema,
}) satisfies z.ZodType<AdminWorkspaceDto>;
