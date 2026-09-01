export class IdGenerator {
  static currentId = 1000;

  static generateJobId() {
    this.currentId += 1;
    return `JOB-${this.currentId}`;
  }
}
