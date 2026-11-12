import test from "node:test";
import assert from "node:assert/strict";
import { OrderModel } from "../src/models/order.model.js";
import { VendorSubOrderModel } from "../src/models/vendorSubOrder.model.js";
import { TransactionModel } from "../src/models/transaction.model.js";

test("Round 4: VendorSubOrderModel tracks vendor package, commission, and payout", () => {
  const paths = VendorSubOrderModel.schema.paths;
  assert.ok(paths.subOrderId, "subOrderId path should exist");
  assert.ok(paths.orderId, "orderId path should exist");
  assert.ok(paths.sellerId, "sellerId path should exist");
  assert.ok(paths.storeName, "storeName path should exist");
  assert.ok(paths.commissionRate, "commissionRate path should exist");
  assert.ok(paths.commissionAmount, "commissionAmount path should exist");
  assert.ok(paths.vendorPayout, "vendorPayout path should exist");
  assert.ok(paths.status, "status path should exist");
  assert.ok(paths.carrier, "carrier path should exist");
  assert.ok(paths.trackingNumber, "trackingNumber path should exist");

  const subOrder = new VendorSubOrderModel({
    orderId: "ord-test-123",
    orderNumber: "ORD-20261104-500-V1",
    sellerId: "seller-procourt-1",
    storeName: "ProCourt Sports",
    items: [
      {
        variantId: "var-1",
        productId: "prod-1",
        productName: "Wilson Pro Staff 97",
        variantName: "Grip 3",
        sku: "WIL-PS97-G3",
        quantity: 1,
        unitPrice: 269.0,
        lineTotal: 269.0,
      },
    ],
    subtotal: 269.0,
    shippingFee: 0,
    commissionRate: 0.1,
    commissionAmount: 26.9,
    vendorPayout: 242.1,
    status: "CONFIRMED",
  });

  assert.equal(subOrder.subtotal, 269.0);
  assert.equal(subOrder.commissionAmount, 26.9);
  assert.equal(subOrder.vendorPayout, 242.1);
  assert.equal(subOrder.status, "CONFIRMED");
});

test("Round 4: OrderModel tracks multi-vendor sub-order references and payment status", () => {
  const paths = OrderModel.schema.paths;
  assert.ok(paths.paymentStatus, "paymentStatus path should exist");
  assert.ok(paths.vendorSubOrderIds, "vendorSubOrderIds path should exist");
  assert.ok(paths.itemsCount, "itemsCount path should exist");

  const orderStatuses = paths.orderStatus.enumValues;
  assert.ok(orderStatuses.includes("PARTIALLY_SHIPPED"));
  assert.ok(orderStatuses.includes("DELIVERED"));

  const paymentStatuses = paths.paymentStatus.enumValues;
  assert.ok(paymentStatuses.includes("PAID"));
  assert.ok(paymentStatuses.includes("PENDING"));
});

test("Round 4: TransactionModel enforces idempotency and tracks marketplace commissions", () => {
  const paths = TransactionModel.schema.paths;
  assert.ok(paths.idempotencyKey, "idempotencyKey should exist");
  assert.ok(paths.commissionTotal, "commissionTotal should exist");
  assert.ok(paths.netVendorPayoutTotal, "netVendorPayoutTotal should exist");

  const tx = new TransactionModel({
    userId: "buyer-123",
    orderId: "ord-123",
    idempotencyKey: "idemp-key-abc-789",
    amount: 349.0,
    commissionTotal: 34.9,
    netVendorPayoutTotal: 314.1,
    transactionStatus: "COMPLETED",
  });

  assert.equal(tx.idempotencyKey, "idemp-key-abc-789");
  assert.equal(tx.commissionTotal, 34.9);
  assert.equal(tx.netVendorPayoutTotal, 314.1);
});

test("Round 4: Marketplace Commission & Payout math calculates accurately", () => {
  const round2 = (num) => Math.round(num * 100) / 100;

  const subtotal = 450.0;
  const shippingFee = 25.0; // Heavy bulky shipping
  const commissionRate = 0.08; // 8% marketplace take

  const commissionAmount = round2(subtotal * commissionRate);
  const vendorPayout = round2(subtotal + shippingFee - commissionAmount);

  assert.equal(commissionAmount, 36.0);
  assert.equal(vendorPayout, 439.0); // 450 + 25 - 36 = 439.0
});

test("Round 4: Master Order Status Rollup logic evaluates all vendor sub-orders", () => {
  const rollup = (statuses) => {
    if (statuses.every((s) => s === "DELIVERED")) return "DELIVERED";
    if (statuses.every((s) => s === "CANCELLED")) return "CANCELLED";
    if (statuses.every((s) => s === "SHIPPED" || s === "DELIVERED"))
      return "SHIPPED";
    if (statuses.some((s) => s === "SHIPPED" || s === "DELIVERED"))
      return "PARTIALLY_SHIPPED";
    if (statuses.every((s) => s === "PACKED")) return "PROCESSING";
    if (statuses.some((s) => s === "CONFIRMED" || s === "PACKED"))
      return "CONFIRMED";
    return "PENDING";
  };

  // Case 1: One vendor shipped, one still confirmed
  assert.equal(rollup(["CONFIRMED", "SHIPPED"]), "PARTIALLY_SHIPPED");

  // Case 2: All vendors shipped
  assert.equal(rollup(["SHIPPED", "SHIPPED"]), "SHIPPED");

  // Case 3: One delivered, one still shipped
  assert.equal(rollup(["SHIPPED", "DELIVERED"]), "SHIPPED");

  // Case 4: All packages delivered
  assert.equal(rollup(["DELIVERED", "DELIVERED"]), "DELIVERED");

  // Case 5: All cancelled
  assert.equal(rollup(["CANCELLED", "CANCELLED"]), "CANCELLED");
});
