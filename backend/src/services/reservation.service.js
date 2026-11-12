import { ReservationModel } from "../models/reservation.model.js";
import { InventoryModel } from "../models/inventory.model.js";
import { CartModel } from "../models/cart.model.js";
import { CartItemModel } from "../models/cartItem.model.js";

export const createStockReservation = async ({
  userId,
  cartId,
  durationMinutes = 15,
}) => {
  const cart = await CartModel.findOne({ cartId, userId, cartStatus: "ACTIVE" });
  if (!cart) {
    const error = new Error("Active cart not found.");
    error.statusCode = 404;
    throw error;
  }

  const items = await CartItemModel.find({ cartId }).lean();
  if (!items || items.length === 0) {
    const error = new Error("Cannot reserve an empty cart.");
    error.statusCode = 400;
    throw error;
  }

  // Release any existing active reservations for this cart first
  const existingReservations = await ReservationModel.find({
    cartId,
    status: "ACTIVE",
  });
  for (const res of existingReservations) {
    await releaseStockReservation(res.reservationId);
  }

  const reservedItems = [];
  const rollbackItems = [];

  try {
    for (const item of items) {
      // Atomic reservation check and update
      const updatedInventory = await InventoryModel.findOneAndUpdate(
        {
          variantId: item.variantId,
          quantityAvailable: { $gte: item.quantity },
        },
        {
          $inc: {
            quantityReserved: item.quantity,
            quantityAvailable: -item.quantity,
          },
        },
        { new: true },
      );

      if (!updatedInventory) {
        const error = new Error(
          `Insufficient stock available for variant '${item.variantId}'. Could not complete reservation.`,
        );
        error.statusCode = 409;
        throw error;
      }

      rollbackItems.push({
        variantId: item.variantId,
        quantity: item.quantity,
      });

      reservedItems.push({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    }

    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    const reservation = await ReservationModel.create({
      userId,
      cartId,
      items: reservedItems,
      expiresAt,
      status: "ACTIVE",
    });

    return {
      reservationId: reservation.reservationId,
      expiresAt: reservation.expiresAt,
      status: reservation.status,
      itemsCount: reservedItems.length,
    };
  } catch (err) {
    // Rollback any items reserved before the failure
    for (const roll of rollbackItems) {
      await InventoryModel.findOneAndUpdate(
        { variantId: roll.variantId },
        {
          $inc: {
            quantityReserved: -roll.quantity,
            quantityAvailable: roll.quantity,
          },
        },
      );
    }
    throw err;
  }
};

export const releaseStockReservation = async (reservationId) => {
  const reservation = await ReservationModel.findOne({ reservationId });
  if (!reservation) {
    const error = new Error(`Reservation '${reservationId}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (reservation.status !== "ACTIVE") {
    return {
      reservationId: reservation.reservationId,
      status: reservation.status,
      message: `Reservation already ${reservation.status.toLowerCase()}.`,
    };
  }

  for (const item of reservation.items) {
    await InventoryModel.findOneAndUpdate(
      { variantId: item.variantId },
      {
        $inc: {
          quantityReserved: -item.quantity,
          quantityAvailable: item.quantity,
        },
      },
    );
  }

  reservation.status = "RELEASED";
  await reservation.save();

  return {
    reservationId: reservation.reservationId,
    status: "RELEASED",
    message: "Stock reservation released successfully.",
  };
};

export const consumeStockReservation = async (reservationId) => {
  const reservation = await ReservationModel.findOne({ reservationId });
  if (!reservation) {
    const error = new Error(`Reservation '${reservationId}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (reservation.status !== "ACTIVE") {
    const error = new Error(
      `Cannot consume reservation in status '${reservation.status}'.`,
    );
    error.statusCode = 400;
    throw error;
  }

  // Deduct permanently from onHand and reserved
  for (const item of reservation.items) {
    await InventoryModel.findOneAndUpdate(
      { variantId: item.variantId },
      {
        $inc: {
          quantityOnHand: -item.quantity,
          quantityReserved: -item.quantity,
        },
      },
    );
  }

  reservation.status = "CONSUMED";
  await reservation.save();

  return {
    reservationId: reservation.reservationId,
    status: "CONSUMED",
  };
};

export const releaseExpiredReservations = async () => {
  const now = new Date();
  const expired = await ReservationModel.find({
    status: "ACTIVE",
    expiresAt: { $lt: now },
  });

  let releasedCount = 0;
  for (const res of expired) {
    await releaseStockReservation(res.reservationId);
    res.status = "EXPIRED";
    await res.save();
    releasedCount++;
  }

  return { releasedCount };
};
