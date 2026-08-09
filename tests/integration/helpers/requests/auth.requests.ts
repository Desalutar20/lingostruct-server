import { TestApp } from "../test-app.js";

declare module "../test-app.js" {
  interface TestApp {
    signUp(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response>;
  }
}

TestApp.prototype.signUp = async function (body: Record<string, unknown>, signal?: AbortSignal) {
  return await fetch(`${this.url}/auth/sign-up`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
};
