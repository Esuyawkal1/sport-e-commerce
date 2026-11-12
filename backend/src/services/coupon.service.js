import { CouponModel } from "../models/coupon.model.js";

const round2 = (num) => Math.round(num * 100) / 100;

export const validateAndCalculateCoupon = async ({
  code,
  subtotalAmount,
  shippingAmount,
  cartSports = [],
}) => {
  if (!code || !code.trim()) {
    const error = new Error("Coupon code is required.");
    error.statusCode = 400;
    throw error;
  }

  const normalizedCode = code.toUpperCase().trim();
  const coupon = await CouponModel.findOne({
    code: normalizedCode,
    isActive: true,
  }).lean();

  if (!coupon) {
    const error = new Error(`Coupon '${code}' is invalid or has expired.`);
    error.statusCode = 404;
    throw error;
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    const error = new Error(`Coupon '${code}' has expired.`);
    error.statusCode = 400;
    throw error;
  }

  if (coupon.minOrderAmount && subtotalAmount < coupon.minOrderAmount) {
    const error = new Error(
      `Coupon '${code}' requires a minimum subtotal of $${coupon.minOrderAmount.toFixed(2)}.`,
    );
    error.statusCode = 400;
    throw error;
  }

  if (coupon.applicableSports && coupon.applicableSports.length > 0) {
    const matchesSport = cartSports.some((sport) =>
      coupon.applicableSports.includes(sport.toLowerCase()),
    );
    if (!matchesSport) {
      const error = new Error(
        `Coupon '${code}' is only valid for: ${coupon.applicableSports.join(", ")}.`,
      );
      error.statusCode = 400;
      throw error;
    }
  }

  let discountAmount = 0;

  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = (subtotalAmount * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else if (coupon.discountType === "FIXED") {
    discountAmount = Math.min(subtotalAmount, coupon.discountValue);
  } else if (coupon.discountType === "FREE_SHIPPING") {
    discountAmount = shippingAmount;
  }

  discountAmount = round2(discountAmount);

  return {
    couponId: coupon.couponId,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
  };
};

export const seedDefaultCoupons = async () => {
  const defaultCoupons = [
    {
      code: "SPORT10",
      description: "10% off sports gear across the marketplace",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderAmount: 50,
      maxDiscountAmount: 100,
    },
    {
      code: "FREESHIP",
      description: "Free standard ground delivery on your order",
      discountType: "FREE_SHIPPING",
      discountValue: 0,
      minOrderAmount: 30,
    },
    {
      code: "FITNESS25",
      description: "$25 off fitness and gym equipment orders over $150",
      discountType: "FIXED",
      discountValue: 25,
      minOrderAmount: 150,
      applicableSports: ["gym", "strength", "fitness", "crossfit"],
    },
  ];

  for (const c of defaultCoupons) {
    const exists = await CouponModel.findOne({ code: c.code });
    if (!exists) {
      await CouponModel.create(c);
    }
  }
};
