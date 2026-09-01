import { UserId } from "@/domain/user/user-id.js";
import { WorkspaceId } from "@/domain/workspace/workspace-id.js";

export const WORKSPACE_CACHE_KEYS = {
  WORKSPACE_USER: (workspaceId: WorkspaceId, userId: UserId) =>
    `workspaces:${workspaceId.value}:users${userId.value}` as const,
} as const;
