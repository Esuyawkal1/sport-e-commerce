import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      default: uuidv4,
      unique: true,
      required: true,
    },
    categoryId: {
      type: String,
      required: true,
      index: true,
    },
    sellerId: {
      type: String,
      default: null,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    longDescription: { type: String, default: null },
    basePrice: { type: Number, required: true },
    sku: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    sportType: {
      type: [String],
      default: [],
      index: true,
    },
    gearCategory: {
      type: String,
      enum: ["EQUIPMENT", "APPAREL", "FOOTWEAR", "PROTECTIVE", "ACCESSORY"],
      default: "EQUIPMENT",
      index: true,
    },
    brand: {
      type: String,
      default: null,
      index: true,
      trim: true,
    },
    skillLevel: {
      type: String,
      enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL", "ALL"],
      default: "ALL",
      index: true,
    },
    genderAgeGroup: {
      type: String,
      enum: ["MEN", "WOMEN", "UNISEX", "KIDS", "ALL"],
      default: "UNISEX",
    },
    isBulky: {
      type: Boolean,
      default: false,
      index: true,
    },
    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    images: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: String, default: null },
  },
  {
    timestamps: true,
  },
);

productSchema.index({
  name: "text",
  description: "text",
  brand: "text",
  sportType: "text",
});
productSchema.index({ categoryId: 1, isActive: 1 });
productSchema.index({ sellerId: 1, isActive: 1 });
productSchema.index({ basePrice: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });

export const ProductModel = mongoose.model("Product", productSchema);
