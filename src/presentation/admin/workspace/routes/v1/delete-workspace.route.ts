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
import { WorkspaceIdSchema } from "@/presentation/admin/workspace/schemas/workspace-id.schema.js";
import { DeleteWorkspaceCommand } from "@/application/admin/workspace/use-cases/delete-workspace.js";

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.delete(
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
        response: {
          200: SuccessResponseSchema(z.string()),
          400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
        },
      },
    },
    async (req, reply) => {
      if (!req.session || req.session.role !== "admin") {
        return mapAppErrorToHttpError(reply, unauthorized());
      }

      const result = await fastify.useCases.workspaces.deleteWorkspace.handle(
        new DeleteWorkspaceCommand(req.params.id),
      );
      if (result.isErr()) {
        return mapAppErrorToHttpError(reply, result.error);
      }

      reply.status(200).send({
        status: "success",
        data: "Success",
      });
    },
  );
};

export default plugin;
