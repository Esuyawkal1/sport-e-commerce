import {
  getVendorOrders,
  getVendorSubOrderById,
  updateVendorSubOrderStatus,
  getVendorFinancialSettlement,
} from "../services/settlement.service.js";

export const handleGetVendorOrders = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { status, page, limit } = req.query;

    const result = await getVendorOrders(sellerId, { status, page, limit });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get vendor orders error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve vendor orders.",
    });
  }
};

export const handleGetVendorSubOrderById = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { subOrderId } = req.params;

    const result = await getVendorSubOrderById(sellerId, subOrderId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        error: error.statusCode === 404 ? "Not Found" : "Forbidden",
        message: error.message,
      });
    }
    console.error("Get vendor sub-order error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve sub-order details.",
    });
  }
};

export const handleUpdateSubOrderStatus = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { subOrderId } = req.params;

    const result = await updateVendorSubOrderStatus(
      sellerId,
      subOrderId,
      req.body,
    );
    return res.status(200).json({
      status: 200,
      message: "Sub-order status updated successfully.",
      ...result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        error:
          error.statusCode === 404
            ? "Not Found"
            : error.statusCode === 403
              ? "Forbidden"
              : "Bad Request",
        message: error.message,
      });
    }
    console.error("Update sub-order status error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to update sub-order status.",
    });
  }
};

export const handleGetVendorSettlement = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const result = await getVendorFinancialSettlement(sellerId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get vendor settlement error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve vendor financial settlement.",
    });
  }
};
