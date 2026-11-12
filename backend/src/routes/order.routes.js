import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createOrder,
  getOrders,
  getOrder,
  getOrderTracking,
} from "../controllers/order.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:orderId", getOrder);
router.get("/:orderId/track", getOrderTracking);

export default router;
