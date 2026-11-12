import {
  placeOrder,
  getOrderHistory,
  getOrderById,
  trackOrder,
} from "../services/order.service.js";

export const createOrder = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await placeOrder(userId, req.body);
    const statusCode = result.isDuplicate ? 200 : 201;
    return res.status(statusCode).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        error: error.statusCode === 404 ? "Not Found" : "Bad Request",
        message: error.message,
      });
    }
    console.error("Place order error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred during order placement.",
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await getOrderHistory(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get order history error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve order history.",
    });
  }
};

export const getOrder = async (req, res) => {
  try {
    const { userId } = req.user;
    const { orderId } = req.params;
    const result = await getOrderById(userId, orderId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        status: 404,
        error: "Not Found",
        message: error.message,
      });
    }
    console.error("Get order error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve order details.",
    });
  }
};

export const getOrderTracking = async (req, res) => {
  try {
    const { userId } = req.user;
    const { orderId } = req.params;
    const result = await trackOrder(userId, orderId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        status: 404,
        error: "Not Found",
        message: error.message,
      });
    }
    console.error("Get order tracking error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve order tracking.",
    });
  }
};
