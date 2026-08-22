import { Email } from "@/domain/shared/value-objects/email.js";
import { ProviderId } from "@/domain/user/provider-id.js";

export type OAuthUser = {
  providerId: ProviderId;
  email: Email;
};
