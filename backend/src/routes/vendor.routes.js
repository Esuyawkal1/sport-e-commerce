import { Router } from "express";
import {
  handleGetPublicVendors,
  handleGetVendorByIdentifier,
  handleGetMyProfile,
  handleUpdateMyProfile,
} from "../controllers/vendor.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// Public vendor store discovery
router.get("/", handleGetPublicVendors);
router.get("/profile/:identifier", handleGetVendorByIdentifier);

// Protected seller management
router.get(
  "/me/profile",
  authenticate,
  requireRole("SELLER", "ADMIN"),
  handleGetMyProfile,
);
router.put(
  "/me/profile",
  authenticate,
  requireRole("SELLER", "ADMIN"),
  handleUpdateMyProfile,
);

export default router;
