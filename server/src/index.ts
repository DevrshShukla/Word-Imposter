import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { connectDatabase, disconnectDatabase } from './utils/database.js';
import { apiRouter } from './routes/api.routes.js';
import { setupSocketHandlers } from './socket/socketHandler.js';
import { importWordPairsFromCSV, resolveDatasetPath } from './scripts/importDataset.js';
import { WordPairModel } from './models/WordPair.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate environment before startup
function validateEnvironment(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    if (!process.env.MONGODB_URI?.trim()) {
      console.warn('NOTE: MONGODB_URI environment variable not explicitly provided; using built-in Atlas URI.');
    }
    const secret = process.env.SESSION_SECRET?.trim();
    if (!secret || secret === 'word-imposter-super-secret-key-change-in-prod-2026') {
      console.warn('NOTE: Custom SESSION_SECRET not set; using secure auto-generated secret.');
    }
  }
}

validateEnvironment();

const app = express();
const server = http.createServer(app);

const PORT = parseInt(process.env.PORT || '3000', 10);

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS configuration - allow all origins for seamless client-server communication
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

// 3. API Rate Limiting (300 requests per 15 min per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
});

app.use('/api/v1', apiLimiter, apiRouter);

// 4. Production Health Check Endpoint
app.get('/health', (_req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const status = isDbConnected ? 'healthy' : 'degraded';
  res.status(isDbConnected ? 200 : 503).json({
    status,
    uptime: Math.floor(process.uptime()),
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 5. Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

setupSocketHandlers(io);

// 6. Static SPA Serving for Production (Unified single-origin deployment)
function findClientDist(): string | null {
  const candidates = [
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../../../client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'index.html'))) {
      return candidate;
    }
  }
  return null;
}

const clientDistPath = findClientDist();
if (clientDistPath) {
  console.log(`Serving static client SPA from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  // SPA fallback for client-side routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 7. Centralized Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.status || (err.message === 'Not allowed by CORS' ? 403 : 500);
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal Server Error'
      : err.message || 'An unexpected error occurred';

  res.status(status).json({
    error: {
      code: err.code || 'SERVER_ERROR',
      message,
    },
  });
});

// Auto-seed word pairs if DB is empty
async function ensureDatasetLoaded(): Promise<void> {
  try {
    const count = await WordPairModel.countDocuments();
    if (count === 0) {
      console.log('Database has 0 word pairs. Attempting auto-seed...');
      const csvPath = resolveDatasetPath();
      if (csvPath) {
        console.log(`Auto-seeding word pairs from: ${csvPath}`);
        await importWordPairsFromCSV(csvPath);
      } else {
        console.warn(
          'WARNING: Dataset CSV not found during auto-seed. Please run npm run seed or set DATASET_PATH.'
        );
      }
    } else {
      console.log(`Database already contains ${count} word pairs.`);
    }
  } catch (err: any) {
    console.warn('Dataset auto-seed check encountered non-fatal error:', err.message);
  }
}

// 8. Graceful Shutdown Handlers
let isShuttingDown = false;
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\nReceived ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    console.log('HTTP and Socket.IO server closed.');
    try {
      await disconnectDatabase();
      console.log('Database connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during database disconnect:', err);
      process.exit(1);
    }
  });

  // Force close after 10 seconds if graceful shutdown is stalled
  setTimeout(() => {
    console.error('Graceful shutdown timeout exceeded. Forcing exit.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Server boot
async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    await ensureDatasetLoaded();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`===============================================`);
      console.log(` Word Imposter Server running on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` REST API: http://localhost:${PORT}/api/v1`);
      console.log(` Health check: http://localhost:${PORT}/health`);
      if (clientDistPath) {
        console.log(` Web Client: http://localhost:${PORT}`);
      }
      console.log(`===============================================`);
    });
  } catch (err: any) {
    console.error('FATAL: Failed to start server:', err.message);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, server, io };
