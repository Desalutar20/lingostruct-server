import { IUnitOfWork } from "@/application/abstractions/database/unit-of-work.interface.js";
import { ILogger } from "@/application/abstractions/logger/logger.interface.js";
import { CronProcessor } from "@/infrastructure/background-jobs/cron-processor.js";

export class DeleteNotVerifiedUsersProcessor extends CronProcessor {
  constructor(
    private readonly unitOfWork: IUnitOfWork,
    private readonly logger: ILogger,
  ) {
    super("0 * * * *");
  }

  protected async execute(): Promise<void> {
    await this.unitOfWork.execute(({ userRepository }, { commit, rollback }) =>
      userRepository
        .deleteNotVerifiedUsers()
        .andThen(commit)
        .orElse((err) => {
          this.logger.error(
            `[DeleteNotVerifiedUsersProcessor] Failed to delete not verified users: ${String(err)}`,
          );
          return rollback();
        }),
    );
  }
}
