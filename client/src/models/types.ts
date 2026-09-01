export enum Priority {
  HIGH = 'HIGH',
  LOW = 'LOW'
}

export enum JobStatus {
  UPLOADING = 'UPLOADING',
  UPLOADED = 'UPLOADED',
  QUEUED = 'QUEUED',
  WAITING = 'WAITING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface IQueueJob {
  jobId: string;
  clientId: string;
  fileName: string;
  fileSize: number;
  priority: Priority;
  status: JobStatus;
  queuePosition: number;
  workerId: string | null;
  progress: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  result: number | null;
  error: string | null;
  age: number;
}

export interface QueueStats {
  totalJobs: number;
  processing: number;
  waiting: number;
  completed: number;
  failed: number;
  activeWorkers: number;
  maxWorkers: number;
}

export interface QueueState {
  jobs: IQueueJob[];
  stats: QueueStats;
}
