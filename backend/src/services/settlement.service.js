import { VendorSubOrderModel } from "../models/vendorSubOrder.model.js";
import { OrderModel } from "../models/order.model.js";

const round2 = (num) => Math.round(num * 100) / 100;

export const getVendorOrders = async (
  sellerId,
  { status, page = 1, limit = 20 } = {},
) => {
  const filter = { sellerId };
  if (status) {
    filter.status = status.toUpperCase().trim();
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    VendorSubOrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    VendorSubOrderModel.countDocuments(filter),
  ]);

  return {
    orders,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  };
};

export const getVendorSubOrderById = async (sellerId, subOrderId) => {
  const subOrder = await VendorSubOrderModel.findOne({ subOrderId }).lean();

  if (!subOrder) {
    const error = new Error(`Sub-order '${subOrderId}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (subOrder.sellerId !== sellerId) {
    const error = new Error(
      "Access denied: You do not have permission to view this sub-order.",
    );
    error.statusCode = 403;
    throw error;
  }

  return { subOrder };
};

export const updateVendorSubOrderStatus = async (
  sellerId,
  subOrderId,
  { status, carrier, trackingNumber, notes, estimatedDeliveryDate },
) => {
  const subOrder = await VendorSubOrderModel.findOne({ subOrderId });

  if (!subOrder) {
    const error = new Error(`Sub-order '${subOrderId}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (subOrder.sellerId !== sellerId) {
    const error = new Error(
      "Access denied: You do not have permission to manage this sub-order.",
    );
    error.statusCode = 403;
    throw error;
  }

  const validStatuses = [
    "PENDING",
    "CONFIRMED",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  if (status) {
    const upperStatus = status.toUpperCase().trim();
    if (!validStatuses.includes(upperStatus)) {
      const error = new Error(
        `Invalid status '${status}'. Must be one of: ${validStatuses.join(", ")}`,
      );
      error.statusCode = 400;
      throw error;
    }
    subOrder.status = upperStatus;

    if (upperStatus === "SHIPPED" && !subOrder.shippedAt) {
      subOrder.shippedAt = new Date();
    }
    if (upperStatus === "DELIVERED" && !subOrder.deliveredAt) {
      subOrder.deliveredAt = new Date();
    }
  }

  if (carrier !== undefined) subOrder.carrier = carrier;
  if (trackingNumber !== undefined) subOrder.trackingNumber = trackingNumber;
  if (notes !== undefined) subOrder.notes = notes;
  if (estimatedDeliveryDate !== undefined) {
    subOrder.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
  }

  await subOrder.save();

  // Status Rollup: Update master order status based on all its vendor sub-orders
  const allSubOrders = await VendorSubOrderModel.find({
    orderId: subOrder.orderId,
  }).lean();

  const statuses = allSubOrders.map((s) => s.status);
  let masterStatus = "PROCESSING";

  if (statuses.every((s) => s === "DELIVERED")) {
    masterStatus = "DELIVERED";
  } else if (statuses.every((s) => s === "CANCELLED")) {
    masterStatus = "CANCELLED";
  } else if (statuses.every((s) => s === "SHIPPED" || s === "DELIVERED")) {
    masterStatus = "SHIPPED";
  } else if (statuses.some((s) => s === "SHIPPED" || s === "DELIVERED")) {
    masterStatus = "PARTIALLY_SHIPPED";
  } else if (statuses.every((s) => s === "PACKED")) {
    masterStatus = "PROCESSING";
  } else if (statuses.some((s) => s === "CONFIRMED" || s === "PACKED")) {
    masterStatus = "CONFIRMED";
  }

  await OrderModel.updateOne(
    { orderId: subOrder.orderId },
    { orderStatus: masterStatus },
  );

  return {
    subOrder,
    masterOrderStatus: masterStatus,
  };
};

export const getVendorFinancialSettlement = async (sellerId) => {
  const subOrders = await VendorSubOrderModel.find({ sellerId }).lean();

  let grossSales = 0;
  let shippingCollected = 0;
  let marketplaceCommission = 0;
  let netEarnings = 0;
  let settledEarnings = 0;
  let pendingSettlement = 0;

  for (const o of subOrders) {
    if (o.status === "CANCELLED") continue;

    grossSales += o.subtotal || 0;
    shippingCollected += o.shippingFee || 0;
    marketplaceCommission += o.commissionAmount || 0;
    netEarnings += o.vendorPayout || 0;

    if (o.status === "DELIVERED") {
      settledEarnings += o.vendorPayout || 0;
    } else {
      pendingSettlement += o.vendorPayout || 0;
    }
  }

  return {
    sellerId,
    summary: {
      totalSubOrders: subOrders.length,
      grossSales: round2(grossSales),
      shippingCollected: round2(shippingCollected),
      marketplaceCommission: round2(marketplaceCommission),
      netEarnings: round2(netEarnings),
      settledEarnings: round2(settledEarnings),
      pendingSettlement: round2(pendingSettlement),
    },
    recentSubOrders: subOrders.slice(0, 10).map((o) => ({
      subOrderId: o.subOrderId,
      orderNumber: o.orderNumber,
      subtotal: o.subtotal,
      commissionAmount: o.commissionAmount,
      vendorPayout: o.vendorPayout,
      status: o.status,
      createdAt: o.createdAt,
    })),
  };
};
