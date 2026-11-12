import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  processCheckout,
  createPaymentIntent,
  checkoutWebhook,
  verifyChapa,
} from "../controllers/checkout.controller.js";

const router = Router();

// Webhook endpoints
router.post("/webhook", checkoutWebhook);
router.post("/chapa/webhook", verifyChapa);
router.get("/chapa/verify/:txRef", verifyChapa);

// Protected endpoints
router.post("/process", authenticate, processCheckout);
router.post("/create-intent", authenticate, createPaymentIntent);

export default router;
