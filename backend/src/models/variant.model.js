import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const variantSchema = new mongoose.Schema(
  {
    variantId: {
      type: String,
      default: uuidv4,
      unique: true,
      required: true,
    },
    productId: {
      type: String,
      required: true,
      index: true,
    },
    variantName: { type: String, required: true, trim: true },
    sku: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    price: { type: Number, required: true },
    costPrice: { type: Number, default: 0 },
    weightKg: { type: Number, default: 0 },
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  },
);

export const VariantModel = mongoose.model("Variant", variantSchema);
