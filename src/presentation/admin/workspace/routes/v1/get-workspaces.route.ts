import {
  ErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "@/presentation/shared/schemas/response.schema.js";
import { mapAppErrorToHttpError } from "@/presentation/shared/helpers/error-handler.js";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { unauthorized } from "@/domain/abstractions/errors.js";
import { KeysetPagination } from "@/domain/shared/pagination/keyset-pagination.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { CursorPaginationSchema } from "@/presentation/shared/schemas/pagination/cursor-pagination.schema.js";
import { UserRole } from "@/domain/user/user-role.js";
import { CursorPaginatedSchema } from "@/presentation/shared/schemas/pagination/cursor-paginated.schema.js";
import { NonEmptyStringSchema } from "@/presentation/shared/schemas/common.schema.js";
import { transformToValueObjectOptional } from "@/presentation/shared/schemas/transform-value-object.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";

import { WorkspaceId } from "@/domain/workspace/workspace-id.js";
import {
  GET_WORKSPACES_DEFAULT_LIMIT,
  GET_WORKSPACES_MAX_LIMIT,
  GET_WORKSPACES_SEARCH_MAX_LENGTH,
} from "@/application/admin/workspace/const/admin-workspace.const.js";
import { WorkspaceFilters } from "@/domain/workspace/workspace-filters.js";
import { GetWorkspacesQuery } from "@/application/admin/workspace/use-cases/get-workspaces.js";
import { AdminWorkspaceSchema } from "@/presentation/admin/workspace/schemas/admin-workspace.schema.js";

const GetWorkspacesRequestQuerySchema = CursorPaginationSchema(
  WorkspaceId.create,
  PositiveInt.create(GET_WORKSPACES_MAX_LIMIT)._unsafeUnwrap(),
  PositiveInt.create(GET_WORKSPACES_DEFAULT_LIMIT)._unsafeUnwrap(),
).and(
  z
    .object({
      search: NonEmptyStringSchema.max(GET_WORKSPACES_SEARCH_MAX_LENGTH)
        .optional()
        .transform(
          transformToValueObjectOptional((val) => NonEmptyString.create(val, "search", "Search")),
        ),
    })
    .strict(),
);

const GetWorkspacesResponseSchema = CursorPaginatedSchema(AdminWorkspaceSchema);

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
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
        querystring: GetWorkspacesRequestQuerySchema,
        response: {
          200: GetWorkspacesResponseSchema,
          400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
        },
      },
    },
    async (req, reply) => {
      if (!req.session || req.session.role !== "admin") {
        return mapAppErrorToHttpError(reply, unauthorized());
      }

      const filters = new WorkspaceFilters(req.query.search ?? undefined);

      const pagination = new KeysetPagination<WorkspaceId>(
        req.query.limit,
        req.query.prevCursor ?? null,
        req.query.nextCursor ?? null,
      );

      const result = await fastify.useCases.workspaces.getWorkspaces.handle(
        new GetWorkspacesQuery(filters, pagination),
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
