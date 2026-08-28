import { WorkspaceId } from "@/domain/workspace/workspace-id.js";
import { transformToValueObject } from "@/presentation/shared/schemas/transform-value-object.js";
import z from "zod";

export const WorkspaceIdSchema = z
  .object({
    id: z.uuid().trim().nonempty().transform(transformToValueObject(WorkspaceId.create)),
  })
  .strict();
