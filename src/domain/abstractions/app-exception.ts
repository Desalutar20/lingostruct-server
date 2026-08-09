export abstract class AppException extends Error {
  protected constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
