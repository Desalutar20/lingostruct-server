import { FastifyInstance, type FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { errAsync, okAsync } from "neverthrow";
import { accessForbidden } from "@/domain/abstractions/errors.js";
import { UserRole } from "@/domain/user/user-role.js";
import { WorkspaceRole } from "@/domain/workspace-user/workspace-role.js";
import { WorkspaceId } from "@/domain/workspace/workspace-id.js";
import { WorkspaceAccessAuthorizationCommand } from "@/application/workspace/use-cases/workspace-authorization.js";
import { UserId } from "@/domain/user/user-id.js";

declare module "fastify" {
  export interface FastifyRequest {
    workspaceAuthorize: ReturnType<typeof workspaceAuthorize>;
  }
}

function workspaceAuthorize(fastify: FastifyInstance) {
  return function (
    this: FastifyRequest,
    workspaceId: WorkspaceId,
    roles: WorkspaceRole[],
  ): ResultAsync<void> {
    const session = this.session;
    if (!session) {
      return errAsync(accessForbidden());
    }

    const userIdResult = UserId.create(session.id);
    if (userIdResult.isErr()) {
      return errAsync(accessForbidden());
    }

    if (session.role === UserRole.Admin.value) {
      return okAsync();
    }

    const command = new WorkspaceAccessAuthorizationCommand(workspaceId, userIdResult.value, roles);
    return fastify.useCases.workspaces.workspaceAuthorization.handle(command);
  };
}

export default fp(
  async (fastify) => {
    fastify.decorateRequest("workspaceAuthorize", workspaceAuthorize(fastify));
  },
  {
    name: "workspaceAuthorize",
  },
);
