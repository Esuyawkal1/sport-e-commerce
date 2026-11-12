import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const orderItemSchema = new mongoose.Schema(
  {
    orderItemId: {
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
    variantId: {
      type: String,
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    lineTotal: {
      type: Number,
      required: true,
    },
    itemStatus: {
      type: String,
      enum: ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"],
      default: "PENDING",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

orderItemSchema.pre("save", function () {
  this.lineTotal = this.quantity * this.unitPrice;
});

export const OrderItemModel = mongoose.model("OrderItem", orderItemSchema);
