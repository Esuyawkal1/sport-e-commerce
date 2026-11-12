import { Router } from "express";
import {
  handleCreateProduct,
  handleGetMyProducts,
  handleGetProductById,
  handleUpdateProduct,
  handleDeleteProduct,
  handleAdjustInventory,
} from "../controllers/vendorProduct.controller.js";
import {
  handleGetVendorOrders,
  handleGetVendorSubOrderById,
  handleUpdateSubOrderStatus,
  handleGetVendorSettlement,
} from "../controllers/vendorOrder.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validator.middleware.js";

const router = Router();

// All vendor endpoints require authentication and SELLER or ADMIN role
router.use(authenticate, requireRole("SELLER", "ADMIN"));

const productCreationRules = {
  name: { required: true, type: "string", minLength: 2 },
  categoryId: { required: true, type: "string" },
  sku: { required: true, type: "string", minLength: 3 },
  basePrice: { required: true, type: "number", min: 0 },
  gearCategory: {
    type: "string",
    enum: ["EQUIPMENT", "APPAREL", "FOOTWEAR", "PROTECTIVE", "ACCESSORY"],
  },
  skillLevel: {
    type: "string",
    enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL", "ALL"],
  },
};

// Vendor Products & Inventory
router.post(
  "/products",
  validateBody(productCreationRules),
  handleCreateProduct,
);
router.get("/products", handleGetMyProducts);
router.get("/products/:productId", handleGetProductById);
router.put("/products/:productId", handleUpdateProduct);
router.delete("/products/:productId", handleDeleteProduct);
router.patch("/inventory/:variantId", handleAdjustInventory);

// Vendor Orders & Logistics
router.get("/orders", handleGetVendorOrders);
router.get("/orders/:subOrderId", handleGetVendorSubOrderById);
router.patch("/orders/:subOrderId/status", handleUpdateSubOrderStatus);

// Vendor Settlement & Earnings
router.get("/settlements", handleGetVendorSettlement);

export default router;
