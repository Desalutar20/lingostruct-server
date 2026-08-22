import { IOAuthClient } from "@/application/abstractions/auth/oauth-client.interface.js";
import { OAuthConfig } from "@/application/config/oauth.config.js";
import { internal } from "@/domain/abstractions/errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { ProviderId } from "@/domain/user/provider-id.js";
import {
  GithubOAuthAccessTokenSchema,
  GithubOAuthUserEmailSchema,
  GithubOAuthUserSchema,
} from "@/infrastructure/auth/github/github-oauth.schema.js";
import { OAuthClient } from "@/infrastructure/auth/oauth-client.js";
import { err, fromPromise } from "neverthrow";
import z from "zod";
import { URL } from "@/domain/shared/value-objects/url.js";
import { OAuthState } from "@/application/abstractions/auth/oauth-state.js";
import { OAuthUser } from "@/application/abstractions/auth/oauth-user.type.js";

export class GithubOAuthClient extends OAuthClient implements IOAuthClient {
  constructor(config: OAuthConfig) {
    super(config, "github");
  }
  generateRedirectUrl(state: OAuthState): URL {
    const url = new globalThis.URL("https://github.com/login/oauth/authorize");

    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", this.redirectUrl);
    url.searchParams.set("state", state.toString());
    url.searchParams.set("scope", "read:user user:email");

    return URL.create(url.toString())._unsafeUnwrap();
  }

  public getUser(code: NonEmptyString): ResultAsync<OAuthUser> {
    return fromPromise(
      (async () => {
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code: code.value,
            redirect_uri: this.redirectUrl,
          }),
        });
        if (!tokenRes.ok) {
          return err(internal(`Github OAuth token exchange failed: ${tokenRes.status}`));
        }

        const { data, error } = await GithubOAuthAccessTokenSchema.safeParseAsync(
          await tokenRes.json(),
        );
        if (error) {
          return err(
            internal(
              `Failed to validate Github OAuth access token response: ${z.prettifyError(error)}`,
              error,
            ),
          );
        }

        const profileRes = await fetch("https://api.github.com/user", {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${data.access_token}`,
            "X-GitHub-Api-Version": "2026-03-10",
          },
        });
        if (!profileRes.ok) {
          return err(internal(`Github OAuth user profile request failed: ${profileRes.status}`));
        }

        const { error: userSchemaError, data: profileData } =
          await GithubOAuthUserSchema.safeParseAsync(await profileRes.json());
        if (userSchemaError) {
          return err(
            internal(
              `Failed to validate Github OAuth user profile response: ${z.prettifyError(userSchemaError)}`,
            ),
          );
        }

        if (profileData.email !== null) {
          return Email.create(profileData.email).andThen((email) =>
            ProviderId.create(profileData.id.toString()).map(
              (providerId) => ({ email, providerId }) satisfies OAuthUser,
            ),
          );
        }

        const emailsRes = await fetch("https://api.github.com/user/emails", {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${data.access_token}`,
          },
        });
        if (!emailsRes.ok) {
          return err(internal(`Github OAuth user emails request failed: ${emailsRes.status}`));
        }

        const { error: emailSchemaError, data: emailsData } =
          await GithubOAuthUserEmailSchema.safeParseAsync(await emailsRes.json());
        if (emailSchemaError) {
          return err(
            internal(
              `Failed to validate Github OAuth user emails response: ${z.prettifyError(emailSchemaError)}`,
            ),
          );
        }

        const email = emailsData.find(
          (email) =>
            (email.primary && email.verified) ||
            (email.verified && !email.email.endsWith("github.com")),
        );
        if (!email) return err(internal("GitHub OAuth account has no verified primary email"));

        return Email.create(email.email).andThen((email) =>
          ProviderId.create(profileData.id.toString()).map(
            (providerId) => ({ email, providerId }) satisfies OAuthUser,
          ),
        );
      })(),
      (error) => internal("Github OAuth request failed unexpectedly", error),
    ).andThen((result) => result);
  }
}
