import { Router } from "express";
import {
  handleCreateVendor,
  handleAssignVendorRole,
  handleListAdminVendors,
} from "../controllers/adminVendor.controller.js";
import {
  authenticate,
  requireRole,
} from "../middleware/auth.middleware.js";

const router = Router();

// All vendor administration routes strictly require ADMIN role
router.use(authenticate, requireRole("ADMIN"));

router.get("/", handleListAdminVendors);
router.post("/", handleCreateVendor);
router.post("/assign/:userId", handleAssignVendorRole);

export default router;
