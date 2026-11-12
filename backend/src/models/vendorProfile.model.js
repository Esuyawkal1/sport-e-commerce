import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const vendorProfileSchema = new mongoose.Schema(
  {
    vendorId: {
      type: String,
      default: uuidv4,
      unique: true,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    storeName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    sportsSpecialization: {
      type: [String],
      default: [],
    },
    logoUrl: {
      type: String,
      default: null,
    },
    bannerUrl: {
      type: String,
      default: null,
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      default: null,
      trim: true,
    },
    businessAddress: {
      street: { type: String, default: null },
      city: { type: String, default: null },
      state: { type: String, default: null },
      postalCode: { type: String, default: null },
      country: { type: String, default: null },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    commissionRate: {
      type: Number,
      default: 0.1, // 10% marketplace commission rate
      min: 0,
      max: 1,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalSalesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const VendorProfileModel = mongoose.model(
  "VendorProfile",
  vendorProfileSchema,
);
