import { TestApp } from "../test-app.js";

declare module "../test-app.js" {
  interface TestApp {
    getWorkspace(workspaceId: string, cookies?: string, signal?: AbortSignal): Promise<Response>;
  }
}

TestApp.prototype.getWorkspace = async function (
  workspaceId: string,
  cookies?: string,
  signal?: AbortSignal,
) {
  return await fetch(`${this.url}/workspaces/${workspaceId}`, {
    method: "GET",
    headers: cookies ? { Cookie: cookies } : {},
    signal,
  });
};
