import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

export async function connectDatabase(): Promise<string> {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Connecting to MongoDB via MONGODB_URI...');
      await mongoose.connect(uri);
      console.log('Connected to external MongoDB successfully.');
      return uri;
    } catch (err) {
      console.warn('Failed to connect to MONGODB_URI, falling back to in-memory MongoDB...', err);
    }
  }

  // Fallback to MongoMemoryServer for reliable, zero-config local development and testing
  console.log('Starting in-memory MongoDB server...');
  mongoMemoryServer = await MongoMemoryServer.create();
  const memoryUri = mongoMemoryServer.getUri();
  await mongoose.connect(memoryUri);
  console.log(`Connected to in-memory MongoDB: ${memoryUri}`);
  return memoryUri;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    mongoMemoryServer = null;
  }
}
