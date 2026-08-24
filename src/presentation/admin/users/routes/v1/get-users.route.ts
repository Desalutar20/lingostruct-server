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
import { CursorPaginationSchema } from "@/presentation/shared/schemas/pagination/cursor.-pagination.schema.js";
import { UserRole } from "@/domain/user/user-role.js";
import { CursorPaginatedSchema } from "@/presentation/shared/schemas/pagination/cursor-paginated.schema.js";
import { AdminUserDto } from "@/application/admin/users/dto/admin-user.dto.js";
import {
  EmailSchema,
  IsoStringSchema,
  NonEmptyStringSchema,
} from "@/presentation/shared/schemas/common.schema.js";
import { transformToValueObjectOptional } from "@/presentation/shared/schemas/transform-value-object.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { UserFilters } from "@/domain/user/user-filters.js";
import {
  GET_USERS_DEFAULT_LIMIT,
  GET_USERS_MAX_LIMIT,
  GET_USERS_SEARCH_MAX_LENGTH,
} from "@/application/admin/users/const/admin-users.const.js";

const GetUsersRequestQuerySchema = CursorPaginationSchema(
  UserId.create,
  PositiveInt.create(GET_USERS_MAX_LIMIT)._unsafeUnwrap(),
  PositiveInt.create(GET_USERS_DEFAULT_LIMIT)._unsafeUnwrap(),
).and(
  z
    .object({
      search: NonEmptyStringSchema.max(GET_USERS_SEARCH_MAX_LENGTH)
        .optional()
        .transform(
          transformToValueObjectOptional((val) => NonEmptyString.create(val, "search", "Search")),
        ),
      isBanned: z.stringbool().optional(),
      isVerified: z.stringbool().optional(),
    })
    .strict(),
);

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
      preHandler: async (req, reply) => {
        const result = await req.authenticate().andThen(() => req.authorize([UserRole.Admin]));
        if (result.isErr()) {
          return mapAppErrorToHttpError(reply, result.error);
        }
      },
      schema: {
        tags: ["Admin/Users"],
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

      const filters = new UserFilters(
        req.query.search ?? undefined,
        req.query.isBanned,
        req.query.isVerified,
      );

      const pagination = new KeysetPagination<UserId>(
        req.query.limit,
        req.query.prevCursor ?? null,
        req.query.nextCursor ?? null,
      );

      const result = await fastify.useCases.users.getUsers.handle(
        new GetUsersQuery(filters, pagination),
      );
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
