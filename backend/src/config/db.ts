import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // In development allow app to stay up with mock/fallback warning if local mongo is offline
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
