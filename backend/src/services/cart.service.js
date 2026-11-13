import { CartModel } from "../models/cart.model.js";
import { CartItemModel } from "../models/cartItem.model.js";
import { VariantModel } from "../models/variant.model.js";
import { ProductModel } from "../models/product.model.js";
import { InventoryModel } from "../models/inventory.model.js";
import {
  calculateVendorShipping,
  calculateCartShipping,
} from "./shipping.service.js";
import { validateAndCalculateCoupon } from "./coupon.service.js";

const TAX_RATE = 0.08;
const round2 = (num) => Math.round(num * 100) / 100;

export const buildEnrichedCart = async (cart) => {
  const cartItems = await CartItemModel.find({ cartId: cart.cartId })
    .select(
      "cartItemId cartId variantId quantity unitPrice lineTotal addedAt updatedAt -_id",
    )
    .lean();

  if (cartItems.length === 0) {
    return {
      cartId: cart.cartId,
      userId: cart.userId,
      totalItems: 0,
      subtotalAmount: 0,
      shippingAmount: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      couponCode: null,
      cartStatus: cart.cartStatus,
      items: [],
      vendorGroups: [],
      shippingBreakdown: [],
      updatedAt: cart.updatedAt,
    };
  }

  // Fetch variants, products, and vendor profiles
  const variantIds = cartItems.map((i) => i.variantId);
  const variants = await VariantModel.find({
    variantId: { $in: variantIds },
  }).lean();
  const variantMap = {};
  for (const v of variants) {
    variantMap[v.variantId] = v;
  }

  const productIds = [
    ...new Set(variants.map((v) => v.productId).filter(Boolean)),
  ];
  const products = await ProductModel.find({
    productId: { $in: productIds },
  }).lean();
  const productMap = {};
  for (const p of products) {
    productMap[p.productId] = p;
  }

  // Enrich cart items
  const enrichedItems = [];
  const allSports = new Set();

  for (const item of cartItems) {
    const variant = variantMap[item.variantId] || null;
    const product = variant ? productMap[variant.productId] : null;

    if (product?.sportType) {
      product.sportType.forEach((s) => allSports.add(s.toLowerCase()));
    }

    const enrichedItem = {
      cartItemId: item.cartItemId,
      cartId: item.cartId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      product: product
        ? {
            productId: product.productId,
            name: product.name,
            sku: product.sku,
            brand: product.brand,
            sportType: product.sportType,
            gearCategory: product.gearCategory,
            isBulky: product.isBulky,
            images: product.images,
          }
        : null,
      variant: variant
        ? {
            variantName: variant.variantName,
            sku: variant.sku,
            weightKg: variant.weightKg,
            attributes: variant.attributes,
          }
        : null,
      addedAt: item.addedAt,
      updatedAt: item.updatedAt,
    };

    enrichedItems.push(enrichedItem);
  }

  // Calculate totals and cart shipping
  let subtotalAmount = 0;
  let totalItems = 0;
  for (const item of cartItems) {
    totalItems += item.quantity;
    subtotalAmount += item.lineTotal;
  }
  subtotalAmount = round2(subtotalAmount);

  const isFreeShipCoupon = cart.couponCode === "FREESHIP";
  const { totalShipping, breakdown: shippingBreakdown } = calculateCartShipping(
    enrichedItems,
    { hasFreeShippingCoupon: isFreeShipCoupon },
  );

  const vendorGroups = [
    {
      sellerId: "STORE_DIRECT",
      storeName: "SportMarket Official",
      items: enrichedItems,
      subtotal: subtotalAmount,
      itemCount: totalItems,
      shippingFee: totalShipping,
    },
  ];

  // Calculate coupon discount if applied
  let discountAmount = 0;
  let appliedCoupon = null;
  if (cart.couponCode) {
    try {
      appliedCoupon = await validateAndCalculateCoupon({
        code: cart.couponCode,
        subtotalAmount,
        shippingAmount: totalShipping,
        cartSports: Array.from(allSports),
      });
      discountAmount = appliedCoupon.discountAmount;
    } catch (couponErr) {
      // Coupon is no longer eligible; remove it quietly
      await CartModel.updateOne(
        { cartId: cart.cartId },
        { couponCode: null, discountAmount: 0 },
      );
    }
  }

  const taxAmount = round2(subtotalAmount * TAX_RATE);
  const totalAmount = round2(
    Math.max(0, subtotalAmount + totalShipping + taxAmount - discountAmount),
  );

  // Persist recalculated values in CartModel
  await CartModel.updateOne(
    { cartId: cart.cartId },
    {
      totalItems,
      subtotalAmount,
      shippingAmount: totalShipping,
      taxAmount,
      discountAmount,
      totalAmount,
    },
  );

  return {
    cartId: cart.cartId,
    userId: cart.userId,
    totalItems,
    subtotalAmount,
    shippingAmount: totalShipping,
    taxAmount,
    discountAmount,
    totalAmount,
    couponCode: cart.couponCode,
    couponDetails: appliedCoupon,
    cartStatus: cart.cartStatus,
    items: enrichedItems,
    vendorGroups,
    shippingBreakdown,
    expiresAt: cart.expiresAt,
    updatedAt: new Date(),
  };
};

export const getActiveCart = async (userId) => {
  let cart = await CartModel.findOne({ userId, cartStatus: "ACTIVE" });

  if (!cart) {
    cart = await CartModel.create({ userId });
  }

  return await buildEnrichedCart(cart);
};

export const addItemToCart = async (userId, { variantId, quantity }) => {
  const variant = await VariantModel.findOne({ variantId }).lean();
  if (!variant) {
    const error = new Error("Variant not found.");
    error.statusCode = 400;
    throw error;
  }

  const inventory = await InventoryModel.findOne({ variantId }).lean();
  if (!inventory || inventory.quantityAvailable < quantity) {
    const error = new Error(
      "Requested quantity exceeds quantityAvailable in inventory.",
    );
    error.statusCode = 400;
    throw error;
  }

  let cart = await CartModel.findOne({ userId, cartStatus: "ACTIVE" });
  if (!cart) {
    cart = await CartModel.create({ userId });
  }

  let cartItem = await CartItemModel.findOne({
    cartId: cart.cartId,
    variantId,
  });

  if (cartItem) {
    const newQuantity = cartItem.quantity + quantity;
    if (inventory.quantityAvailable < newQuantity) {
      const error = new Error(
        "Requested quantity exceeds quantityAvailable in inventory.",
      );
      error.statusCode = 400;
      throw error;
    }
    cartItem.quantity = newQuantity;
    cartItem.lineTotal = round2(newQuantity * cartItem.unitPrice);
    cartItem.updatedAt = new Date();
    await cartItem.save();
  } else {
    cartItem = await CartItemModel.create({
      cartId: cart.cartId,
      variantId,
      quantity,
      unitPrice: variant.price,
      lineTotal: round2(quantity * variant.price),
      updatedAt: new Date(),
    });
  }

  const enrichedCart = await buildEnrichedCart(cart);

  return {
    cart: enrichedCart,
    addedItem: {
      cartItemId: cartItem.cartItemId,
      cartId: cartItem.cartId,
      variantId: cartItem.variantId,
      quantity: cartItem.quantity,
      unitPrice: cartItem.unitPrice,
      lineTotal: cartItem.lineTotal,
    },
  };
};

export const updateCartItemQuantity = async (
  userId,
  cartItemId,
  { quantity },
) => {
  const cart = await CartModel.findOne({ userId, cartStatus: "ACTIVE" });
  if (!cart) {
    const error = new Error("No active cart found.");
    error.statusCode = 400;
    throw error;
  }

  const cartItem = await CartItemModel.findOne({
    cartItemId,
    cartId: cart.cartId,
  });
  if (!cartItem) {
    const error = new Error(`Cart item with ID ${cartItemId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  const inventory = await InventoryModel.findOne({
    variantId: cartItem.variantId,
  }).lean();
  if (!inventory || inventory.quantityAvailable < quantity) {
    const error = new Error(
      "Requested quantity exceeds quantityAvailable in inventory.",
    );
    error.statusCode = 400;
    throw error;
  }

  cartItem.quantity = quantity;
  cartItem.lineTotal = round2(quantity * cartItem.unitPrice);
  cartItem.updatedAt = new Date();
  await cartItem.save();

  const enrichedCart = await buildEnrichedCart(cart);

  return {
    cart: enrichedCart,
    updatedItem: {
      cartItemId: cartItem.cartItemId,
      quantity: cartItem.quantity,
      unitPrice: cartItem.unitPrice,
      lineTotal: cartItem.lineTotal,
    },
  };
};

export const removeCartItem = async (userId, cartItemId) => {
  const cart = await CartModel.findOne({ userId, cartStatus: "ACTIVE" });
  if (!cart) {
    const error = new Error("No active cart found.");
    error.statusCode = 400;
    throw error;
  }

  const cartItem = await CartItemModel.findOneAndDelete({
    cartItemId,
    cartId: cart.cartId,
  });
  if (!cartItem) {
    const error = new Error(`Cart item with ID ${cartItemId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  const enrichedCart = await buildEnrichedCart(cart);

  return {
    success: true,
    message: "Cart item successfully removed.",
    cart: enrichedCart,
  };
};

export const applyCoupon = async (userId, code) => {
  const cart = await CartModel.findOne({ userId, cartStatus: "ACTIVE" });
  if (!cart) {
    const error = new Error("No active cart found.");
    error.statusCode = 404;
    throw error;
  }

  cart.couponCode = code.toUpperCase().trim();
  await cart.save();

  const enrichedCart = await buildEnrichedCart(cart);
  return enrichedCart;
};

export const removeCoupon = async (userId) => {
  const cart = await CartModel.findOne({ userId, cartStatus: "ACTIVE" });
  if (!cart) {
    const error = new Error("No active cart found.");
    error.statusCode = 404;
    throw error;
  }

  cart.couponCode = null;
  cart.discountAmount = 0;
  await cart.save();

  const enrichedCart = await buildEnrichedCart(cart);
  return enrichedCart;
};
