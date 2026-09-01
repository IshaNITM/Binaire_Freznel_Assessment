import { Priority, JobStatus, IQueueJobJSON } from './types.js';

export class QueueJob {
  public readonly jobId: string;
  public readonly clientId: string;
  public readonly fileName: string;
  public readonly filePath: string;
  public readonly fileSize: number;
  public readonly priority: Priority;
  
  private _status: JobStatus;
  private _queuePosition: number;
  private _workerId: string | null;
  private _progress: number;
  private _createdAt: Date;
  private _startedAt: Date | null;
  private _completedAt: Date | null;
  private _result: number | null;
  private _error: string | null;
  private _age: number;

  constructor(
    jobId: string,
    clientId: string,
    fileName: string,
    filePath: string,
    fileSize: number,
    priority: Priority
  ) {
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
    this._age = 0;
  }

  // Getters
  public get status(): JobStatus { return this._status; }
  public get queuePosition(): number { return this._queuePosition; }
  public get workerId(): string | null { return this._workerId; }
  public get progress(): number { return this._progress; }
  public get createdAt(): Date { return this._createdAt; }
  public get startedAt(): Date | null { return this._startedAt; }
  public get completedAt(): Date | null { return this._completedAt; }
  public get result(): number | null { return this._result; }
  public get error(): string | null { return this._error; }
  public get age(): number { return this._age; }

  // Setters / State updates
  public setQueuePosition(pos: number): void {
    this._queuePosition = pos;
  }

  public setWaiting(): void {
    this._status = JobStatus.WAITING;
  }

  public setProcessing(workerId: string): void {
    this._status = JobStatus.PROCESSING;
    this._workerId = workerId;
    this._startedAt = new Date();
  }

  public setProgress(progress: number): void {
    // Keep progress strictly bounded 0..100
    this._progress = Math.min(100, Math.max(0, Math.round(progress)));
  }

  public setCompleted(result: number): void {
    this._status = JobStatus.COMPLETED;
    this._progress = 100;
    this._result = result;
    this._completedAt = new Date();
    this._queuePosition = 0;
  }

  public setFailed(error: string): void {
    this._status = JobStatus.FAILED;
    this._error = error;
    this._completedAt = new Date();
    this._queuePosition = 0;
  }

  public incrementAge(): void {
    this._age += 1;
  }

  public resetAge(): void {
    this._age = 0;
  }

  public toJSON(): IQueueJobJSON {
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
      error: this._error,
      age: this._age
    };
  }
}
