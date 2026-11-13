import { v4 as uuidv4 } from "uuid";
import { OrderModel } from "../models/order.model.js";
import { OrderItemModel } from "../models/orderItem.model.js";
import { CartModel } from "../models/cart.model.js";
import { CartItemModel } from "../models/cartItem.model.js";
import { VariantModel } from "../models/variant.model.js";
import { ProductModel } from "../models/product.model.js";
import { InventoryModel } from "../models/inventory.model.js";
import { TransactionModel } from "../models/transaction.model.js";
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

      return {
        isDuplicate: true,
        order: existingOrder,
        transaction: existingTx,
      };
    }
  }

  // 2. Locate active cart
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

  // 6. Create Direct Store Order
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

  // 7. Create OrderItem Records
  const allOrderItems = [];
  for (const item of enrichedCart.items) {
    const orderItem = await OrderItemModel.create({
      orderItemId: uuidv4(),
      orderId: order.orderId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      itemStatus: "PENDING",
    });

    allOrderItems.push({
      orderItemId: orderItem.orderItemId,
      variantId: item.variantId,
      productId: item.product?.productId || "",
      productName: item.product?.name || "Sports Product",
      variantName: item.variant?.variantName || "Standard",
      sku: item.variant?.sku || item.product?.sku || "",
      brand: item.product?.brand || null,
      sportType: item.product?.sportType || [],
      isBulky: Boolean(item.product?.isBulky),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    });
  }

  // 8. Create Transaction Record
  const referenceId = `tx_${uuidv4().replace(/-/g, "").slice(0, 24)}`;
  const transaction = await TransactionModel.create({
    userId,
    orderId: order.orderId,
    idempotencyKey: idempotencyKey ? idempotencyKey.trim() : null,
    transactionType: "PAYMENT",
    paymentMethod: paymentMethod || "CREDIT_CARD",
    amount: grandTotal,
    commissionTotal: 0,
    netVendorPayoutTotal: 0,
    transactionStatus: "COMPLETED",
    referenceId,
    notes: `Direct purchase payment for ${orderNumber}`,
  });

  // 9. Convert Cart & Clear Items
  await CartModel.updateOne(
    { cartId: enrichedCart.cartId },
    { cartStatus: "CONVERTED" },
  );
  await CartItemModel.deleteMany({ cartId: enrichedCart.cartId });

  const directPackage = {
    subOrderId: `${order.orderId}-pkg`,
    orderNumber: order.orderNumber,
    sellerId: "STORE_DIRECT",
    storeName: "SportMarket Direct",
    itemsCount: allOrderItems.length,
    subtotal,
    shippingFee: shipping,
    status: "CONFIRMED",
    items: allOrderItems,
  };

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
      items: allOrderItems,
      vendorSubOrders: [directPackage],
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
  const items = await OrderItemModel.find({ orderId: { $in: orderIds } }).lean();

  const variantIds = items.map((i) => i.variantId);
  const variants = await VariantModel.find({ variantId: { $in: variantIds } }).lean();
  const variantMap = {};
  for (const v of variants) variantMap[v.variantId] = v;

  const productIds = variants.map((v) => v.productId);
  const products = await ProductModel.find({ productId: { $in: productIds } }).lean();
  const productMap = {};
  for (const p of products) productMap[p.productId] = p;

  const itemsByOrder = {};
  for (const item of items) {
    if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = [];
    const v = variantMap[item.variantId] || {};
    const p = productMap[v.productId] || {};
    itemsByOrder[item.orderId].push({
      ...item,
      productName: p.name || "Sports Product",
      variantName: v.variantName || "Standard",
      sku: v.sku || p.sku || "",
      brand: p.brand || null,
      sportType: p.sportType || [],
      isBulky: Boolean(p.isBulky),
    });
  }

  const result = orders.map((o) => {
    const orderItems = itemsByOrder[o.orderId] || [];
    return {
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
      items: orderItems,
      vendorSubOrders: [
        {
          subOrderId: `${o.orderId}-pkg`,
          orderNumber: o.orderNumber,
          storeName: "SportMarket Direct",
          status: o.orderStatus,
          shippingFee: o.shippingAmount,
          items: orderItems,
        },
      ],
    };
  });

  return { orders: result };
};

export const getOrderById = async (userId, orderId) => {
  const order = await OrderModel.findOne({ orderId, userId }).lean();
  if (!order) {
    const error = new Error(`Order with ID ${orderId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  const items = await OrderItemModel.find({ orderId: order.orderId }).lean();
  const variantIds = items.map((i) => i.variantId);
  const variants = await VariantModel.find({ variantId: { $in: variantIds } }).lean();
  const variantMap = {};
  for (const v of variants) variantMap[v.variantId] = v;

  const productIds = variants.map((v) => v.productId);
  const products = await ProductModel.find({ productId: { $in: productIds } }).lean();
  const productMap = {};
  for (const p of products) productMap[p.productId] = p;

  const orderItems = items.map((item) => {
    const v = variantMap[item.variantId] || {};
    const p = productMap[v.productId] || {};
    return {
      ...item,
      productName: p.name || "Sports Product",
      variantName: v.variantName || "Standard",
      sku: v.sku || p.sku || "",
      brand: p.brand || null,
      sportType: p.sportType || [],
      isBulky: Boolean(p.isBulky),
    };
  });

  const transactions = await TransactionModel.find({
    orderId: order.orderId,
  }).lean();

  return {
    order: {
      ...order,
      items: orderItems,
      vendorSubOrders: [
        {
          subOrderId: `${order.orderId}-pkg`,
          orderNumber: order.orderNumber,
          storeName: "SportMarket Direct",
          status: order.orderStatus,
          shippingFee: order.shippingAmount,
          items: orderItems,
        },
      ],
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

  const items = await OrderItemModel.find({ orderId: order.orderId }).lean();
  const variantIds = items.map((i) => i.variantId);
  const variants = await VariantModel.find({ variantId: { $in: variantIds } }).lean();
  const variantMap = {};
  for (const v of variants) variantMap[v.variantId] = v;

  const productIds = variants.map((v) => v.productId);
  const products = await ProductModel.find({ productId: { $in: productIds } }).lean();
  const productMap = {};
  for (const p of products) productMap[p.productId] = p;

  const orderItems = items.map((item) => {
    const v = variantMap[item.variantId] || {};
    const p = productMap[v.productId] || {};
    return {
      productName: p.name || "Sports Product",
      variantName: v.variantName || "Standard",
      quantity: item.quantity,
      isBulky: Boolean(p.isBulky),
    };
  });

  const trackingPackages = [
    {
      subOrderId: `${order.orderId}-pkg`,
      orderNumber: order.orderNumber,
      vendorStoreName: "SportMarket Fulfillment",
      packageStatus: order.orderStatus,
      carrier: order.shippingMethod || "Standard Ground Carrier",
      trackingNumber: order.trackingNumber || `TRK-${order.orderNumber.replace("ORD-", "")}`,
      shippedAt: order.actualDeliveryDate || null,
      estimatedDeliveryDate: order.estimatedDeliveryDate || null,
      items: orderItems,
    },
  ];

  return {
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    trackingNumber: order.trackingNumber,
    packagesCount: 1,
    trackingPackages,
  };
};
