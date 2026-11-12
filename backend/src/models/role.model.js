import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const roleSchema = new mongoose.Schema(
  {
    roleId: {
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
    roleType: {
      type: String,
      enum: ["ADMIN", "CUSTOMER", "SELLER"],
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
  },
);

export const RoleModel = mongoose.model("Role", roleSchema);
