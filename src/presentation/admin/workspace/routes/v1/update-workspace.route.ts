import {
  ErrorResponseSchema,
  SuccessResponseSchema,
  ValidationErrorResponseSchema,
} from "@/presentation/shared/schemas/response.schema.js";
import { mapAppErrorToHttpError } from "@/presentation/shared/helpers/error-handler.js";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { unauthorized } from "@/domain/abstractions/errors.js";
import { UserRole } from "@/domain/user/user-role.js";
import { transformToValueObjectOptional } from "@/presentation/shared/schemas/transform-value-object.js";
import { NonEmptyStringSchema } from "@/presentation/shared/schemas/common.schema.js";
import { WorkspaceName } from "@/domain/workspace/workspace-name.js";
import { WorkspaceAddress } from "@/domain/workspace/workspace-address.js";
import { UpdateWorkspaceCommand } from "@/application/admin/workspace/use-cases/update-workspace.js";
import { WorkspaceIdSchema } from "@/presentation/admin/workspace/schemas/workspace-id.schema.js";
import { AdminWorkspaceSchema } from "@/presentation/admin/workspace/schemas/admin-workspace.schema.js";

const UpdateWorkspaceRequestSchema = z
  .object({
    name: NonEmptyStringSchema.max(WorkspaceName.maxLength)
      .optional()
      .transform(transformToValueObjectOptional(WorkspaceName.create)),
    country: NonEmptyStringSchema.max(WorkspaceAddress.countryMaxLength).optional(),
    city: NonEmptyStringSchema.max(WorkspaceAddress.cityMaxLength).optional(),
    street: NonEmptyStringSchema.max(WorkspaceAddress.streetMaxLength).optional(),
    streetNumber: NonEmptyStringSchema.max(WorkspaceAddress.streetNumberMaxLength).optional(),
    postalCode: NonEmptyStringSchema.max(WorkspaceAddress.postalCodeMaxLength).optional(),
  })
  .strict();

const UpdateWorkspaceResponseSchema = SuccessResponseSchema(AdminWorkspaceSchema);

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.patch(
    "/admin/workspaces/:id",
    {
      preHandler: async (req, reply) => {
        const result = await req.authenticate().andThen(() => req.authorize([UserRole.Admin]));
        if (result.isErr()) {
          return mapAppErrorToHttpError(reply, result.error);
        }
      },
      schema: {
        tags: ["Admin/Workspaces"],
        params: WorkspaceIdSchema,
        body: UpdateWorkspaceRequestSchema,
        response: {
          200: UpdateWorkspaceResponseSchema,
          400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
        },
      },
    },
    async (req, reply) => {
      if (!req.session || req.session.role !== "admin") {
        return mapAppErrorToHttpError(reply, unauthorized());
      }

      const result = await fastify.useCases.workspaces.updateWorkspace.handle(
        new UpdateWorkspaceCommand(req.params.id, req.body.name ?? undefined, {
          country: req.body.country,
          city: req.body.city,
          street: req.body.street,
          streetNumber: req.body.streetNumber,
          postalCode: req.body.postalCode,
        }),
      );
      if (result.isErr()) {
        return mapAppErrorToHttpError(reply, result.error);
      }

      reply.status(200).send({
        status: "success",
        data: result.value,
      });
    },
  );
};

export default plugin;
