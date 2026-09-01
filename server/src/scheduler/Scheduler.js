import { Logger } from "../utils/logger.js";

export class Scheduler {
  constructor(maxAgeThreshold = 5) {
    this.maxAgeThreshold = maxAgeThreshold;
  }

  /**
   * Selects the next job to process according to Priority + Aging algorithm.
   * Modifies queues in-place by removing and returning the chosen job.
   */
  selectNextJob(highQueue, lowQueue) {
    if (highQueue.length === 0 && lowQueue.length === 0) {
      return null;
    }

    // 1. Age all low-priority jobs currently waiting
    for (const job of lowQueue) {
      job.incrementAge();
    }

    // 2. Check if any low-priority job has reached starvation threshold
    const starvedJobIndex = lowQueue.findIndex(
      (job) => job.age >= this.maxAgeThreshold,
    );
    if (starvedJobIndex !== -1) {
      const [starvedJob] = lowQueue.splice(starvedJobIndex, 1);
      starvedJob.resetAge();
      Logger.info(
        "Scheduler",
        `Starvation Prevention triggered: Promoted Low-priority job ${starvedJob.jobId} (age: ${this.maxAgeThreshold}+)`,
      );
      return starvedJob;
    }

    // 3. Otherwise, serve High priority queue if not empty
    if (highQueue.length > 0) {
      const job = highQueue.shift();
      job.resetAge();
      return job;
    }

    // 4. Servicing Low priority queue if High priority is empty
    const job = lowQueue.shift();
    job.resetAge();
    return job;
  }

  /**
   * Updates positions (1..N) across ordered high and low priority queues.
   */
  updateQueuePositions(highQueue, lowQueue) {
    let position = 1;
    for (const job of highQueue) {
      job.setQueuePosition(position++);
    }
    for (const job of lowQueue) {
      job.setQueuePosition(position++);
    }
  }
}
