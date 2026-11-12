import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const reservationItemSchema = new mongoose.Schema(
  {
    variantId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
  },
  { _id: false },
);

const reservationSchema = new mongoose.Schema(
  {
    reservationId: {
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
    cartId: {
      type: String,
      required: true,
      index: true,
    },
    items: [reservationItemSchema],
    status: {
      type: String,
      enum: ["ACTIVE", "CONSUMED", "RELEASED", "EXPIRED"],
      default: "ACTIVE",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const ReservationModel = mongoose.model(
  "Reservation",
  reservationSchema,
);
