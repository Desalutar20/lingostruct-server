import { it, describe, expect } from "vitest";
import { TestApp } from "../helpers/test-app.js";
import { faker } from "@faker-js/faker";
import { Password } from "@/domain/user/password.js";
import "../helpers/requests/index.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { Session } from "@/application/abstractions/auth/session.type.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";

describe("Authentication", () => {
  describe("Sign In", () => {
    const validData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: Password.maxLength - 1 }),
    };

    it("Should return 200 status code when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        await app.signUpAndVerify(validData, signal);

        const response = await app.signIn(
          { email: validData.email, password: validData.password },
          signal,
        );
        expect(response.status).toBe(200);

        const data = await response.json();
        const parsedCookies = app.parseCookie(response.headers.get("Set-Cookie") ?? "");

        expect(data).toMatchObject({
          status: "success",
          data: {
            id: expect.any(String),
            email: expect.any(String),
            firstName: expect.any(String),
            lastName: expect.any(String),
            role: expect.any(String),
            avatarUrl: null,
          },
        });
        expect(parsedCookies).toHaveProperty(app.config.application.sessionCookieName);
        expect(parsedCookies).toHaveProperty("Max-Age");
        expect(Number(parsedCookies["Max-Age"])).toBe(
          app.config.application.sessionTTLMinutes * 60,
        );
      });
    });

    it("Should create a user session on successful sign-in", async ({ signal }) => {
      await TestApp.run(async (app) => {
        await app.signUpAndVerify(validData, signal);

        const response = await app.signIn(
          { email: validData.email, password: validData.password },
          signal,
        );
        expect(response.status).toBe(200);

        const data = (await response.json()) as { data: Session };

        const parsedCookies = app.parseCookie(response.headers.get("Set-Cookie") ?? "");
        const sessionId = app.unsignCookie(parsedCookies[app.config.application.sessionCookieName]);

        expect(sessionId).not.toBeNull();
        expect(UUID.create(sessionId!).isOk()).toBe(true);

        const userSession = await app.getSession(sessionId!);
        expect(userSession).toBeDefined();
        expect(() => JSON.parse(userSession!)).not.toThrow();

        const parsedUser = JSON.parse(userSession!);

        expect(parsedUser).toMatchObject({
          id: expect.any(String),
          email: expect.any(String),
          firstName: expect.any(String),
          lastName: expect.any(String),
          role: expect.any(String),
        });
        expect(parsedUser["id"]).toBe(data.data.id);
      });
    });

    it("Should remove the oldest session when the session limit is reached", async ({ signal }) => {
      await TestApp.run(async (app) => {
        await app.signUpAndVerify(validData, signal);

        let firstSessionId: string;

        for (let index = 0; index < app.config.application.maxSessions; index++) {
          const response = await app.signIn(
            { email: validData.email, password: validData.password },
            signal,
          );
          expect(response.status).toBe(200);

          const data = (await response.json()) as { data: Session };

          const parsedCookies = app.parseCookie(response.headers.get("Set-Cookie") ?? "");
          const sessionId = app.unsignCookie(
            parsedCookies[app.config.application.sessionCookieName],
          );

          expect(sessionId).not.toBeNull();
          expect(UUID.create(sessionId!).isOk()).toBe(true);

          if (index === 0) {
            firstSessionId = sessionId!;
          }

          const userSession = await app.getSession(sessionId!);
          expect(userSession).toBeDefined();
          expect(() => JSON.parse(userSession!)).not.toThrow();

          const parsedUser = JSON.parse(userSession!);

          expect(parsedUser).toMatchObject({
            id: expect.any(String),
            email: expect.any(String),
            firstName: expect.any(String),
            lastName: expect.any(String),
            role: expect.any(String),
          });
          expect(parsedUser["id"]).toBe(data.data.id);
        }

        const response = await app.signIn(
          { email: validData.email, password: validData.password },
          signal,
        );
        expect(response.status).toBe(200);

        const firstSession = await app.getSession(firstSessionId!);
        expect(firstSession).toBeUndefined();
      });
    });

    it("Should return 400 status code when data is invalid", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const invalidData = [
          [
            "Empty email",
            {
              password: validData.password,
              email: "",
            },
            "email",
          ],
          [
            "Whitespace email",
            {
              password: validData.password,
              email: "   ",
            },
            "email",
          ],
          [
            `Email is longer than ${Email.maxLength}`,
            {
              password: validData.password,
              email: `test${"t".repeat(Email.maxLength)}@gmail.com`,
            },
            "email",
          ],
          [
            "Empty password",
            {
              ...validData,
              password: "",
            },
            "password",
          ],
          [
            "Whitespace password",
            {
              ...validData,
              password: "   ",
            },
            "password",
          ],
          [
            `Password is shorter than ${Password.minLength}`,
            {
              ...validData,
              password: faker.internet.password({ length: Password.minLength - 1 }),
            },
            "password",
          ],
          [
            `Password is longer than ${Password.maxLength}`,
            {
              ...validData,
              password: faker.internet.password({ length: Password.maxLength + 1 }),
            },
            "password",
          ],
        ] as const;

        await Promise.allSettled(
          invalidData.map(async ([description, body, field]) => {
            const response = await app.signIn(body, signal);
            expect(response.status, description).toBe(400);

            const data = await response.json();

            expect(data, description).toMatchObject({
              errors: {
                [field]: [expect.any(String)],
              },
            });
          }),
        );
      });
    });

    it("Should return 400 status code when user doesn't exist or user is banned/not verified", async ({
      signal,
    }) => {
      await TestApp.run(async (app) => {
        const cases = [
          "When user doesn't exist",
          "When user is banned",
          "When user is not verified",
        ] as const;

        for (const testCase of cases) {
          const validData = {
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            email: faker.internet.email(),
            password: faker.internet.password({
              length: Password.maxLength - 1,
            }),
          };

          await app.signUpAndVerify(validData, signal);

          if (testCase === "When user doesn't exist") {
            await app.deleteUserFromDbByEmail(validData.email);
          }

          if (testCase === "When user is banned") {
            await app.banUserInDbByEmail(validData.email);
          }

          if (testCase === "When user is not verified") {
            await app.unVerifyUserInDbByEmail(validData.email);
          }

          const response = await app.signIn(
            {
              email: validData.email,
              password: validData.password,
            },
            signal,
          );

          expect(response.status).toBe(400);
        }
      });
    });

    it("Should return 429 status code when rate limit is exceeded", async ({ signal }) => {
      await TestApp.run(async (app) => {
        await Promise.allSettled(
          [...Array(app.config.rateLimit.signIn)].map(async () => {
            const response = await app.signIn(
              { email: "invalid email", password: faker.internet.password() },
              signal,
            );

            expect(response.status).toBe(400);
          }),
        );

        const lastRes = await app.signIn(
          { email: "invalid email", password: faker.internet.password() },
          signal,
        );
        expect(lastRes.status).toBe(429);
      });
    });
  });
});
