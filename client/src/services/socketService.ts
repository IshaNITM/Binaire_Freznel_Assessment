import { io, Socket } from 'socket.io-client';
import { QueueState, IQueueJob } from '../models/types';

type QueueUpdateListener = (state: QueueState) => void;
type JobProgressListener = (job: IQueueJob) => void;
type ConnectionListener = (connected: boolean) => void;

class SocketService {
  private socket: Socket | null = null;
  private queueUpdateCallbacks: Set<QueueUpdateListener> = new Set();
  private jobProgressCallbacks: Set<JobProgressListener> = new Set();
  private connectionCallbacks: Set<ConnectionListener> = new Set();
  private _isConnected = false;

  public connect(): void {
    if (this.socket) return;

    // Use current host/port or proxy
    this.socket = io({
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      this._isConnected = true;
      this.notifyConnection(true);
    });

    this.socket.on('disconnect', () => {
      this._isConnected = false;
      this.notifyConnection(false);
    });

    this.socket.on('queue:update', (data: QueueState) => {
      this.queueUpdateCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('job:progress', (job: IQueueJob) => {
      this.jobProgressCallbacks.forEach(cb => cb(job));
    });

    this.socket.on('job:completed', (_job: IQueueJob) => {
      // Completed event will also trigger queue:update, but can be captured if needed
    });

    this.socket.on('job:failed', (_job: IQueueJob) => {
      // Failed event will also trigger queue:update
    });
  }

  public get isConnected(): boolean {
    return this._isConnected;
  }

  public onQueueUpdate(callback: QueueUpdateListener): () => void {
    this.queueUpdateCallbacks.add(callback);
    return () => this.queueUpdateCallbacks.delete(callback);
  }

  public onJobProgress(callback: JobProgressListener): () => void {
    this.jobProgressCallbacks.add(callback);
    return () => this.jobProgressCallbacks.delete(callback);
  }

  public onConnectionChange(callback: ConnectionListener): () => void {
    this.connectionCallbacks.add(callback);
    // Send immediate initial status
    callback(this._isConnected);
    return () => this.connectionCallbacks.delete(callback);
  }

  private notifyConnection(connected: boolean): void {
    this.connectionCallbacks.forEach(cb => cb(connected));
  }
}

export const socketService = new SocketService();
