import { IOAuthClient } from "@/application/abstractions/auth/oauth-client.interface.js";
import { OAuthProvider } from "@/domain/user/oauth-provider.js";

export interface IOAuthClientFactory {
  get: (provider: OAuthProvider) => IOAuthClient;
}
