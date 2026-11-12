/**
 * In-memory sliding window rate limiter.
 * Protects auth and payment endpoints without external dependencies.
 */
export const createRateLimiter = ({
  windowMs = 60 * 1000,
  maxRequests = 100,
  message = "Too many requests. Please try again later.",
} = {}) => {
  const requestLogs = new Map();

  return (req, res, next) => {
    // In test environment or health checks, skip rate limits
    if (process.env.NODE_ENV === "test" || req.path === "/api/health") {
      return next();
    }

    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      "127.0.0.1";
    const now = Date.now();

    const clientHistory = requestLogs.get(ip) || [];
    const validHistory = clientHistory.filter(
      (timestamp) => now - timestamp < windowMs,
    );

    if (validHistory.length >= maxRequests) {
      const oldest = validHistory[0];
      const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);

      res.setHeader("Retry-After", retryAfter);
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", 0);

      return res.status(429).json({
        status: 429,
        error: "Too Many Requests",
        message,
        retryAfterSeconds: retryAfter,
      });
    }

    validHistory.push(now);
    requestLogs.set(ip, validHistory);

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, maxRequests - validHistory.length),
    );

    next();
  };
};

/**
 * Recursively sanitizes objects against MongoDB operator injection.
 * Removes keys starting with '$' or containing '.'.
 * Removes nested objects that become empty after stripping malicious operator keys.
 */
export const sanitizeInput = (req, res, next) => {
  const clean = (data) => {
    if (!data || typeof data !== "object") return data;

    if (Array.isArray(data)) {
      return data.map((item) => clean(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith("$") || key.includes(".")) {
        // Strip out dangerous MongoDB operators
        continue;
      }

      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const cleanedSub = clean(value);
        if (Object.keys(cleanedSub).length > 0) {
          sanitized[key] = cleanedSub;
        }
      } else {
        sanitized[key] = clean(value);
      }
    }
    return sanitized;
  };

  const setSanitized = (target, prop, value) => {
    try {
      target[prop] = value;
    } catch {
      // In Express 5, req.query is getter-only on the prototype.
      // Define an own property on the request instance to override the getter cleanly.
      Object.defineProperty(target, prop, {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  };

  if (req.body) {
    req.body = clean(req.body);
  }
  if (req.query) {
    const cleanedQuery = clean(req.query);
    try {
      for (const key of Object.keys(req.query)) {
        if (!(key in cleanedQuery)) {
          delete req.query[key];
        }
      }
      Object.assign(req.query, cleanedQuery);
    } catch {
      // ignore if query is not extensible or sealed
    }
    setSanitized(req, "query", cleanedQuery);
  }
  if (req.params) {
    const cleanedParams = clean(req.params);
    setSanitized(req, "params", cleanedParams);
  }

  next();
};

/**
 * Basic security headers.
 */
export const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  next();
};
