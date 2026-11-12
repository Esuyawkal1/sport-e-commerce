const STATUS_TEXTS = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "An unexpected internal server error occurred.";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = `Validation Error: ${messages.join(", ")}`;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate key error: '${field}' value is already in use.`;
  }

  // CastError (e.g. malformed ID)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid format for parameter '${err.path}'.`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token signature.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token has expired.";
  }

  // Mongoose server selection or connection errors
  if (
    err.name === "MongooseServerSelectionError" ||
    err.name === "MongoNetworkError" ||
    err.name === "MongoServerSelectionError"
  ) {
    statusCode = 503;
    message = "Database service unavailable. Please ensure MongoDB is running.";
  }

  const errorType = STATUS_TEXTS[statusCode] || "Error";

  if (statusCode >= 500) {
    console.error(`[ERROR 500] ${req?.method || "GET"} ${req?.originalUrl || "/"}:`, err);
  }

  return res.status(statusCode).json({
    status: statusCode,
    error: errorType,
    message,
    timestamp: new Date().toISOString(),
  });
};
