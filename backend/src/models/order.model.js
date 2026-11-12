import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
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
    orderNumber: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    orderStatus: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "PARTIALLY_SHIPPED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PENDING",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    subtotalAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    shippingAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    vendorSubOrderIds: { type: [String], default: [] },
    itemsCount: { type: Number, default: 0 },
    shippingAddress: { type: mongoose.Schema.Types.Mixed, default: null },
    billingAddress: { type: mongoose.Schema.Types.Mixed, default: null },
    shippingMethod: { type: String, default: null },
    trackingNumber: { type: String, default: null },
    orderDate: { type: Date, default: Date.now },
    estimatedDeliveryDate: { type: Date, default: null },
    actualDeliveryDate: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

export const OrderModel = mongoose.model("Order", orderSchema);
