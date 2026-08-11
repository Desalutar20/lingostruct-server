import { CronJob, CronOnCompleteCommand } from "cron";

export abstract class CronProcessor<OC extends CronOnCompleteCommand | null = null> {
  private readonly job: CronJob<OC>;
  protected constructor(cronTime: string | Date, onComplete?: OC) {
    this.job = new CronJob<OC>(cronTime, async () => await this.execute(), onComplete, true);
  }

  protected abstract execute(): Promise<void>;

  public start(): void {
    this.job.start();
  }

  public stop(): void {
    this.job.stop();
  }
}
