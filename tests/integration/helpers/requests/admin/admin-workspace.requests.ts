import { TestApp } from "../../test-app.js";

declare module "../../test-app.js" {
  interface TestApp {
    getWorkspaces(
      query?: Record<string, unknown>,
      cookies?: string,
      signal?: AbortSignal,
    ): Promise<Response>;

    createWorkspace(
      body: Record<string, unknown>,
      cookies?: string,
      signal?: AbortSignal,
    ): Promise<Response>;

    updateWorkspace(
      workspaceId: string,
      body: Record<string, unknown>,
      cookies?: string,
      signal?: AbortSignal,
    ): Promise<Response>;
  }
}

TestApp.prototype.getWorkspaces = async function (
  query?: Record<string, unknown>,
  cookies?: string,
  signal?: AbortSignal,
) {
  const url = new URL("admin/workspaces", `${this.url}/`);
  TestApp.applyQueryParams(url, query);

  return await fetch(url, {
    method: "GET",
    headers: cookies ? { Cookie: cookies } : {},
    signal,
  });
};

TestApp.prototype.createWorkspace = async function (
  body: Record<string, unknown>,
  cookies?: string,
  signal?: AbortSignal,
) {
  return await fetch(`${this.url}/admin/workspaces`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookies ? { Cookie: cookies } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });
};

TestApp.prototype.updateWorkspace = async function (
  workspaceId: string,
  body: Record<string, unknown>,
  cookies?: string,
  signal?: AbortSignal,
) {
  return await fetch(`${this.url}/admin/workspaces/${workspaceId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(cookies ? { Cookie: cookies } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });
};
