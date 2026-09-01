import EventEmitter from 'events';
import { QueueManager } from '../queue/QueueManager.js';
import { Scheduler } from '../scheduler/Scheduler.js';
import { WorkerManager } from '../workers/WorkerManager.js';
import { CsvProcessor } from '../workers/CsvProcessor.js';
import { QueueJob } from '../models/QueueJob.js';
import { Priority, JobStatus, IQueueJobJSON, QueueStats } from '../models/types.js';
import { IdGenerator } from '../utils/idGenerator.js';
import { Logger } from '../utils/logger.js';

export class QueueService extends EventEmitter {
  private queueManager: QueueManager;
  private workerManager: WorkerManager;
  private scheduler: Scheduler;

  constructor(maxWorkers: number = 4) {
    super();
    this.scheduler = new Scheduler(5); // 5 cycles threshold for low-priority starvation prevention
    this.queueManager = new QueueManager(this.scheduler);
    this.workerManager = new WorkerManager(maxWorkers, 60000);

    // Register worker manager callbacks
    this.workerManager.registerCallbacks(
      (job, progress) => this.handleJobProgress(job, progress),
      (job, result) => this.handleJobCompletion(job, result),
      (job, error) => this.handleJobFailure(job, error)
    );
  }

  /**
   * Submits a new CSV file to the system for processing.
   */
  public async submitJob(
    clientId: string,
    fileName: string,
    filePath: string,
    fileSize: number,
    priority: Priority
  ): Promise<{ success: boolean; job?: IQueueJobJSON; error?: string }> {
    // Validate CSV file content before adding to queue
    const validation = await CsvProcessor.validateCsv(filePath);
    if (!validation.isValid) {
      Logger.warn('QueueService', `Validation failed for file ${fileName}: ${validation.error}`);
      return { success: false, error: validation.error || 'Invalid CSV file' };
    }

    const jobId = IdGenerator.generateJobId();
    const job = new QueueJob(jobId, clientId, fileName, filePath, fileSize, priority);

    this.queueManager.enqueueJob(job);
    this.emitQueueUpdate();

    // Trigger dispatch loop
    this.processNextJobs();

    return { success: true, job: job.toJSON() };
  }

  /**
   * Dispatches waiting jobs to available workers in the pool.
   */
  private processNextJobs(): void {
    while (this.workerManager.hasAvailableWorker && this.queueManager.waitingCount > 0) {
      const job = this.queueManager.getNextJob();
      if (!job) break;

      Logger.info('QueueService', `Dispatching ${job.jobId} to worker pool`);
      const assigned = this.workerManager.executeJob(job);
      if (!assigned) {
        // Should not happen, but safety fallback
        Logger.error('QueueService', `Failed to execute job ${job.jobId}`);
        break;
      }
      this.emitQueueUpdate();
    }
  }

  private handleJobProgress(job: QueueJob, progress: number): void {
    this.emit('job:progress', job.toJSON());
  }

  private handleJobCompletion(job: QueueJob, result: number): void {
    this.queueManager.markJobCompleted(job.jobId, result);
    this.emitQueueUpdate();
    this.emit('job:completed', job.toJSON());
    // Trigger next job processing
    this.processNextJobs();
  }

  private handleJobFailure(job: QueueJob, error: string): void {
    this.queueManager.markJobFailed(job.jobId, error);
    this.emitQueueUpdate();
    this.emit('job:failed', job.toJSON());
    // Trigger next job processing
    this.processNextJobs();
  }

  private emitQueueUpdate(): void {
    this.emit('queue:update', {
      jobs: this.queueManager.getAllJobs(),
      stats: this.getStats()
    });
  }

  public getQueueState(): { jobs: IQueueJobJSON[]; stats: QueueStats } {
    return {
      jobs: this.queueManager.getAllJobs(),
      stats: this.getStats()
    };
  }

  public getJobStatus(jobId: string): IQueueJobJSON | null {
    const job = this.queueManager.getJob(jobId);
    return job ? job.toJSON() : null;
  }

  public getStats(): QueueStats {
    return this.queueManager.getStats(
      this.workerManager.activeWorkerCount,
      this.workerManager.maxWorkerCount
    );
  }
}
