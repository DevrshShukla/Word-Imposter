import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

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
 * - Production: MONGODB_URI is strictly required; fails fast if missing or invalid.
 * - Development/Test: Connects to MONGODB_URI if provided; falls back to MongoMemoryServer.
 */
export async function connectDatabase(): Promise<string> {
  // If already connected, return existing URI
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.host;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const uri = process.env.MONGODB_URI?.trim();

  // 1. Production Mode: Strict enforcement
  if (isProduction) {
    if (!uri) {
      const errorMsg =
        'FATAL: MONGODB_URI environment variable is required in production mode. ' +
        'Silently falling back to in-memory database is prohibited in production.';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    console.log(`Connecting to Production MongoDB Atlas: ${sanitizeMongoUri(uri)}`);
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 20,
        minPoolSize: 2,
        socketTimeoutMS: 45000,
        autoIndex: true, // Automatically build and sync indexes in Atlas
      });
      console.log('Connected to Production MongoDB Atlas successfully.');
      setupConnectionListeners();
      return uri;
    } catch (err: any) {
      console.error(`FATAL: Failed to connect to Production MongoDB Atlas (${sanitizeMongoUri(uri)}):`, err.message);
      throw new Error(`Production MongoDB connection failed: ${err.message}`);
    }
  }

  // 2. Development / Test Mode with explicit MONGODB_URI
  if (uri) {
    try {
      console.log(`Connecting to MongoDB via MONGODB_URI: ${sanitizeMongoUri(uri)}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('Connected to external MongoDB successfully.');
      setupConnectionListeners();
      return uri;
    } catch (err: any) {
      console.warn(`Failed to connect to MONGODB_URI (${sanitizeMongoUri(uri)}), falling back to in-memory MongoDB:`, err.message);
    }
  }

  // 3. Fallback to MongoMemoryServer for local development & automated tests only
  console.log('Starting in-memory MongoDB server for local development/testing...');
  mongoMemoryServer = await MongoMemoryServer.create();
  const memoryUri = mongoMemoryServer.getUri();
  await mongoose.connect(memoryUri);
  console.log(`Connected to in-memory MongoDB: ${memoryUri}`);
  setupConnectionListeners();
  return memoryUri;
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
