import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  handleApplyCoupon,
  handleRemoveCoupon,
  handleCreateReservation,
  handleReleaseReservation,
} from "../controllers/cart.controller.js";

const router = Router();

// All cart actions require user authentication
router.use(authenticate);

router.get("/", getCart);
router.post("/items", addItem);
router.patch("/items/:cartItemId", updateItem);
router.delete("/items/:cartItemId", removeItem);

// Coupons
router.post("/coupon", handleApplyCoupon);
router.delete("/coupon", handleRemoveCoupon);

// Inventory Reservation
router.post("/reserve", handleCreateReservation);
router.delete("/reserve/:reservationId", handleReleaseReservation);

export default router;
