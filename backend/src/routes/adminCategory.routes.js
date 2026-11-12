import { Router } from "express";
import {
  handleCreateCategory,
  handleUpdateCategory,
  handleDeleteCategory,
  handleListAdminCategories,
} from "../controllers/adminCategory.controller.js";
import {
  authenticate,
  requireRole,
} from "../middleware/auth.middleware.js";

const router = Router();

// All routes require ADMIN role
router.use(authenticate, requireRole("ADMIN"));

router.get("/", handleListAdminCategories);
router.post("/", handleCreateCategory);
router.put("/:categoryId", handleUpdateCategory);
router.delete("/:categoryId", handleDeleteCategory);

export default router;
