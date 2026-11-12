import { Router } from "express";
import {
  getCategories,
  getProducts,
  getProductById,
  getFacets,
} from "../controllers/catalog.controller.js";

const router = Router();

router.get("/categories", getCategories);
router.get("/products", getProducts);
router.get("/facets", getFacets);
router.get("/products/:productId", getProductById);

export default router;
