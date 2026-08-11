export type OutboxEmailData =
  | {
      type: "accountVerification";
      email: string;
      token: string;
    }
  | {
      type: "passwordReset";
      email: string;
      token: string;
    };
