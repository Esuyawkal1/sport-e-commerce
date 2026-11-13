import { Router } from "express";
import {
  handleListAdminProducts,
  handleGetAdminProductById,
  handleCreateAdminProduct,
  handleUpdateAdminProduct,
  handleDeleteAdminProduct,
  handleAdjustAdminInventory,
} from "../controllers/adminProduct.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// All administrative product management endpoints require ADMIN role
router.use(authenticate, requireRole("ADMIN"));

router.get("/", handleListAdminProducts);
router.post("/", handleCreateAdminProduct);
router.get("/:productId", handleGetAdminProductById);
router.put("/:productId", handleUpdateAdminProduct);
router.delete("/:productId", handleDeleteAdminProduct);
router.patch("/inventory/:variantId", handleAdjustAdminInventory);

export default router;
