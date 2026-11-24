import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase } from './utils/database.js';
import { apiRouter } from './routes/api.routes.js';
import { setupSocketHandlers } from './socket/socketHandler.js';
import { importWordPairsFromCSV } from './scripts/importDataset.js';
import { WordPairModel } from './models/WordPair.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// REST routes
app.use('/api/v1', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

setupSocketHandlers(io);

// Auto-seed word pairs if DB is empty
async function ensureDatasetLoaded() {
  const count = await WordPairModel.countDocuments();
  if (count === 0) {
    console.log('Database has 0 word pairs. Auto-seeding from imposter_game_dataset_1500.csv...');
    const csvPath = path.resolve(process.cwd(), '../imposter_game_dataset_1500.csv');
    await importWordPairsFromCSV(csvPath);
  } else {
    console.log(`Database already loaded with ${count} word pairs.`);
  }
}

async function startServer() {
  try {
    await connectDatabase();
    await ensureDatasetLoaded();

    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` Word Imposter Server running on port ${PORT}`);
      console.log(` REST API: http://localhost:${PORT}/api/v1`);
      console.log(` Health check: http://localhost:${PORT}/health`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

export { app, server, io };
