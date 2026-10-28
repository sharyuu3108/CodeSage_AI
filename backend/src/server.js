import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { noSqlSanitizer } from './middleware/sanitizeMiddleware.js';
import { csrfProtection } from './middleware/authMiddleware.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import historyRoutes from './routes/historyRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration (explicit origin, credentials enabled)
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Parsers
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// NoSQL Injection sanitizer
app.use(noSqlSanitizer);

// CSRF check on state-changing requests
app.use(csrfProtection);

// Mongoose connection state helper
const getDatabaseStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

// Health monitoring endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1 || process.env.NODE_ENV === 'test';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    message: isHealthy
      ? 'CodeSage AI API Server is operational'
      : 'CodeSage AI API Server is running but database is not connected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: getDatabaseStatus(),
      name: mongoose.connection.name || null,
      host: mongoose.connection.host || null,
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/history', historyRoutes);

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Endpoint ${req.originalUrl} not found`,
    },
  });
});

// Centralized error handling
app.use(errorHandler);

let serverInstance;
if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .catch((err) => {
      console.warn(`[Server Warning] Initial DB connection failed: ${err.message}. Server starting anyway.`);
    })
    .finally(() => {
      serverInstance = app.listen(PORT, () => {
        console.log(`[CodeSage Server] Running on http://localhost:${PORT}`);
      });
    });
}

export { app, serverInstance };
