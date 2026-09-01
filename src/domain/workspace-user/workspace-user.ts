import { nowIso } from "@/app/helpers.js";
import { Entity } from "@/domain/abstractions/entity.js";
import { UserId } from "@/domain/user/user-id.js";
import { User } from "@/domain/user/user.js";
import { WorkspaceRole } from "@/domain/workspace-user/workspace-role.js";
import { WorkspaceUserId } from "@/domain/workspace-user/workspace-user-id.js";
import { WorkspaceId } from "@/domain/workspace/workspace-id.js";
import { Workspace } from "@/domain/workspace/workspace.js";

export class WorkspaceUser extends Entity<WorkspaceUserId> {
  private _workspace!: Workspace;
  private _user!: User;

  constructor(
    private _role: WorkspaceRole,
    private _workspaceId: WorkspaceId,
    private _userId: UserId,
  ) {
    const now = nowIso();
    super(WorkspaceUserId.generate(), now, now);
  }

  get role() {
    return this._role;
  }

  get workspaceId() {
    return this._workspaceId;
  }

  get userId() {
    return this._userId;
  }

  get user() {
    return this._user;
  }

  get workspace() {
    return this._workspace;
  }

  public static restore(
    id: WorkspaceUserId,
    createdAt: string,
    updatedAt: string,
    role: WorkspaceRole,
    workspaceId: WorkspaceId,
    userId: UserId,
    workspace: Workspace,
    user: User,
  ): WorkspaceUser {
    const workspaceUser = new WorkspaceUser(role, workspaceId, userId);

    workspaceUser._id = id;
    workspaceUser._createdAt = createdAt;
    workspaceUser._updatedAt = updatedAt;
    workspaceUser._workspace = workspace;
    workspaceUser._user = user;

    return workspaceUser;
  }
}
