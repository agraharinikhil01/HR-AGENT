import http from 'http';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocketIO } from './sockets/index.js';

async function bootstrap() {
  await connectDB();

  const server = http.createServer(app);
  initSocketIO(server);

  server.listen(env.PORT, () => {
    console.log(`🚀 HireFlow AI Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    console.log(`📡 Health check available at http://localhost:${env.PORT}/health`);

    // Self-ping every 10 minutes to prevent Render from going to sleep
    if (env.NODE_ENV === 'production') {
      const PING_INTERVAL = 10 * 60 * 1000;
      setInterval(async () => {
        try {
          await fetch('https://hr-agent-backend-36sm.onrender.com/health');
        } catch {
          // Ignore network errors in ping
        }
      }, PING_INTERVAL);
    }
  });

  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      console.log('✅ Server and database connections closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
