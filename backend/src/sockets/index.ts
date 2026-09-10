import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { env } from '../config/env.js';

let ioInstance: Server | null = null;

export function initSocketIO(server: HttpServer): Server {
  const io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGINS.split(','),
      credentials: true,
    },
  });

  // JWT Authentication Guard on handshake
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const payload = verifyAccessToken(token);
      (socket as any).user = payload;
      next();
    } catch (err) {
      return next(new Error('Invalid socket authentication token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    if (user?.orgId) {
      socket.join(`org:${user.orgId}`);
    }

    socket.on('join_job', (jobId: string) => {
      socket.join(`job:${jobId}`);
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  ioInstance = io;
  return io;
}

export function emitToOrg(orgId: string, event: string, data: any): void {
  if (ioInstance) {
    ioInstance.to(`org:${orgId}`).emit(event, data);
  }
}

export function emitToJob(jobId: string, event: string, data: any): void {
  if (ioInstance) {
    ioInstance.to(`job:${jobId}`).emit(event, data);
  }
}
