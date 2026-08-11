import { TestApp } from "../test-app.js";

declare module "../test-app.js" {
  interface TestApp {
    signUp(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response>;
    signIn(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response>;
    verifyAccount(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response>;
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

TestApp.prototype.signIn = async function (body: Record<string, unknown>, signal?: AbortSignal) {
  return await fetch(`${this.url}/auth/sign-in`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
};

TestApp.prototype.verifyAccount = async function (
  body: Record<string, unknown>,
  signal?: AbortSignal,
) {
  return await fetch(`${this.url}/auth/verify-account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
};
