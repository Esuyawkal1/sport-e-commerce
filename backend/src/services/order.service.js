import { v4 as uuidv4 } from "uuid";
import { OrderModel } from "../models/order.model.js";
import { OrderItemModel } from "../models/orderItem.model.js";
import { VendorSubOrderModel } from "../models/vendorSubOrder.model.js";
import { CartModel } from "../models/cart.model.js";
import { CartItemModel } from "../models/cartItem.model.js";
import { VariantModel } from "../models/variant.model.js";
import { ProductModel } from "../models/product.model.js";
import { InventoryModel } from "../models/inventory.model.js";
import { TransactionModel } from "../models/transaction.model.js";
import { VendorProfileModel } from "../models/vendorProfile.model.js";
import { getActiveCart } from "./cart.service.js";
import { consumeStockReservation } from "./reservation.service.js";

const round2 = (num) => Math.round(num * 100) / 100;

export const placeOrder = async (
  userId,
  {
    cartId,
    shippingAddress,
    billingAddress,
    shippingMethod = "Standard Ground",
    paymentMethod = "CREDIT_CARD",
    idempotencyKey,
    reservationId,
  } = {},
) => {
  // 1. Idempotency Check: prevent double-charging
  if (idempotencyKey && idempotencyKey.trim()) {
    const cleanKey = idempotencyKey.trim();
    const existingTx = await TransactionModel.findOne({
      idempotencyKey: cleanKey,
      transactionStatus: "COMPLETED",
    }).lean();

    if (existingTx && existingTx.orderId) {
      const existingOrder = await OrderModel.findOne({
        orderId: existingTx.orderId,
      }).lean();
      const existingSubOrders = await VendorSubOrderModel.find({
        orderId: existingTx.orderId,
      }).lean();

      return {
        isDuplicate: true,
        order: {
          ...existingOrder,
          vendorSubOrders: existingSubOrders,
        },
        transaction: existingTx,
      };
    }
  }

  // 2. Locate active cart with enriched multi-vendor details
  const enrichedCart = await getActiveCart(userId);

  if (
    !enrichedCart ||
    !enrichedCart.items ||
    enrichedCart.items.length === 0 ||
    enrichedCart.totalItems <= 0
  ) {
    const error = new Error("Cart is empty or has no active items to checkout.");
    error.statusCode = 400;
    throw error;
  }

  // 3. Inventory Reservation or Deduct permanently
  if (reservationId) {
    await consumeStockReservation(reservationId);
  } else {
    // Permanent atomic inventory check & decrement
    const deductedItems = [];
    try {
      for (const item of enrichedCart.items) {
        const inventory = await InventoryModel.findOneAndUpdate(
          {
            variantId: item.variantId,
            quantityOnHand: { $gte: item.quantity },
          },
          {
            $inc: {
              quantityOnHand: -item.quantity,
              quantityAvailable: -item.quantity,
            },
            $set: { updatedAt: new Date() },
          },
          { new: true },
        );

        if (!inventory) {
          const error = new Error(
            `Insufficient stock available for '${item.product?.name || item.variantId}'.`,
          );
          error.statusCode = 400;
          throw error;
        }

        deductedItems.push({
          variantId: item.variantId,
          quantity: item.quantity,
        });
      }
    } catch (err) {
      // Rollback any successfully deducted items
      for (const ded of deductedItems) {
        await InventoryModel.findOneAndUpdate(
          { variantId: ded.variantId },
          {
            $inc: {
              quantityOnHand: ded.quantity,
              quantityAvailable: ded.quantity,
            },
          },
        );
      }
      throw err;
    }
  }

  // 4. Financial Calculations
  const subtotal = round2(enrichedCart.subtotalAmount);
  const tax = round2(enrichedCart.taxAmount);
  const shipping = round2(enrichedCart.shippingAmount);
  const discount = round2(enrichedCart.discountAmount);
  const grandTotal = round2(
    Math.max(0, subtotal + tax + shipping - discount),
  );

  // 5. Generate Order Number
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const orderNumber = `ORD-${todayStr}-${randomSuffix}`;

  // 6. Create Master Order
  const order = await OrderModel.create({
    userId,
    orderNumber,
    orderStatus: "CONFIRMED",
    paymentStatus: "PAID",
    subtotalAmount: subtotal,
    taxAmount: tax,
    shippingAmount: shipping,
    discountAmount: discount,
    totalAmount: grandTotal,
    couponCode: enrichedCart.couponCode,
    itemsCount: enrichedCart.totalItems,
    shippingAddress: shippingAddress || null,
    billingAddress: billingAddress || shippingAddress || null,
    shippingMethod: shippingMethod || "Standard Ground",
    orderDate: new Date(),
  });

  // 7. Multi-Vendor Order Splitting: create sub-orders per vendor
  const subOrders = [];
  const allOrderItems = [];
  let commissionTotal = 0;
  let netVendorPayoutTotal = 0;

  let vendorIndex = 1;
  for (const group of enrichedCart.vendorGroups) {
    const vendorProfile = await VendorProfileModel.findOne({
      userId: group.sellerId,
    }).lean();

    const commissionRate = vendorProfile?.commissionRate ?? 0.1;
    const subtotalGroup = round2(group.subtotal);
    const shippingFeeGroup = round2(group.shippingFee || 0);
    const commissionAmount = round2(subtotalGroup * commissionRate);
    const vendorPayout = round2(
      subtotalGroup + shippingFeeGroup - commissionAmount,
    );

    commissionTotal += commissionAmount;
    netVendorPayoutTotal += vendorPayout;

    const subOrderNumber = `${orderNumber}-V${vendorIndex++}`;

    const subOrderItems = group.items.map((i) => ({
      orderItemId: uuidv4(),
      variantId: i.variantId,
      productId: i.product?.productId || "",
      productName: i.product?.name || "Sports Product",
      variantName: i.variant?.variantName || "Standard",
      sku: i.variant?.sku || i.product?.sku || "",
      brand: i.product?.brand || null,
      sportType: i.product?.sportType || [],
      isBulky: Boolean(i.product?.isBulky),
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    }));

    const vendorSubOrder = await VendorSubOrderModel.create({
      orderId: order.orderId,
      orderNumber: subOrderNumber,
      sellerId: group.sellerId,
      storeName: group.storeName,
      items: subOrderItems,
      subtotal: subtotalGroup,
      shippingFee: shippingFeeGroup,
      commissionRate,
      commissionAmount,
      vendorPayout,
      status: "CONFIRMED",
    });

    subOrders.push(vendorSubOrder);

    // Save individual OrderItem records
    for (const soi of subOrderItems) {
      const orderItem = await OrderItemModel.create({
        orderItemId: soi.orderItemId,
        orderId: order.orderId,
        variantId: soi.variantId,
        quantity: soi.quantity,
        unitPrice: soi.unitPrice,
        lineTotal: soi.lineTotal,
        itemStatus: "PENDING",
      });
      allOrderItems.push(orderItem);
    }
  }

  // Update Master Order with vendorSubOrderIds
  await OrderModel.updateOne(
    { orderId: order.orderId },
    { vendorSubOrderIds: subOrders.map((so) => so.subOrderId) },
  );

  // 8. Create Transaction Record
  const referenceId = `tx_${uuidv4().replace(/-/g, "").slice(0, 24)}`;
  const transaction = await TransactionModel.create({
    userId,
    orderId: order.orderId,
    idempotencyKey: idempotencyKey ? idempotencyKey.trim() : null,
    transactionType: "PAYMENT",
    paymentMethod: paymentMethod || "CREDIT_CARD",
    amount: grandTotal,
    commissionTotal: round2(commissionTotal),
    netVendorPayoutTotal: round2(netVendorPayoutTotal),
    transactionStatus: "COMPLETED",
    referenceId,
    notes: `Checkout payment for ${orderNumber} across ${subOrders.length} sports vendor(s)`,
  });

  // 9. Convert Cart & Clear Items
  await CartModel.updateOne(
    { cartId: enrichedCart.cartId },
    { cartStatus: "CONVERTED" },
  );
  await CartItemModel.deleteMany({ cartId: enrichedCart.cartId });

  return {
    order: {
      orderId: order.orderId,
      userId: order.userId,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      subtotalAmount: order.subtotalAmount,
      taxAmount: order.taxAmount,
      shippingAmount: order.shippingAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      itemsCount: order.itemsCount,
      shippingAddress: order.shippingAddress,
      orderDate: order.orderDate,
      vendorSubOrders: subOrders.map((so) => ({
        subOrderId: so.subOrderId,
        orderNumber: so.orderNumber,
        sellerId: so.sellerId,
        storeName: so.storeName,
        itemsCount: so.items.length,
        subtotal: so.subtotal,
        shippingFee: so.shippingFee,
        status: so.status,
        items: so.items,
      })),
    },
    transaction: {
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod,
      transactionStatus: transaction.transactionStatus,
      referenceId: transaction.referenceId,
      createdAt: transaction.createdAt,
    },
  };
};

export const getOrderHistory = async (userId) => {
  const orders = await OrderModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  const orderIds = orders.map((o) => o.orderId);
  const subOrders = await VendorSubOrderModel.find({
    orderId: { $in: orderIds },
  }).lean();

  const subOrdersByOrder = {};
  for (const so of subOrders) {
    if (!subOrdersByOrder[so.orderId]) {
      subOrdersByOrder[so.orderId] = [];
    }
    subOrdersByOrder[so.orderId].push(so);
  }

  const result = orders.map((o) => ({
    orderId: o.orderId,
    userId: o.userId,
    orderNumber: o.orderNumber,
    orderStatus: o.orderStatus,
    paymentStatus: o.paymentStatus,
    subtotalAmount: o.subtotalAmount,
    taxAmount: o.taxAmount,
    shippingAmount: o.shippingAmount,
    discountAmount: o.discountAmount,
    totalAmount: o.totalAmount,
    shippingAddress: o.shippingAddress,
    orderDate: o.orderDate,
    createdAt: o.createdAt,
    vendorSubOrders: subOrdersByOrder[o.orderId] || [],
  }));

  return { orders: result };
};

export const getOrderById = async (userId, orderId) => {
  const order = await OrderModel.findOne({ orderId, userId }).lean();
  if (!order) {
    const error = new Error(`Order with ID ${orderId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  const subOrders = await VendorSubOrderModel.find({
    orderId: order.orderId,
  }).lean();

  const transactions = await TransactionModel.find({
    orderId: order.orderId,
  }).lean();

  return {
    order: {
      ...order,
      vendorSubOrders: subOrders,
      transactions,
    },
  };
};

export const trackOrder = async (userId, orderId) => {
  const order = await OrderModel.findOne({ orderId, userId }).lean();
  if (!order) {
    const error = new Error(`Order with ID ${orderId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  const subOrders = await VendorSubOrderModel.find({
    orderId: order.orderId,
  }).lean();

  const trackingPackages = subOrders.map((so) => ({
    subOrderId: so.subOrderId,
    orderNumber: so.orderNumber,
    vendorStoreName: so.storeName,
    packageStatus: so.status,
    carrier: so.carrier || "Standard Carrier Pending",
    trackingNumber: so.trackingNumber || "Awaiting vendor dispatch",
    shippedAt: so.shippedAt,
    deliveredAt: so.deliveredAt,
    estimatedDeliveryDate: so.estimatedDeliveryDate,
    items: so.items.map((i) => ({
      productName: i.productName,
      variantName: i.variantName,
      quantity: i.quantity,
      isBulky: i.isBulky,
    })),
  }));

  return {
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    shippingAddress: order.shippingAddress,
    orderDate: order.orderDate,
    totalPackages: trackingPackages.length,
    packages: trackingPackages,
  };
};
