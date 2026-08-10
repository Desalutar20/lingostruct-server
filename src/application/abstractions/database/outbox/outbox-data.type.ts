export type OutboxEmailData = {
  type: "accountVerification";
  email: string;
  token: string;
};
