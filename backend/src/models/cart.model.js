import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const cartSchema = new mongoose.Schema(
  {
    cartId: {
      type: String,
      default: uuidv4,
      unique: true,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    totalItems: { type: Number, default: 0 },
    subtotalAmount: { type: Number, default: 0 },
    shippingAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    shippingAddress: {
      city: { type: String, default: null },
      state: { type: String, default: null },
      postalCode: { type: String, default: null },
      country: { type: String, default: null },
    },
    cartStatus: {
      type: String,
      enum: ["ACTIVE", "ABANDONED", "CONVERTED"],
      default: "ACTIVE",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  },
);

export const CartModel = mongoose.model("Cart", cartSchema);
