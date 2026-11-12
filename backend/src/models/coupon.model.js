import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const couponSchema = new mongoose.Schema(
  {
    couponId: {
      type: String,
      default: uuidv4,
      unique: true,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED", "FREE_SHIPPING"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    applicableSports: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  },
);

export const CouponModel = mongoose.model("Coupon", couponSchema);
