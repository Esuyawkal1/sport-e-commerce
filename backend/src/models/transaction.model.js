import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      default: uuidv4,
      unique: true,
      required: true,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      default: null,
      index: true,
    },
    transactionType: {
      type: String,
      enum: ["PAYMENT", "REFUND", "ADJUSTMENT", "PAYOUT"],
      default: "PAYMENT",
    },
    paymentMethod: {
      type: String,
      enum: [
        "CREDIT_CARD",
        "DEBIT_CARD",
        "PAYPAL",
        "BANK_TRANSFER",
        "MOCK_GATEWAY",
        "CHAPA",
        "OTHER",
      ],
      default: "CREDIT_CARD",
    },
    amount: {
      type: Number,
      required: true,
    },
    commissionTotal: {
      type: Number,
      default: 0,
    },
    netVendorPayoutTotal: {
      type: Number,
      default: 0,
    },
    paymentDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    transactionStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
      default: "PENDING",
      index: true,
    },
    referenceId: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export const TransactionModel = mongoose.model(
  "Transaction",
  transactionSchema,
);
