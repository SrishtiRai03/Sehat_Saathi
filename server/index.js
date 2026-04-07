/**
 * @fileoverview Sehat Saathi API Server Entry Point
 * @description Express server with Socket.IO for real-time queue updates.
 * Implements RESTful API architecture with JWT authentication.
 * @version 1.0.0
 * @license MIT
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import db from './db.js';
import { requestLogger, errorHandler, notFoundHandler } from './middleware/utils.js';
import authRoutes from './routes/auth.js';
import triageRoutes from './routes/triage.js';
import queueRoutes from './routes/queue.js';
import recordsRoutes from './routes/records.js';
import pharmacyRoutes from './routes/pharmacy.js';
import consultationRoutes from './routes/consultation.js';
import heatmapRoutes from './routes/heatmap.js';
import statsRoutes from './routes/stats.js';
import appointmentRoutes from './routes/appointments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* ---------- Configuration ---------- */
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const NODE_ENV = process.env.NODE_ENV || 'development';

/* ---------- Express App Setup ---------- */
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] },
});

/* ---------- Global Middleware ---------- */
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Request logger (development only)
if (NODE_ENV === 'development') {
  app.use(requestLogger);
}

/* ---------- Dependency Injection ---------- */
app.set('io', io);
app.set('db', db);

/* ---------- API Routes ---------- */
app.use('/api/auth', authRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/consultation', consultationRoutes);
app.use('/api/heatmap', heatmapRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/appointments', appointmentRoutes);

/* ---------- Health Check ---------- */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'sehat-saathi-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/* ---------- Error Handling ---------- */
app.use(notFoundHandler);
app.use(errorHandler);

/* ---------- Socket.IO Events ---------- */
io.on('connection', (socket) => {
  if (NODE_ENV === 'development') {
    console.log(`🔌 Client connected: ${socket.id}`);
  }

  socket.on('join-queue', (doctorId) => {
    if (typeof doctorId === 'number') {
      socket.join(`queue-${doctorId}`);
    }
  });

  socket.on('join-patient', (patientId) => {
    if (typeof patientId === 'number') {
      socket.join(`patient-${patientId}`);
    }
  });

  socket.on('disconnect', () => {
    if (NODE_ENV === 'development') {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    }
  });
});

/* ---------- Start Server ---------- */
httpServer.listen(PORT, () => {
  console.log(`🚀 Sehat Saathi API running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${NODE_ENV}`);
});
