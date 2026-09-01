import { JobStatus } from "./types.js";

export class QueueJob {
  constructor(jobId, clientId, fileName, filePath, fileSize, priority) {
    this.jobId = jobId;
    this.clientId = clientId;
    this.fileName = fileName;
    this.filePath = filePath;
    this.fileSize = fileSize;
    this.priority = priority;

    this._status = JobStatus.QUEUED;
    this._queuePosition = 0;
    this._workerId = null;
    this._progress = 0;
    this._createdAt = new Date();
    this._startedAt = null;
    this._completedAt = null;
    this._result = null;
    this._error = null;
    this._outputFile = null;
    this._age = 0;
  }

  // Getters
  get status() {
    return this._status;
  }
  get queuePosition() {
    return this._queuePosition;
  }
  get workerId() {
    return this._workerId;
  }
  get progress() {
    return this._progress;
  }
  get createdAt() {
    return this._createdAt;
  }
  get startedAt() {
    return this._startedAt;
  }
  get completedAt() {
    return this._completedAt;
  }
  get result() {
    return this._result;
  }
  get error() {
    return this._error;
  }
  get outputFile() {
    return this._outputFile;
  }
  get age() {
    return this._age;
  }

  // Setters / State updates
  setQueuePosition(pos) {
    this._queuePosition = pos;
  }

  setWaiting() {
    this._status = JobStatus.WAITING;
  }

  setProcessing(workerId) {
    this._status = JobStatus.PROCESSING;
    this._workerId = workerId;
    this._startedAt = new Date();
  }

  setProgress(progress) {
    // Keep progress strictly bounded 0..100
    this._progress = Math.min(100, Math.max(0, Math.round(progress)));
  }

  setCompleted(result, outputFile) {
    this._status = JobStatus.COMPLETED;
    this._progress = 100;
    this._result = result;
    this._outputFile = outputFile || null;
    this._completedAt = new Date();
    this._queuePosition = 0;
  }

  setFailed(error) {
    this._status = JobStatus.FAILED;
    this._error = error;
    this._completedAt = new Date();
    this._queuePosition = 0;
  }

  incrementAge() {
    this._age += 1;
  }

  resetAge() {
    this._age = 0;
  }

  toJSON() {
    return {
      jobId: this.jobId,
      clientId: this.clientId,
      fileName: this.fileName,
      fileSize: this.fileSize,
      priority: this.priority,
      status: this._status,
      queuePosition: this._queuePosition,
      workerId: this._workerId,
      progress: this._progress,
      createdAt: this._createdAt.toISOString(),
      startedAt: this._startedAt ? this._startedAt.toISOString() : null,
      completedAt: this._completedAt ? this._completedAt.toISOString() : null,
      result: this._result,
      outputFile: this._outputFile,
      error: this._error,
      age: this._age,
    };
  }
}
