import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import postRouter from './routes/post.routes.js';

const app = express();

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/posts', postRouter);

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'upload-service' });
});

// ---------------------------------------------------------------------------
// Global Error Handler
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  // Multer file-filter errors
  if (err.message && err.message.startsWith('Unsupported file type')) {
    return res.status(415).json({ error: err.message });
  }

  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? 'Internal Server Error';

  console.error(`[upload-service] ${statusCode} — ${message}`, err.stack ?? '');

  return res.status(statusCode).json({ error: message });
});

// ---------------------------------------------------------------------------
// Server Bootstrap
// ---------------------------------------------------------------------------
const PORT = process.env.PORT ?? 4000;

async function startServer() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[upload-service] Connected to MongoDB');

  app.listen(PORT, () => {
    console.log(`[upload-service] Server running on http://localhost:${PORT}`);
  });
}

/**
 * Only start the HTTP server when this file is run directly.
 * Test runners that import app.js skip the listen/connect step.
 */
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('[upload-service] Failed to start:', err);
    process.exit(1);
  });
}

export default app;
