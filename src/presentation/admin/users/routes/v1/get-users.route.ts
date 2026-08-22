import {
  ErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "@/presentation/shared/schemas/response.schema.js";
import { mapAppErrorToHttpError } from "@/presentation/shared/helpers/error-handler.js";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { unauthorized } from "@/domain/abstractions/errors.js";
import { GetUsersQuery } from "@/application/admin/users/use-cases/get-users.js";
import { UserId } from "@/domain/user/user-id.js";
import { KeysetPagination } from "@/domain/shared/pagination/keyset-pagination.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { CursorSchema } from "@/presentation/shared/schemas/pagination/cursor.schema.js";
import { UserRole } from "@/domain/user/user-role.js";
import { CursorPaginatedSchema } from "@/presentation/shared/schemas/pagination/cursor-paginated.schema.js";
import { AdminUserDto } from "@/application/admin/users/dto/admin-user.dto.js";
import {
  EmailSchema,
  IsoStringSchema,
  NonEmptyStringSchema,
} from "@/presentation/shared/schemas/common.schema.js";

const GetUsersRequestQuerySchema = CursorSchema(
  UserId.create,
  PositiveInt.create(30)._unsafeUnwrap(),
).strict();

const GetUsersResponseSchema = CursorPaginatedSchema(
  z.object({
    id: NonEmptyStringSchema,
    createdAt: IsoStringSchema,
    updatedAt: IsoStringSchema,
    email: EmailSchema,
    firstName: NonEmptyStringSchema.nullable(),
    lastName: NonEmptyStringSchema.nullable(),
    role: NonEmptyStringSchema,
    isBanned: z.boolean(),
    isVerified: z.boolean(),
    googleId: NonEmptyStringSchema.nullable(),
    githubId: NonEmptyStringSchema.nullable(),
    avatarId: NonEmptyStringSchema.nullable(),
  }) satisfies z.ZodType<AdminUserDto>,
);

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    "/admin/users",
    {
      config: {
        rateLimit: {
          max: 200,
          timeWindow: "1 minute",
        },
      },
      preHandler: async (req, reply) => {
        const result = await req.authenticate().andThen(() => req.authorize([UserRole.Admin]));
        if (result.isErr()) {
          return mapAppErrorToHttpError(reply, result.error);
        }
      },
      schema: {
        tags: ["Users"],
        querystring: GetUsersRequestQuerySchema,
        response: {
          200: GetUsersResponseSchema,
          400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
        },
      },
    },
    async (req, reply) => {
      if (!req.session) {
        return mapAppErrorToHttpError(reply, unauthorized());
      }

      const pagination = new KeysetPagination<UserId>(
        PositiveInt.create(2)._unsafeUnwrap(),
        req.query.prevCursor ?? null,
        req.query.nextCursor ?? null,
      );

      const result = await fastify.useCases.users.getUsers.handle(new GetUsersQuery(pagination));
      if (result.isErr()) {
        return mapAppErrorToHttpError(reply, result.error);
      }

      reply.status(200).send({
        status: "success",
        data: result.value.data,
        prevCursor: result.value.prevCursor?.toString() ?? null,
        nextCursor: result.value.nextCursor?.toString() ?? null,
      });
    },
  );
};

export default plugin;
