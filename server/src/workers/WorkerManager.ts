import { Worker } from 'worker_threads';
import path from 'path';
import fs from 'fs';
import { QueueJob } from '../models/QueueJob.js';
import { WorkerTaskData, WorkerMessage } from '../models/types.js';
import { Logger } from '../utils/logger.js';

interface ActiveWorkerInfo {
  worker: Worker;
  workerId: string;
  job: QueueJob;
  timeoutTimer: NodeJS.Timeout;
}

export class WorkerManager {
  private readonly maxWorkers: number;
  private readonly timeoutMs: number;
  private activeWorkers: Map<string, ActiveWorkerInfo> = new Map();
  private workerCounter = 0;

  private onProgressCallback?: (job: QueueJob, progress: number) => void;
  private onCompleteCallback?: (job: QueueJob, result: number) => void;
  private onErrorCallback?: (job: QueueJob, error: string) => void;

  constructor(maxWorkers: number = 4, timeoutMs: number = 60000) {
    this.maxWorkers = maxWorkers;
    this.timeoutMs = timeoutMs;
  }

  public registerCallbacks(
    onProgress: (job: QueueJob, progress: number) => void,
    onComplete: (job: QueueJob, result: number) => void,
    onError: (job: QueueJob, error: string) => void
  ): void {
    this.onProgressCallback = onProgress;
    this.onCompleteCallback = onComplete;
    this.onErrorCallback = onError;
  }

  public get maxWorkerCount(): number {
    return this.maxWorkers;
  }

  public get activeWorkerCount(): number {
    return this.activeWorkers.size;
  }

  public get hasAvailableWorker(): boolean {
    return this.activeWorkers.size < this.maxWorkers;
  }

  /**
   * Assigns a job to a worker thread and starts execution.
   */
  public executeJob(job: QueueJob): boolean {
    if (!this.hasAvailableWorker) {
      return false;
    }

    this.workerCounter++;
    const workerId = `WORKER-${this.workerCounter}`;
    job.setProcessing(workerId);

    const taskData: WorkerTaskData = {
      jobId: job.jobId,
      filePath: job.filePath
    };

    // Determine path to worker script (supports both tsx runtime and compiled js)
    const ext = __filename.endsWith('.ts') ? '.ts' : '.js';
    const workerScriptPath = path.join(__dirname, `csvWorker${ext}`);

    Logger.info('WorkerManager', `Assigning ${job.jobId} to ${workerId} using script ${workerScriptPath}`);

    const workerOptions: any = { workerData: taskData };
    
    // If running under tsx/ts-node, register tsxloader
    if (ext === '.ts') {
      workerOptions.execArgv = ['--import', 'tsx'];
    }

    let worker: Worker;
    try {
      worker = new Worker(workerScriptPath, workerOptions);
    } catch (err: any) {
      Logger.error('WorkerManager', `Failed to spawn worker for ${job.jobId}: ${err.message}`);
      if (this.onErrorCallback) {
        this.onErrorCallback(job, `Worker creation error: ${err.message}`);
      }
      return false;
    }

    // Set watchdog timer to prevent deadlocks (hanging workers)
    const timeoutTimer = setTimeout(() => {
      this.handleWorkerTimeout(workerId, job);
    }, this.timeoutMs);

    const activeInfo: ActiveWorkerInfo = {
      worker,
      workerId,
      job,
      timeoutTimer
    };

    this.activeWorkers.set(workerId, activeInfo);

    worker.on('message', (message: WorkerMessage) => {
      this.handleWorkerMessage(workerId, job, message);
    });

    worker.on('error', (err: Error) => {
      this.handleWorkerError(workerId, job, err.message);
    });

    worker.on('exit', (code: number) => {
      if (code !== 0 && this.activeWorkers.has(workerId)) {
        this.handleWorkerError(workerId, job, `Worker exited prematurely with code ${code}`);
      }
    });

    return true;
  }

  private handleWorkerMessage(workerId: string, job: QueueJob, message: WorkerMessage): void {
    const active = this.activeWorkers.get(workerId);
    if (!active) return;

    switch (message.type) {
      case 'PROGRESS':
        job.setProgress(message.progress);
        if (this.onProgressCallback) {
          this.onProgressCallback(job, message.progress);
        }
        break;

      case 'SUCCESS':
        this.cleanupWorker(workerId);
        job.setCompleted(message.result);
        if (this.onCompleteCallback) {
          this.onCompleteCallback(job, message.result);
        }
        break;

      case 'ERROR':
        this.cleanupWorker(workerId);
        job.setFailed(message.error);
        if (this.onErrorCallback) {
          this.onErrorCallback(job, message.error);
        }
        break;
    }
  }

  private handleWorkerError(workerId: string, job: QueueJob, errorMessage: string): void {
    Logger.error('WorkerManager', `Worker ${workerId} error on ${job.jobId}: ${errorMessage}`);
    this.cleanupWorker(workerId);
    job.setFailed(errorMessage);
    if (this.onErrorCallback) {
      this.onErrorCallback(job, errorMessage);
    }
  }

  private handleWorkerTimeout(workerId: string, job: QueueJob): void {
    Logger.warn('WorkerManager', `Worker ${workerId} timed out executing ${job.jobId}. Terminating worker...`);
    const active = this.activeWorkers.get(workerId);
    if (active) {
      active.worker.terminate();
      this.cleanupWorker(workerId);
      const timeoutError = `Job execution timed out (${this.timeoutMs / 1000}s limit exceeded)`;
      job.setFailed(timeoutError);
      if (this.onErrorCallback) {
        this.onErrorCallback(job, timeoutError);
      }
    }
  }

  private cleanupWorker(workerId: string): void {
    const active = this.activeWorkers.get(workerId);
    if (active) {
      clearTimeout(active.timeoutTimer);
      this.activeWorkers.delete(workerId);
      Logger.info('WorkerManager', `Worker ${workerId} cleaned up and slot released.`);
    }
  }
}
