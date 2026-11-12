import { TransactionModel } from "../models/transaction.model.js";
import { OrderModel } from "../models/order.model.js";
import { OrderItemModel } from "../models/orderItem.model.js";
import { InventoryModel } from "../models/inventory.model.js";
import { CartModel } from "../models/cart.model.js";

export const processTransaction = async ({
  userId,
  orderId,
  transactionType = "PAYMENT",
  paymentMethod = "CREDIT_CARD",
  amount,
  transactionStatus = "COMPLETED",
  referenceId,
  notes,
}) => {
  const order = await OrderModel.findOne({ orderId });
  if (!order) {
    const error = new Error(`Order with ID ${orderId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  // Record or update transaction
  let transaction;
  if (referenceId) {
    transaction = await TransactionModel.findOne({ referenceId });
  }

  if (transaction) {
    transaction.transactionStatus = transactionStatus;
    if (notes) transaction.notes = notes;
    if (amount) transaction.amount = amount;
    await transaction.save();
  } else {
    transaction = await TransactionModel.create({
      userId: userId || order.userId,
      orderId,
      transactionType,
      paymentMethod,
      amount: amount !== undefined ? amount : order.totalAmount,
      transactionStatus,
      referenceId,
      notes,
    });
  }

  // Handle Inventory and Order status updates based on settlement
  const orderItems = await OrderItemModel.find({ orderId: order.orderId });

  if (transactionStatus === "COMPLETED") {
    order.orderStatus = "CONFIRMED";
    await order.save();

    // Settle inventory: reserved stock is finalized (decrement quantityReserved)
    for (const item of orderItems) {
      await InventoryModel.findOneAndUpdate(
        { variantId: item.variantId },
        {
          $inc: { quantityReserved: -item.quantity },
          $set: { updatedAt: new Date() },
        },
      );
    }
  } else if (transactionStatus === "FAILED" || transactionStatus === "REVERSED") {
    order.orderStatus = "CANCELLED";
    await order.save();

    // Release inventory reservation back to onHand
    for (const item of orderItems) {
      await InventoryModel.findOneAndUpdate(
        { variantId: item.variantId },
        {
          $inc: {
            quantityOnHand: item.quantity,
            quantityReserved: -item.quantity,
          },
          $set: { updatedAt: new Date() },
        },
      );
    }
  }

  return {
    transaction: {
      transactionId: transaction.transactionId,
      userId: transaction.userId,
      orderId: transaction.orderId,
      transactionType: transaction.transactionType,
      paymentMethod: transaction.paymentMethod,
      amount: transaction.amount,
      transactionStatus: transaction.transactionStatus,
      referenceId: transaction.referenceId,
      notes: transaction.notes,
      transactionDate: transaction.transactionDate,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    },
    order: {
      orderId: order.orderId,
      orderStatus: order.orderStatus,
      totalAmount: order.totalAmount,
    },
  };
};

export const handleStripeWebhook = async (payload) => {
  if (
    !payload ||
    !payload.data ||
    !payload.data.object ||
    !payload.data.object.metadata ||
    !payload.data.object.metadata.orderId
  ) {
    const error = new Error("Invalid Stripe webhook signature or payload schema.");
    error.statusCode = 400;
    throw error;
  }

  const { orderId, userId } = payload.data.object.metadata;
  const paymentIntentId = payload.data.object.id;
  const status = payload.data.object.status;

  const order = await OrderModel.findOne({ orderId });
  if (!order) {
    const error = new Error(`Order with ID ${orderId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  const isSuccess = status === "succeeded" || payload.type === "payment_intent.succeeded";
  const finalStatus = isSuccess ? "COMPLETED" : "FAILED";

  // Update transaction
  let transaction = await TransactionModel.findOne({
    $or: [{ referenceId: paymentIntentId }, { orderId }],
  });

  if (transaction) {
    transaction.transactionStatus = finalStatus;
    if (paymentIntentId) transaction.referenceId = paymentIntentId;
    await transaction.save();
  } else {
    transaction = await TransactionModel.create({
      userId: userId || order.userId,
      orderId,
      transactionType: "PAYMENT",
      paymentMethod: "CREDIT_CARD",
      amount: order.totalAmount,
      transactionStatus: finalStatus,
      referenceId: paymentIntentId,
      notes: `Stripe webhook event: ${payload.type || "payment_intent"}`,
    });
  }

  // Update order status
  order.orderStatus = isSuccess ? "CONFIRMED" : "CANCELLED";
  await order.save();

  // Ensure cart is CONVERTED
  await CartModel.updateMany(
    { userId: order.userId, cartStatus: "ACTIVE" },
    { cartStatus: "CONVERTED" },
  );

  // Settle or rollback inventory
  const orderItems = await OrderItemModel.find({ orderId: order.orderId });
  if (isSuccess) {
    for (const item of orderItems) {
      await InventoryModel.findOneAndUpdate(
        { variantId: item.variantId },
        {
          $inc: { quantityReserved: -item.quantity },
          $set: { updatedAt: new Date() },
        },
      );
    }
  } else {
    for (const item of orderItems) {
      await InventoryModel.findOneAndUpdate(
        { variantId: item.variantId },
        {
          $inc: {
            quantityOnHand: item.quantity,
            quantityReserved: -item.quantity,
          },
          $set: { updatedAt: new Date() },
        },
      );
    }
  }

  return {
    received: true,
    orderId: order.orderId,
    orderStatus: order.orderStatus,
    cartStatus: "CONVERTED",
    transactionStatus: transaction.transactionStatus,
  };
};

export const getTransactionsByUser = async (userId) => {
  const transactions = await TransactionModel.find({ userId })
    .sort({ createdAt: -1 })
    .select("-_id")
    .lean();

  return { transactions };
};
