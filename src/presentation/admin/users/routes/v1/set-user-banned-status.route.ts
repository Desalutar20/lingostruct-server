import {
  ErrorResponseSchema,
  SuccessResponseSchema,
  ValidationErrorResponseSchema,
} from "@/presentation/shared/schemas/response.schema.js";
import { mapAppErrorToHttpError } from "@/presentation/shared/helpers/error-handler.js";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { unauthorized } from "@/domain/abstractions/errors.js";
import { UserId } from "@/domain/user/user-id.js";
import { UserRole } from "@/domain/user/user-role.js";
import { NonEmptyStringSchema } from "@/presentation/shared/schemas/common.schema.js";
import { transformToValueObject } from "@/presentation/shared/schemas/transform-value-object.js";
import { SetUserBannedStatusCommand } from "@/application/admin/users/use-cases/set-user-banned-status.js";

const SetUserBannedStatusRequestParamSchema = z
  .object({
    userId: NonEmptyStringSchema.transform(transformToValueObject(UserId.create)),
  })
  .strict();

const SetUserBannedStatusRequestSchema = z
  .object({
    isBanned: z.boolean(),
  })
  .strict();

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.patch(
    "/admin/users/:userId/ban",
    {
      preHandler: async (req, reply) => {
        const result = await req.authenticate().andThen(() => req.authorize([UserRole.Admin]));
        if (result.isErr()) {
          return mapAppErrorToHttpError(reply, result.error);
        }
      },
      schema: {
        tags: ["Admin/Users"],
        body: SetUserBannedStatusRequestSchema,
        params: SetUserBannedStatusRequestParamSchema,
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
        new SetUserBannedStatusCommand(req.params.userId, req.body.isBanned),
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
