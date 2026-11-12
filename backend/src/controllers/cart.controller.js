import {
  getActiveCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  applyCoupon,
  removeCoupon,
} from "../services/cart.service.js";
import {
  createStockReservation,
  releaseStockReservation,
} from "../services/reservation.service.js";

export const getCart = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await getActiveCart(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get cart error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to fetch active shopping cart.",
    });
  }
};

export const addItem = async (req, res) => {
  try {
    const { userId } = req.user;
    const { variantId, quantity } = req.body;

    if (!variantId || !quantity || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message:
          "variantId (string) and quantity (integer >= 1) are required.",
      });
    }

    const result = await addItemToCart(userId, { variantId, quantity });
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: error.message,
      });
    }
    console.error("Add to cart error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Unable to add item to shopping cart.",
    });
  }
};

export const updateItem = async (req, res) => {
  try {
    const { userId } = req.user;
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "quantity must be a positive integer greater than 0.",
      });
    }

    const result = await updateCartItemQuantity(userId, cartItemId, {
      quantity,
    });
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        error: error.statusCode === 404 ? "Not Found" : "Bad Request",
        message: error.message,
      });
    }
    console.error("Update cart item error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Unable to update cart item quantity.",
    });
  }
};

export const removeItem = async (req, res) => {
  try {
    const { userId } = req.user;
    const { cartItemId } = req.params;

    const result = await removeCartItem(userId, cartItemId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 400) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        error: error.statusCode === 404 ? "Not Found" : "Bad Request",
        message: error.message,
      });
    }
    console.error("Remove cart item error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Unable to remove item from shopping cart.",
    });
  }
};

export const handleApplyCoupon = async (req, res) => {
  try {
    const { userId } = req.user;
    const { code } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "Coupon code is required and must be a string.",
      });
    }

    const result = await applyCoupon(userId, code);
    return res.status(200).json({
      status: 200,
      message: `Coupon '${code.toUpperCase()}' applied successfully.`,
      cart: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        error: error.statusCode === 404 ? "Not Found" : "Bad Request",
        message: error.message,
      });
    }
    console.error("Apply coupon error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to apply coupon to cart.",
    });
  }
};

export const handleRemoveCoupon = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await removeCoupon(userId);
    return res.status(200).json({
      status: 200,
      message: "Coupon removed successfully.",
      cart: result,
    });
  } catch (error) {
    console.error("Remove coupon error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to remove coupon from cart.",
    });
  }
};

export const handleCreateReservation = async (req, res) => {
  try {
    const { userId } = req.user;
    const { cartId, durationMinutes } = req.body;

    if (!cartId) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "cartId is required to reserve inventory.",
      });
    }

    const result = await createStockReservation({
      userId,
      cartId,
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 15,
    });

    return res.status(201).json({
      status: 201,
      message: "Inventory temporarily reserved for checkout.",
      reservation: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        error: error.statusCode === 409 ? "Conflict" : "Bad Request",
        message: error.message,
      });
    }
    console.error("Create reservation error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to reserve stock.",
    });
  }
};

export const handleReleaseReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const result = await releaseStockReservation(reservationId);
    return res.status(200).json({
      status: 200,
      ...result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        error: error.statusCode === 404 ? "Not Found" : "Bad Request",
        message: error.message,
      });
    }
    console.error("Release reservation error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to release stock reservation.",
    });
  }
};
