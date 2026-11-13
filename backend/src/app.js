import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import catalogRoutes from "./routes/catalog.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import adminCategoryRoutes from "./routes/adminCategory.routes.js";
import adminProductRoutes from "./routes/adminProduct.routes.js";
import {
  securityHeaders,
  sanitizeInput,
  createRateLimiter,
} from "./middleware/security.middleware.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
app.use(securityHeaders);
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(sanitizeInput);

// Rate limiters for sensitive endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 50,
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

const checkoutLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 30,
  message: "Too many checkout requests. Please try again shortly.",
});

// Database readiness check for API routes
app.use("/api/v1", (req, res, next) => {
  if (process.env.NODE_ENV === "test") {
    return next();
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      status: 503,
      error: "Service Unavailable",
      message:
        "Database connection is unavailable. Please ensure MongoDB is running.",
    });
  }
  next();
});

// Route Mounts
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1", catalogRoutes);
app.use("/api/v1/admin/categories", adminCategoryRoutes);
app.use("/api/v1/admin/products", adminProductRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/checkout", checkoutLimiter, checkoutRoutes);

// Health check
app.get("/api/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? "ok" : "degraded",
    service: "sports-materials-marketplace-api",
    version: "1.0.0",
    database: isDbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// 404 Fallback for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    error: "Not Found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
