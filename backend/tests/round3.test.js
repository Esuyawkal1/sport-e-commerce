import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateVendorShipping,
  calculateCartShipping,
  SHIPPING_RATES,
} from "../src/services/shipping.service.js";
import { validateAndCalculateCoupon } from "../src/services/coupon.service.js";
import { CartModel } from "../src/models/cart.model.js";
import { ReservationModel } from "../src/models/reservation.model.js";
import { CouponModel } from "../src/models/coupon.model.js";

test("Round 3: Shipping Engine calculates standard parcels with additional item fees", () => {
  // Single standard item
  const singleItem = [
    {
      lineTotal: 40.0,
      quantity: 1,
      variant: { weightKg: 0.4 },
      product: { isBulky: false },
    },
  ];

  const result1 = calculateVendorShipping(singleItem);
  assert.equal(result1.shippingFee, 5.99);
  assert.equal(result1.isBulky, false);
  assert.equal(result1.shippingMethod, "STANDARD_GROUND");

  // Two standard items from same vendor
  const multipleItems = [
    {
      lineTotal: 40.0,
      quantity: 1,
      variant: { weightKg: 0.4 },
      product: { isBulky: false },
    },
    {
      lineTotal: 25.0,
      quantity: 1,
      variant: { weightKg: 0.3 },
      product: { isBulky: false },
    },
  ];

  const result2 = calculateVendorShipping(multipleItems);
  // Base 5.99 + (2 - 1) * 1.50 = 7.49
  assert.equal(result2.shippingFee, 7.49);
  assert.equal(result2.isBulky, false);
});

test("Round 3: Shipping Engine grants free standard shipping above threshold ($99)", () => {
  const highValueStandard = [
    {
      lineTotal: 120.0,
      quantity: 1,
      variant: { weightKg: 0.5 },
      product: { isBulky: false },
    },
  ];

  const result = calculateVendorShipping(highValueStandard);
  assert.equal(result.shippingFee, 0.0);
  assert.equal(result.shippingMethod, "FREE_STANDARD_QUALIFIED");
});

test("Round 3: Shipping Engine applies heavy freight rates for bulky sports equipment", () => {
  // 20kg Olympic Barbell: isBulky: true, weight: 20kg
  const bulkyBarbell = [
    {
      lineTotal: 349.0,
      quantity: 1,
      variant: { weightKg: 20.0 },
      product: { isBulky: true },
    },
  ];

  const result = calculateVendorShipping(bulkyBarbell);
  // Bulky base 29.99 + (20kg - 10kg) * 1.25 = 29.99 + 12.50 = 42.49
  assert.equal(result.isBulky, true);
  assert.equal(result.shippingFee, 42.49);
  assert.equal(result.shippingMethod, "HEAVY_FREIGHT_CARRIER");
});

test("Round 3: Multi-vendor shipping combines separate vendor warehouses", () => {
  const vendorGroups = [
    {
      sellerId: "vendor-procourt",
      storeName: "ProCourt Sports",
      subtotal: 150.0, // Qualifies for free standard shipping
      items: [
        {
          lineTotal: 150.0,
          quantity: 1,
          variant: { weightKg: 0.3 },
          product: { isBulky: false },
        },
      ],
    },
    {
      sellerId: "vendor-irongrip",
      storeName: "IronGrip Strength",
      subtotal: 349.0, // Bulky freight item
      items: [
        {
          lineTotal: 349.0,
          quantity: 1,
          variant: { weightKg: 20.0 },
          product: { isBulky: true },
        },
      ],
    },
  ];

  const result = calculateCartShipping(vendorGroups);
  // Vendor 1: $0.00 (free standard). Vendor 2: $42.49 (bulky freight)
  assert.equal(result.totalShipping, 42.49);
  assert.equal(result.breakdown.length, 2);
  assert.equal(result.breakdown[0].shippingFee, 0);
  assert.equal(result.breakdown[1].shippingFee, 42.49);
});

test("Round 3: Coupon and Reservation Models have all required schema properties", () => {
  const cartPaths = CartModel.schema.paths;
  assert.ok(cartPaths.shippingAmount, "CartModel should track shippingAmount");
  assert.ok(cartPaths.couponCode, "CartModel should track couponCode");
  assert.ok(cartPaths.discountAmount, "CartModel should track discountAmount");

  const resPaths = ReservationModel.schema.paths;
  assert.ok(resPaths.reservationId, "ReservationModel should have reservationId");
  assert.ok(resPaths.status, "ReservationModel should have status");
  assert.ok(resPaths.expiresAt, "ReservationModel should have expiresAt");

  const couponPaths = CouponModel.schema.paths;
  assert.ok(couponPaths.code, "CouponModel should have code");
  assert.ok(couponPaths.discountType, "CouponModel should have discountType");
  assert.ok(couponPaths.discountValue, "CouponModel should have discountValue");
});
