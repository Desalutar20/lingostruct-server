export class EmailVerificationOutboxData {
  constructor(
    public readonly to: string,
    public readonly token: string,
  ) {}
}
