export class IdGenerator {
  private static currentId = 1000;

  public static generateJobId(): string {
    this.currentId += 1;
    return `JOB-${this.currentId}`;
  }
}
