import { Router } from "express";
import {
  register,
  registerSellerHandler,
  login,
  getMe,
} from "../controllers/auth.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// Public user registration — always registers as CUSTOMER
router.post("/register", register);
// Seller registration — restricted to ADMIN creation
router.post("/register-seller", authenticate, requireRole("ADMIN"), registerSellerHandler);
router.post("/login", login);
router.get("/me", authenticate, getMe);

export default router;
