import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const inventorySchema = new mongoose.Schema(
  {
    inventoryId: {
      type: String,
      default: uuidv4,
      unique: true,
      required: true,
    },
    variantId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    quantityOnHand: { type: Number, default: 0 },
    quantityReserved: { type: Number, default: 0 },
    quantityAvailable: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 0 },
    reorderQuantity: { type: Number, default: 0 },
    warehouseLocation: { type: String, default: null },
    lastCountedAt: { type: Date, default: null },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

inventorySchema.set("toJSON", { getters: true });
inventorySchema.set("toObject", { getters: true });

inventorySchema.pre("save", function () {
  this.quantityAvailable = this.quantityOnHand - this.quantityReserved;
  this.updatedAt = new Date();
});

inventorySchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (update && (update.quantityOnHand !== undefined || update.quantityReserved !== undefined)) {
    const onHand = update.quantityOnHand ?? update.$set?.quantityOnHand;
    const reserved = update.quantityReserved ?? update.$set?.quantityReserved;
    if (onHand !== undefined && reserved !== undefined) {
      this.set({ quantityAvailable: onHand - reserved, updatedAt: new Date() });
    }
  }
});

export const InventoryModel = mongoose.model("Inventory", inventorySchema);
