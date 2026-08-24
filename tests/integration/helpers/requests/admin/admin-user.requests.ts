import { TestApp } from "../../test-app.js";

declare module "../../test-app.js" {
  interface TestApp {
    getUsers(
      query?: Record<string, unknown>,
      cookies?: string,
      signal?: AbortSignal,
    ): Promise<Response>;
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
