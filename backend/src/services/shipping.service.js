const round2 = (num) => Math.round(num * 100) / 100;

export const SHIPPING_RATES = {
  STANDARD_BASE: 5.99,
  STANDARD_PER_ADDITIONAL_ITEM: 1.5,
  STANDARD_FREE_THRESHOLD: 99.0,
  BULKY_BASE_FREIGHT: 29.99,
  BULKY_WEIGHT_PER_KG_EXCESS: 1.25,
  BULKY_WEIGHT_THRESHOLD_KG: 10.0,
};

/**
 * Calculates shipping fee for a single vendor's items.
 */
export const calculateVendorShipping = (vendorItems, { hasFreeShippingCoupon = false } = {}) => {
  if (!vendorItems || vendorItems.length === 0) {
    return {
      shippingFee: 0,
      isBulky: false,
      totalWeightKg: 0,
      shippingMethod: "NONE",
    };
  }

  let totalWeightKg = 0;
  let totalQuantity = 0;
  let subtotal = 0;
  let hasBulkyItem = false;

  for (const item of vendorItems) {
    const qty = item.quantity || 1;
    totalQuantity += qty;
    subtotal += item.lineTotal || 0;

    const unitWeight = item.variant?.weightKg || item.product?.specifications?.weightKg || 0.5;
    totalWeightKg += unitWeight * qty;

    if (item.product?.isBulky || unitWeight >= SHIPPING_RATES.BULKY_WEIGHT_THRESHOLD_KG) {
      hasBulkyItem = true;
    }
  }

  totalWeightKg = round2(totalWeightKg);
  subtotal = round2(subtotal);

  if (hasBulkyItem) {
    // Bulky freight calculation
    const excessWeight = Math.max(0, totalWeightKg - SHIPPING_RATES.BULKY_WEIGHT_THRESHOLD_KG);
    const weightSurcharge = round2(excessWeight * SHIPPING_RATES.BULKY_WEIGHT_PER_KG_EXCESS);
    const shippingFee = round2(SHIPPING_RATES.BULKY_BASE_FREIGHT + weightSurcharge);

    return {
      shippingFee,
      isBulky: true,
      totalWeightKg,
      shippingMethod: "HEAVY_FREIGHT_CARRIER",
    };
  }

  // Standard parcel calculation
  if (hasFreeShippingCoupon || subtotal >= SHIPPING_RATES.STANDARD_FREE_THRESHOLD) {
    return {
      shippingFee: 0,
      isBulky: false,
      totalWeightKg,
      shippingMethod: subtotal >= SHIPPING_RATES.STANDARD_FREE_THRESHOLD
        ? "FREE_STANDARD_QUALIFIED"
        : "COUPON_FREE_STANDARD",
    };
  }

  const additionalItems = Math.max(0, totalQuantity - 1);
  const shippingFee = round2(
    SHIPPING_RATES.STANDARD_BASE + additionalItems * SHIPPING_RATES.STANDARD_PER_ADDITIONAL_ITEM,
  );

  return {
    shippingFee,
    isBulky: false,
    totalWeightKg,
    shippingMethod: "STANDARD_GROUND",
  };
};

/**
 * Calculates shipping breakdown for the entire cart.
 * Supports direct cart items array as well as legacy groupings.
 */
export const calculateCartShipping = (
  itemsOrGroups,
  { hasFreeShippingCoupon = false } = {},
) => {
  if (!itemsOrGroups || itemsOrGroups.length === 0) {
    return { totalShipping: 0, breakdown: [] };
  }

  const isGrouped = itemsOrGroups[0] && Array.isArray(itemsOrGroups[0].items);

  if (!isGrouped) {
    const shippingInfo = calculateVendorShipping(itemsOrGroups, {
      hasFreeShippingCoupon,
    });
    return {
      totalShipping: shippingInfo.shippingFee,
      breakdown: [
        {
          shippingFee: shippingInfo.shippingFee,
          isBulky: shippingInfo.isBulky,
          totalWeightKg: shippingInfo.totalWeightKg,
          shippingMethod: shippingInfo.shippingMethod,
        },
      ],
      ...shippingInfo,
    };
  }

  let totalShipping = 0;
  const breakdown = [];

  for (const group of itemsOrGroups) {
    const shippingInfo = calculateVendorShipping(group.items, {
      hasFreeShippingCoupon,
    });

    totalShipping += shippingInfo.shippingFee;
    breakdown.push({
      sellerId: group.sellerId,
      storeName: group.storeName,
      subtotal: group.subtotal,
      shippingFee: shippingInfo.shippingFee,
      isBulky: shippingInfo.isBulky,
      totalWeightKg: shippingInfo.totalWeightKg,
      shippingMethod: shippingInfo.shippingMethod,
    });
  }

  return {
    totalShipping: round2(totalShipping),
    breakdown,
  };
};
