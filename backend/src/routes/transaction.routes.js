import { Router } from "express";
import authenticate from "../middleware/auth.middleware.js";
import {
  createTransaction,
  getTransactions,
  handleWebhook,
} from "../controllers/transaction.controller.js";

const router = Router();

// Webhook endpoint (typically public or verified via signature)
router.post("/webhook", handleWebhook);

// Protected endpoints for authenticated users
router.use(authenticate);
router.post("/", createTransaction);
router.get("/", getTransactions);

export default router;
