import { nowIso } from "@/app/helpers.js";
import { Entity } from "@/domain/abstractions/entity.js";
import { WorkspaceAddress } from "@/domain/workspace/workspace-address.js";
import { WorkspaceId } from "@/domain/workspace/workspace-id.js";
import { WorkspaceName } from "@/domain/workspace/workspace-name.js";

export class Workspace extends Entity<WorkspaceId> {
  public constructor(
    private _name: WorkspaceName,
    private _address: WorkspaceAddress,
  ) {
    const now = nowIso();
    super(WorkspaceId.generate(), now, now);
  }

  public get name() {
    return this._name;
  }

  public get address() {
    return this._address;
  }

  public static restore(
    id: WorkspaceId,
    createdAt: string,
    updatedAt: string,
    name: WorkspaceName,
    address: WorkspaceAddress,
  ): Workspace {
    const workspace = new Workspace(name, address);

    workspace._id = id;
    workspace._createdAt = createdAt;
    workspace._updatedAt = updatedAt;

    return workspace;
  }
}
