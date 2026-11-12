import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const vendorSubOrderItemSchema = new mongoose.Schema(
  {
    orderItemId: { type: String, default: uuidv4 },
    variantId: { type: String, required: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    variantName: { type: String, required: true },
    sku: { type: String, required: true },
    brand: { type: String, default: null },
    sportType: { type: [String], default: [] },
    isBulky: { type: Boolean, default: false },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { _id: false },
);

const vendorSubOrderSchema = new mongoose.Schema(
  {
    subOrderId: {
      type: String,
      default: uuidv4,
      unique: true,
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    sellerId: {
      type: String,
      required: true,
      index: true,
    },
    storeName: {
      type: String,
      required: true,
    },
    items: [vendorSubOrderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    commissionRate: {
      type: Number,
      default: 0.1, // 10%
    },
    commissionAmount: {
      type: Number,
      default: 0,
    },
    vendorPayout: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PACKED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PENDING",
      index: true,
    },
    carrier: {
      type: String,
      default: null,
    },
    trackingNumber: {
      type: String,
      default: null,
    },
    estimatedDeliveryDate: {
      type: Date,
      default: null,
    },
    shippedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const VendorSubOrderModel = mongoose.model(
  "VendorSubOrder",
  vendorSubOrderSchema,
);
