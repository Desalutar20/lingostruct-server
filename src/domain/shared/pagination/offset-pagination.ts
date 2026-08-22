import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";

export class OffsetPagination {
  constructor(
    public readonly limit: PositiveInt,
    public readonly page: PositiveInt = PositiveInt.create(1)._unsafeUnwrap(),
  ) {}

  public get offset() {
    return (this.page.value - 1) * this.limit.value;
  }
}
