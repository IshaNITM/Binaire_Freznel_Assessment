import { Server as SocketIOServer, Socket } from 'socket.io';
import { QueueService } from '../services/QueueService.js';
import { Logger } from '../utils/logger.js';

export function setupSocketHandlers(io: SocketIOServer, queueService: QueueService): void {
  io.on('connection', (socket: Socket) => {
    Logger.info('SocketHandler', `Client connected: ${socket.id}`);

    // Send initial queue state to newly connected client
    socket.emit('queue:update', queueService.getQueueState());

    socket.on('disconnect', () => {
      Logger.info('SocketHandler', `Client disconnected: ${socket.id}`);
    });
  });

  // Listen to QueueService events and broadcast to all connected clients
  queueService.on('queue:update', (data) => {
    io.emit('queue:update', data);
  });

  queueService.on('job:progress', (jobData) => {
    io.emit('job:progress', jobData);
  });

  queueService.on('job:completed', (jobData) => {
    io.emit('job:completed', jobData);
  });

  queueService.on('job:failed', (jobData) => {
    io.emit('job:failed', jobData);
  });
}
