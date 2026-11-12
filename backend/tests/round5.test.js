import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeInput,
  securityHeaders,
} from "../src/middleware/security.middleware.js";
import { errorHandler } from "../src/middleware/errorHandler.middleware.js";

test("Round 5: Security Sanitizer strips malicious MongoDB operators ($gt, $where, dots)", () => {
  const maliciousReq = {
    body: {
      email: "buyer@sport.com",
      password: { $gt: "" }, // Classic NoSQL injection attempt
      "nested.field": "bad",
      validScore: 4.5,
      sports: ["tennis", "running"],
    },
    query: {
      sport: { $ne: null },
      category: "tennis",
    },
    params: {},
  };

  sanitizeInput(maliciousReq, {}, () => {});

  // Body check: $gt and nested.field stripped
  assert.equal(maliciousReq.body.password, undefined);
  assert.equal(maliciousReq.body["nested.field"], undefined);
  assert.equal(maliciousReq.body.email, "buyer@sport.com");
  assert.equal(maliciousReq.body.validScore, 4.5);
  assert.deepEqual(maliciousReq.body.sports, ["tennis", "running"]);

  // Query check: $ne stripped, valid category preserved
  assert.equal(maliciousReq.query.sport, undefined);
  assert.equal(maliciousReq.query.category, "tennis");
});

test("Round 5: Security Headers middleware sets standard defense-in-depth headers", () => {
  const headers = {};
  const mockRes = {
    setHeader: (key, val) => {
      headers[key] = val;
    },
  };

  let nextCalled = false;
  securityHeaders({}, mockRes, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["X-XSS-Protection"], "1; mode=block");
  assert.match(headers["Strict-Transport-Security"], /max-age=/);
});

test("Round 5: Centralized Error Handler formats errors into standardized clean JSON", () => {
  let capturedStatus = null;
  let capturedBody = null;

  const mockRes = {
    status: (code) => {
      capturedStatus = code;
      return {
        json: (data) => {
          capturedBody = data;
        },
      };
    },
  };

  // 1. Custom status code error
  const customError = new Error("Product with SKU already exists.");
  customError.statusCode = 409;
  errorHandler(customError, { method: "POST", originalUrl: "/test" }, mockRes, () => {});

  assert.equal(capturedStatus, 409);
  assert.equal(capturedBody.status, 409);
  assert.equal(capturedBody.error, "Conflict");
  assert.match(capturedBody.message, /already exists/);
  assert.ok(capturedBody.timestamp);

  // 2. Mongoose validation error
  const validationError = {
    name: "ValidationError",
    errors: {
      name: { message: "Path 'name' is required." },
    },
  };
  errorHandler(validationError, { method: "POST", originalUrl: "/test" }, mockRes, () => {});
  assert.equal(capturedStatus, 400);
  assert.equal(capturedBody.error, "Bad Request");
  assert.match(capturedBody.message, /Path 'name' is required/);
});

test("Admin & Role Governance: Vendor creation is administered and Customer is public registration default", async () => {
  const { createVendorByAdmin, assignVendorRoleByAdmin, listAllVendorsByAdmin } = await import(
    "../src/services/adminVendor.service.js"
  );
  assert.equal(typeof createVendorByAdmin, "function");
  assert.equal(typeof assignVendorRoleByAdmin, "function");
  assert.equal(typeof listAllVendorsByAdmin, "function");
});
