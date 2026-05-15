import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import socketHandler from './sockets/socketHandler.js';
import errorMiddleware from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import channelRoutes from './routes/channelRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

console.log('🚀 Starting Sleek Backend...');

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('🔥 Unhandled Rejection:', err);
  // We remove process.exit(1) here so the server doesn't crash entirely 
  // when an external service like Cloudinary throws an unhandled error.
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err.message);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 ${signal} received. Shutting down...`);
  server.close(async () => {
    const mongoose = (await import('mongoose')).default;
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed. Exit.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── Express App ──
const app = express();
const server = http.createServer(app);

// ── Middleware ──
// Parse CLIENT_URL env as comma-separated list for CORS
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

// ── Socket.IO ──
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});
app.set('io', io);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error Handler (must be after routes) ──
app.use(errorMiddleware);

// ── Socket Handler ──
socketHandler(io);

// ── Start Server ──
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`   API:    http://localhost:${PORT}/api`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('🔥 Fatal error during startup:', err);
    process.exit(1);
  }
};

startServer();