import { TestApp } from "../../test-app.js";

declare module "../../test-app.js" {
  interface TestApp {
    getUsers(
      query?: Record<string, unknown>,
      cookies?: string,
      signal?: AbortSignal,
    ): Promise<Response>;

    setUserBannedStatus(
      userId: string,
      body: Record<string, unknown>,
      cookies?: string,
      signal?: AbortSignal,
    ): Promise<Response>;

    deleteUser(userId: string, cookies?: string, signal?: AbortSignal): Promise<Response>;
  }
}

TestApp.prototype.getUsers = async function (
  query?: Record<string, unknown>,
  cookies?: string,
  signal?: AbortSignal,
) {
  const url = new URL("admin/users", `${this.url}/`);
  TestApp.applyQueryParams(url, query);

  return await fetch(url, {
    method: "GET",
    headers: cookies ? { Cookie: cookies } : {},
    signal,
  });
};

TestApp.prototype.setUserBannedStatus = async function (
  userId: string,
  body: Record<string, unknown>,
  cookies?: string,
  signal?: AbortSignal,
) {
  return await fetch(`${this.url}/admin/users/${userId}/ban`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(cookies ? { Cookie: cookies } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });
};

TestApp.prototype.deleteUser = async function (
  userId: string,
  cookies?: string,
  signal?: AbortSignal,
) {
  return await fetch(`${this.url}/admin/users/${userId}`, {
    method: "DELETE",
    headers: cookies ? { Cookie: cookies } : {},
    signal,
  });
};
