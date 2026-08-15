import { TestApp } from "../test-app.js";

declare module "../test-app.js" {
  interface TestApp {
    getMe(cookies?: string, signal?: AbortSignal): Promise<Response>;
    updateProfile: (
      body: Record<string, unknown>,
      cookies?: string,
      signal?: AbortSignal,
    ) => Promise<Response>;
  }
}

TestApp.prototype.getMe = async function (cookies?: string, signal?: AbortSignal) {
  return await fetch(`${this.url}/users/me`, {
    method: "GET",
    headers: cookies ? { Cookie: cookies } : {},
    signal,
  });
};

TestApp.prototype.updateProfile = async function (
  body: Record<string, unknown>,
  cookies?: string,
  signal?: AbortSignal,
) {
  return await fetch(`${this.url}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(cookies ? { Cookie: cookies } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });
};
