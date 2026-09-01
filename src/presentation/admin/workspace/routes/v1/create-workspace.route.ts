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
import { transformToValueObject } from "@/presentation/shared/schemas/transform-value-object.js";
import { NonEmptyStringSchema } from "@/presentation/shared/schemas/common.schema.js";
import { WorkspaceName } from "@/domain/workspace/workspace-name.js";
import { WorkspaceAddress } from "@/domain/workspace/workspace-address.js";
import { CreateWorkspaceCommand } from "@/application/admin/workspace/use-cases/create-workspace.js";
import { AdminWorkspaceSchema } from "@/presentation/admin/workspace/schemas/admin-workspace.schema.js";
import { UserId } from "@/domain/user/user-id.js";

const CreateWorkspaceRequestSchema = z
  .object({
    name: NonEmptyStringSchema.max(WorkspaceName.maxLength).transform(
      transformToValueObject(WorkspaceName.create),
    ),
    country: NonEmptyStringSchema.max(WorkspaceAddress.countryMaxLength),
    city: NonEmptyStringSchema.max(WorkspaceAddress.cityMaxLength),
    street: NonEmptyStringSchema.max(WorkspaceAddress.streetMaxLength),
    streetNumber: NonEmptyStringSchema.max(WorkspaceAddress.streetNumberMaxLength),
    postalCode: NonEmptyStringSchema.max(WorkspaceAddress.postalCodeMaxLength),
  })
  .strict();

const CreateWorkspaceResponseSchema = SuccessResponseSchema(AdminWorkspaceSchema);

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    "/admin/workspaces",
    {
      preHandler: async (req, reply) => {
        const result = await req.authenticate().andThen(() => req.authorize([UserRole.Admin]));
        if (result.isErr()) {
          return mapAppErrorToHttpError(reply, result.error);
        }
      },
      schema: {
        tags: ["Admin/Workspaces"],
        body: CreateWorkspaceRequestSchema,
        response: {
          201: CreateWorkspaceResponseSchema,
          400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
        },
      },
    },
    async (req, reply) => {
      if (!req.session || req.session.role !== "admin") {
        return mapAppErrorToHttpError(reply, unauthorized());
      }

      const validationResult = WorkspaceAddress.create({
        country: req.body.country,
        city: req.body.city,
        street: req.body.street,
        streetNumber: req.body.streetNumber,
        postalCode: req.body.postalCode,
      });

      if (validationResult.isErr()) {
        return mapAppErrorToHttpError(reply, validationResult.error);
      }

      const userIdResult = UserId.create(req.session.id);
      if (userIdResult.isErr()) {
        return mapAppErrorToHttpError(reply, userIdResult.error);
      }

      const result = await fastify.useCases.workspaces.createWorkspace.handle(
        new CreateWorkspaceCommand(userIdResult.value, req.body.name, validationResult.value),
      );
      if (result.isErr()) {
        return mapAppErrorToHttpError(reply, result.error);
      }

      reply.status(201).send({
        status: "success",
        data: result.value,
      });
    },
  );
};

export default plugin;
