import { Workspace } from "@/domain/workspace/workspace.js";

export class AdminWorkspaceDto {
  public readonly id: string;
  public readonly createdAt: string;
  public readonly updatedAt: string;
  public readonly name: string;
  public readonly country: string;
  public readonly city: string;
  public readonly street: string;
  public readonly streetNumber: string;
  public readonly postalCode: string;

  constructor(workspace: Workspace) {
    this.id = workspace.id.value;
    this.createdAt = workspace.createdAt;
    this.updatedAt = workspace.updatedAt;
    this.name = workspace.name.value;
    this.country = workspace.address.country;
    this.city = workspace.address.city;
    this.street = workspace.address.street;
    this.streetNumber = workspace.address.streetNumber;
    this.postalCode = workspace.address.postalCode;
  }
}
