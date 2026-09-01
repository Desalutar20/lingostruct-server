import {
  ErrorResponseSchema,
  SuccessResponseSchema,
  ValidationErrorResponseSchema,
} from "@/presentation/shared/schemas/response.schema.js";
import { mapAppErrorToHttpError } from "@/presentation/shared/helpers/error-handler.js";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { unauthorized } from "@/domain/abstractions/errors.js";
import { WorkspaceIdSchema } from "@/presentation/admin/workspace/schemas/workspace-id.schema.js";
import { AdminWorkspaceSchema } from "@/presentation/admin/workspace/schemas/admin-workspace.schema.js";
import { GetWorkspaceQuery } from "@/application/workspace/use-cases/get-workspace.js";
import { WorkspaceRole } from "@/domain/workspace-user/workspace-role.js";
import { WorkspaceSchema } from "@/presentation/workspace/schemas/workspace.schema.js";
import { UserRole } from "@/domain/user/user-role.js";

const GetWorkspaceResponseSchema = SuccessResponseSchema(
  z.union([AdminWorkspaceSchema, WorkspaceSchema]),
);

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    "/workspaces/:id",
    {
      preHandler: async (req, reply) => {
        const result = await req
          .authenticate()
          .andThen(() =>
            req.workspaceAuthorize(req.params.id, [WorkspaceRole.Owner, WorkspaceRole.Admin]),
          );

        if (result.isErr()) {
          return mapAppErrorToHttpError(reply, result.error);
        }
      },
      schema: {
        tags: ["Workspaces"],
        params: WorkspaceIdSchema,
        response: {
          200: GetWorkspaceResponseSchema,
          400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
        },
      },
    },
    async (req, reply) => {
      if (!req.session || req.session.role !== "admin") {
        return mapAppErrorToHttpError(reply, unauthorized());
      }

      const result = await fastify.useCases.workspaces.getWorkspace.handle(
        new GetWorkspaceQuery(req.params.id),
      );
      if (result.isErr()) {
        return mapAppErrorToHttpError(reply, result.error);
      }

      reply.status(200).send({
        status: "success",
        data:
          req.session.role === UserRole.Admin.value
            ? result.value
            : {
                name: result.value.name,
                country: result.value.country,
                city: result.value.city,
                street: result.value.street,
                streetNumber: result.value.streetNumber,
                postalCode: result.value.postalCode,
              },
      });
    },
  );
};

export default plugin;
