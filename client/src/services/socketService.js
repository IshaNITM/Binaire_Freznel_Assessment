import { io } from "socket.io-client";

class SocketService {
  socket = null;
  queueUpdateCallbacks = new Set();
  jobProgressCallbacks = new Set();
  connectionCallbacks = new Set();
  _isConnected = false;

  connect() {
    if (this.socket) return;

    this.socket = io(import.meta.env.VITE_API_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      this._isConnected = true;
      this.notifyConnection(true);
    });

    this.socket.on("disconnect", () => {
      this._isConnected = false;
      this.notifyConnection(false);
    });

    this.socket.on("queue:update", (data) => {
      this.queueUpdateCallbacks.forEach((cb) => cb(data));
    });

    this.socket.on("job:progress", (job) => {
      this.jobProgressCallbacks.forEach((cb) => cb(job));
    });

    this.socket.on("job:completed", (_job) => {
      // Completed event will also trigger queue:update, but can be captured if needed
    });
    this.socket.on("job:failed", (_job) => {
      // Failed event will also trigger queue:update
    });
  }

  get isConnected() {
    return this._isConnected;
  }

  onQueueUpdate(callback) {
    this.queueUpdateCallbacks.add(callback);
    return () => this.queueUpdateCallbacks.delete(callback);
  }

  onJobProgress(callback) {
    this.jobProgressCallbacks.add(callback);
    return () => this.jobProgressCallbacks.delete(callback);
  }

  onConnectionChange(callback) {
    this.connectionCallbacks.add(callback);
    // Send immediate initial status
    callback(this._isConnected);
    return () => this.connectionCallbacks.delete(callback);
  }

  notifyConnection(connected) {
    this.connectionCallbacks.forEach((cb) => cb(connected));
  }
}

export const socketService = new SocketService();
