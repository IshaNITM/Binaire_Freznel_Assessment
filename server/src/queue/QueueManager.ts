import { QueueJob } from '../models/QueueJob.js';
import { Priority, JobStatus, QueueStats, IQueueJobJSON } from '../models/types.js';
import { Scheduler } from '../scheduler/Scheduler.js';
import { Logger } from '../utils/logger.js';

export class QueueManager {
  private highQueue: QueueJob[] = [];
  private lowQueue: QueueJob[] = [];
  private processingMap: Map<string, QueueJob> = new Map();
  private completedList: QueueJob[] = [];
  private failedList: QueueJob[] = [];
  private allJobsMap: Map<string, QueueJob> = new Map();

  private scheduler: Scheduler;

  constructor(scheduler: Scheduler) {
    this.scheduler = scheduler;
  }

  public enqueueJob(job: QueueJob): void {
    this.allJobsMap.set(job.jobId, job);

    if (job.priority === Priority.HIGH) {
      this.highQueue.push(job);
    } else {
      this.lowQueue.push(job);
    }

    this.scheduler.updateQueuePositions(this.highQueue, this.lowQueue);
    Logger.info('QueueManager', `Job ${job.jobId} (${job.priority}) added to queue. High: ${this.highQueue.length}, Low: ${this.lowQueue.length}`);
  }

  public getNextJob(): QueueJob | null {
    const job = this.scheduler.selectNextJob(this.highQueue, this.lowQueue);
    if (job) {
      this.processingMap.set(job.jobId, job);
      this.scheduler.updateQueuePositions(this.highQueue, this.lowQueue);
    }
    return job;
  }

  public markJobCompleted(jobId: string, result: number): void {
    const job = this.processingMap.get(jobId);
    if (job) {
      job.setCompleted(result);
      this.processingMap.delete(jobId);
      this.completedList.unshift(job); // Add to head of completed history
      this.scheduler.updateQueuePositions(this.highQueue, this.lowQueue);
      Logger.info('QueueManager', `Job ${jobId} marked completed with result ${result}`);
    }
  }

  public markJobFailed(jobId: string, error: string): void {
    const job = this.processingMap.get(jobId);
    if (job) {
      job.setFailed(error);
      this.processingMap.delete(jobId);
      this.failedList.unshift(job);
      this.scheduler.updateQueuePositions(this.highQueue, this.lowQueue);
      Logger.info('QueueManager', `Job ${jobId} marked failed with error: ${error}`);
    }
  }

  public getJob(jobId: string): QueueJob | undefined {
    return this.allJobsMap.get(jobId);
  }

  public getAllJobs(): IQueueJobJSON[] {
    const allJobs: QueueJob[] = [
      ...Array.from(this.processingMap.values()),
      ...this.highQueue,
      ...this.lowQueue,
      ...this.completedList,
      ...this.failedList
    ];
    return allJobs.map(job => job.toJSON());
  }

  public getStats(activeWorkers: number, maxWorkers: number): QueueStats {
    return {
      totalJobs: this.allJobsMap.size,
      processing: this.processingMap.size,
      waiting: this.highQueue.length + this.lowQueue.length,
      completed: this.completedList.length,
      failed: this.failedList.length,
      activeWorkers,
      maxWorkers
    };
  }

  public get waitingCount(): number {
    return this.highQueue.length + this.lowQueue.length;
  }
}
