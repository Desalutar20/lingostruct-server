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
import { SetUserBannedStatusCommand } from "@/application/admin/user/use-cases/set-user-banned-status.js";
import { UserIdSchema } from "@/presentation/admin/user/schemas/user-id.schema.js";

const SetUserBannedStatusRequestSchema = z
  .object({
    isBanned: z.boolean(),
  })
  .strict();

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.patch(
    "/admin/users/:id/ban",
    {
      preHandler: async (req, reply) => {
        const result = await req.authenticate().andThen(() => req.authorize([UserRole.Admin]));
        if (result.isErr()) {
          return mapAppErrorToHttpError(reply, result.error);
        }
      },
      schema: {
        tags: ["Admin/Users"],
        params: UserIdSchema,
        body: SetUserBannedStatusRequestSchema,
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

      const result = await fastify.useCases.users.setUserBannedStatus.handle(
        new SetUserBannedStatusCommand(req.params.id, req.body.isBanned),
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
