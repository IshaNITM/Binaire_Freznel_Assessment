import { Worker } from "worker_threads";
import path from "path";
import fs from "fs";
import { Logger } from "../utils/logger.js";

export class WorkerManager {
  activeWorkers = new Map();
  workerCounter = 0;

  constructor(maxWorkers = 4, timeoutMs = 60000) {
    this.maxWorkers = maxWorkers;
    this.timeoutMs = timeoutMs;
  }

  registerCallbacks(onProgress, onComplete, onError) {
    this.onProgressCallback = onProgress;
    this.onCompleteCallback = onComplete;
    this.onErrorCallback = onError;
  }

  get maxWorkerCount() {
    return this.maxWorkers;
  }

  get activeWorkerCount() {
    return this.activeWorkers.size;
  }

  get hasAvailableWorker() {
    return this.activeWorkers.size < this.maxWorkers;
  }

  /**
   * Assigns a job to a worker thread and starts execution.
   */
  executeJob(job) {
    if (!this.hasAvailableWorker) {
      return false;
    }

    this.workerCounter++;
    const workerId = `WORKER-${this.workerCounter}`;
    job.setProcessing(workerId);

    const taskData = {
      jobId: job.jobId,
      filePath: job.filePath,
    };

    // Use import.meta.url to correctly resolve the worker path in ES modules
    let workerScriptPath;
    try {
      workerScriptPath = new URL("./csvWorker.js", import.meta.url);
    } catch (err) {
      const errMsg = `Worker script resolution failed: ${err.message}`;
      Logger.error("WorkerManager", errMsg);
      if (this.onErrorCallback) {
        this.onErrorCallback(job, errMsg);
      }
      return false;
    }

    Logger.info(
      "WorkerManager",
      `Assigning ${job.jobId} to ${workerId} using script ${workerScriptPath}`,
    );

    let worker;
    try {
      worker = new Worker(workerScriptPath, { workerData: taskData });
    } catch (err) {
      Logger.error(
        "WorkerManager",
        `Failed to spawn worker for ${job.jobId}: ${err.message}`,
      );
      if (this.onErrorCallback) {
        this.onErrorCallback(job, `Worker creation error: ${err.message}`);
      }
      return false;
    }

    // Set watchdog timer to prevent deadlocks (hanging workers)
    const timeoutTimer = setTimeout(() => {
      this.handleWorkerTimeout(workerId, job);
    }, this.timeoutMs);

    const activeInfo = {
      worker,
      workerId,
      job,
      timeoutTimer,
    };

    this.activeWorkers.set(workerId, activeInfo);

    worker.on("message", (message) => {
      this.handleWorkerMessage(workerId, job, message);
    });

    worker.on("error", (err) => {
      this.handleWorkerError(workerId, job, err.message);
    });

    worker.on("exit", (code) => {
      if (code !== 0 && this.activeWorkers.has(workerId)) {
        this.handleWorkerError(
          workerId,
          job,
          `Worker exited prematurely with code ${code}`,
        );
      }
    });

    return true;
  }

  handleWorkerMessage(workerId, job, message) {
    const active = this.activeWorkers.get(workerId);
    if (!active) return;

    switch (message.type) {
      case "PROGRESS":
        job.setProgress(message.progress);
        if (this.onProgressCallback) {
          this.onProgressCallback(job, message.progress);
        }
        break;

      case "SUCCESS":
        this.cleanupWorker(workerId);
        job.setCompleted(message.result, message.outputFile);
        if (this.onCompleteCallback) {
          this.onCompleteCallback(job, message.result, message.outputFile);
        }
        break;

      case "ERROR":
        this.cleanupWorker(workerId);
        job.setFailed(message.error);
        if (this.onErrorCallback) {
          this.onErrorCallback(job, message.error);
        }
        break;
    }
  }

  handleWorkerError(workerId, job, errorMessage) {
    Logger.error(
      "WorkerManager",
      `Worker ${workerId} error on ${job.jobId}: ${errorMessage}`,
    );
    this.cleanupWorker(workerId);
    job.setFailed(errorMessage);
    if (this.onErrorCallback) {
      this.onErrorCallback(job, errorMessage);
    }
  }

  handleWorkerTimeout(workerId, job) {
    Logger.warn(
      "WorkerManager",
      `Worker ${workerId} timed out executing ${job.jobId}. Terminating worker...`,
    );
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

  cleanupWorker(workerId) {
    const active = this.activeWorkers.get(workerId);
    if (active) {
      clearTimeout(active.timeoutTimer);
      this.activeWorkers.delete(workerId);
      Logger.info(
        "WorkerManager",
        `Worker ${workerId} cleaned up and slot released.`,
      );
    }
  }
}
