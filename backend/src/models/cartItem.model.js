import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const cartItemSchema = new mongoose.Schema(
  {
    cartItemId: {
      type: String,
      default: uuidv4,
      unique: true,
      required: true,
    },
    cartId: {
      type: String,
      required: true,
      index: true,
    },
    variantId: {
      type: String,
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

cartItemSchema.pre("save", function () {
  this.lineTotal = this.quantity * this.unitPrice;
});

// Add updatedAt manually since timestamps: false
cartItemSchema.set("toJSON", { getters: true });
cartItemSchema.set("toObject", { getters: true });

export const CartItemModel = mongoose.model("CartItem", cartItemSchema);
