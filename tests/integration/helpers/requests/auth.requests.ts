import { TestApp } from "../test-app.js";

declare module "../test-app.js" {
  interface TestApp {
    signUp(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response>;
    signIn(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response>;
    verifyAccount(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response>;
    forgotPassword(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response>;
    resetPassword(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response>;
    logout(cookies?: string, signal?: AbortSignal): Promise<Response>;
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

TestApp.prototype.forgotPassword = async function (
  body: Record<string, unknown>,
  signal?: AbortSignal,
) {
  return await fetch(`${this.url}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
};

TestApp.prototype.resetPassword = async function (
  body: Record<string, unknown>,
  signal?: AbortSignal,
) {
  return await fetch(`${this.url}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
};

TestApp.prototype.logout = async function (cookies?: string, signal?: AbortSignal) {
  return await fetch(`${this.url}/auth/logout`, {
    method: "POST",
    headers: cookies ? { Cookie: cookies } : {},
    signal,
  });
};
