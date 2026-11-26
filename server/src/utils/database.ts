import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

export const DEFAULT_MONGODB_URI =
  'mongodb+srv://dshuklagls_db_user:jKeTRkYrSlm0QmZZ@cluster0.wxjxnmq.mongodb.net/word_imposter?retryWrites=true&w=majority';

/**
 * Mask sensitive credentials in MongoDB URI for safe logging
 */
export function sanitizeMongoUri(uri: string): string {
  try {
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/i, '$1*****$3');
  } catch {
    return '***';
  }
}

/**
 * Connect to MongoDB database
 * Connects to MongoDB Atlas URI. If connection fails due to network/IP restrictions,
 * falls back gracefully so the server remains alive and operational.
 */
export async function connectDatabase(): Promise<string> {
  // If already connected, return existing URI
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.host;
  }

  const rawUri = process.env.MONGODB_URI?.trim() || DEFAULT_MONGODB_URI;
  const uri = rawUri.replace(/^["']|["']$/g, '');

  console.log(`Connecting to MongoDB Atlas: ${sanitizeMongoUri(uri)}`);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 20,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      autoIndex: true, // Automatically build and sync indexes in Atlas
    });
    console.log('Connected to MongoDB Atlas successfully.');
    setupConnectionListeners();
    return uri;
  } catch (err: any) {
    console.warn(
      `Warning: Could not connect to MongoDB Atlas (${sanitizeMongoUri(uri)}): ${err.message}`
    );
    console.warn(
      'Tip: If deploying on Render, make sure "0.0.0.0/0" is added under Network Access in MongoDB Atlas.'
    );

    console.log('Starting in-memory MongoDB server to ensure service remains operational...');
    mongoMemoryServer = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log(`Connected to in-memory MongoDB fallback: ${memoryUri}`);
    setupConnectionListeners();
    return memoryUri;
  }
}

function setupConnectionListeners(): void {
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected successfully.');
  });
}

/**
 * Disconnect from MongoDB and clean up in-memory instances
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      mongoMemoryServer = null;
    }
  } catch (err) {
    console.error('Error during database disconnection:', err);
  }
}
