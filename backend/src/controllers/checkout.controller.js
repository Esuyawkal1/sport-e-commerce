import { placeOrder } from "../services/order.service.js";
import { handleStripeWebhook } from "../services/transaction.service.js";
import {
  initializeChapaPayment,
  verifyChapaTransaction,
} from "../services/chapa.service.js";

export const processCheckout = async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      cartId,
      shippingAddress,
      billingAddress,
      shippingMethod,
      paymentMethod,
      idempotencyKey,
      reservationId,
    } = req.body;

    const result = await placeOrder(userId, {
      cartId,
      shippingAddress,
      billingAddress,
      shippingMethod,
      paymentMethod,
      idempotencyKey,
      reservationId,
    });

    if (paymentMethod === "CHAPA") {
      const order = result.order;
      const txRef = `chapa_${order.orderId}_${Date.now()}`;
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const returnUrl = `${frontendUrl}/orders/${order.orderId}/confirmation?payment=chapa&tx_ref=${txRef}`;

      const rawName = (shippingAddress?.fullName || req.user.name || "Customer").trim();
      const nameParts = rawName.split(" ");
      const firstName = nameParts[0] || "Customer";
      const lastName = nameParts.slice(1).join(" ") || "Shopper";

      const chapaInit = await initializeChapaPayment({
        amount: order.totalAmount,
        currency: process.env.CHAPA_CURRENCY || "ETB",
        email: req.user.email || "customer@sportmarket.com",
        firstName,
        lastName,
        phone: shippingAddress?.phone || "0912192834",
        txRef,
        returnUrl,
        orderNumber: order.orderNumber,
      });

      const statusCode = result.isDuplicate ? 200 : 201;
      return res.status(statusCode).json({
        status: statusCode,
        message: chapaInit.checkoutUrl
          ? "Chapa payment session initiated. Redirecting to Chapa checkout..."
          : "Order placed. Note: Set CHAPA_SECRET_KEY in backend/.env to enable live Chapa checkout redirect.",
        ...result,
        checkoutUrl: chapaInit.checkoutUrl || null,
        chapaStatus: chapaInit,
      });
    }

    const statusCode = result.isDuplicate ? 200 : 201;
    return res.status(statusCode).json({
      status: statusCode,
      message: result.isDuplicate
        ? "Existing order returned via idempotency key."
        : "Order placed successfully across vendor packages.",
      ...result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        error: error.statusCode === 409 ? "Conflict" : "Bad Request",
        message: error.message,
      });
    }
    console.error("Process checkout error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred during checkout processing.",
    });
  }
};

export const createPaymentIntent = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await placeOrder(userId, req.body);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: error.message,
      });
    }
    console.error("Create payment intent error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to create payment intent.",
    });
  }
};

export const checkoutWebhook = async (req, res) => {
  try {
    const result = await handleStripeWebhook(req.body);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: error.message,
      });
    }
    console.error("Checkout webhook error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Error processing webhook event.",
    });
  }
};

export const verifyChapa = async (req, res) => {
  try {
    const txRef = req.params.txRef || req.body?.tx_ref;
    if (!txRef) {
      return res.status(400).json({
        status: 400,
        message: "Transaction reference (txRef) is required.",
      });
    }
    const result = await verifyChapaTransaction(txRef);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Verify Chapa error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Error verifying transaction with Chapa.",
    });
  }
};
