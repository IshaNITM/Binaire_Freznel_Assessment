import { Priority } from "../models/types.js";
import { Logger } from "../utils/logger.js";

export class QueueManager {
  highQueue = [];
  lowQueue = [];
  processingMap = new Map();
  completedList = [];
  failedList = [];
  allJobsMap = new Map();

  constructor(scheduler) {
    this.scheduler = scheduler;
  }

  enqueueJob(job) {
    this.allJobsMap.set(job.jobId, job);

    if (job.priority === Priority.HIGH) {
      this.highQueue.push(job);
    } else {
      this.lowQueue.push(job);
    }

    this.scheduler.updateQueuePositions(this.highQueue, this.lowQueue);
    Logger.info(
      "QueueManager",
      `Job ${job.jobId} (${job.priority}) added to queue. High: ${this.highQueue.length}, Low: ${this.lowQueue.length}`,
    );
  }

  getNextJob() {
    const job = this.scheduler.selectNextJob(this.highQueue, this.lowQueue);
    if (job) {
      this.processingMap.set(job.jobId, job);
      this.scheduler.updateQueuePositions(this.highQueue, this.lowQueue);
    }
    return job;
  }

  markJobCompleted(jobId, result, outputFile) {
    const job = this.processingMap.get(jobId);
    if (job) {
      job.setCompleted(result, outputFile);
      this.processingMap.delete(jobId);
      this.completedList.unshift(job); // Add to head of completed history
      this.scheduler.updateQueuePositions(this.highQueue, this.lowQueue);
      Logger.info(
        "QueueManager",
        `Job ${jobId} marked completed with result ${result}`,
      );
    }
  }

  markJobFailed(jobId, error) {
    const job = this.processingMap.get(jobId);
    if (job) {
      job.setFailed(error);
      this.processingMap.delete(jobId);
      this.failedList.unshift(job);
      this.scheduler.updateQueuePositions(this.highQueue, this.lowQueue);
      Logger.info(
        "QueueManager",
        `Job ${jobId} marked failed with error: ${error}`,
      );
    }
  }

  getJob(jobId) {
    return this.allJobsMap.get(jobId);
  }

  getAllJobs() {
    const allJobs = [
      ...Array.from(this.processingMap.values()),
      ...this.highQueue,
      ...this.lowQueue,
      ...this.completedList,
      ...this.failedList,
    ];
    return allJobs.map((job) => job.toJSON());
  }

  getStats(activeWorkers, maxWorkers) {
    return {
      totalJobs: this.allJobsMap.size,
      processing: this.processingMap.size,
      waiting: this.highQueue.length + this.lowQueue.length,
      completed: this.completedList.length,
      failed: this.failedList.length,
      activeWorkers,
      maxWorkers,
    };
  }

  get waitingCount() {
    return this.highQueue.length + this.lowQueue.length;
  }
}
