import { OrderModel } from "../models/order.model.js";
import { TransactionModel } from "../models/transaction.model.js";

/**
 * Chapa Payment Service
 * Documentation: https://developer.chapa.co/docs
 */

/**
 * Initializes a transaction with Chapa payment gateway.
 * Returns the hosted checkout URL where customer can pay via Telebirr, CBEBirr, Cards, etc.
 */
export const initializeChapaPayment = async ({
  amount,
  currency = "ETB",
  email,
  firstName,
  lastName,
  phone,
  txRef,
  callbackUrl,
  returnUrl,
  orderNumber,
}) => {
  const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
  if (
    !chapaSecretKey ||
    chapaSecretKey.trim() === "" ||
    chapaSecretKey.includes("PASTE_YOUR_")
  ) {
    return {
      success: false,
      isConfigured: false,
      message:
        "CHAPA_SECRET_KEY is not configured in backend/.env. Please paste your secret key from dashboard.chapa.co.",
      checkoutUrl: null,
    };
  }

  try {
    const payload = {
      amount: String(amount),
      currency: currency || process.env.CHAPA_CURRENCY || "ETB",
      email: email || "customer@sportmarket.com",
      first_name: firstName || "Customer",
      last_name: lastName || "Shopper",
      phone_number: phone || "0912192834",
      tx_ref: txRef,
      callback_url: callbackUrl || undefined,
      return_url: returnUrl,
      "customization[title]": "SportMarket Order",
      "customization[description]": `Payment for order ${orderNumber || txRef}`,
    };

    const response = await fetch(
      "https://api.chapa.co/v1/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${chapaSecretKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (response.ok && data.status === "success" && data.data?.checkout_url) {
      return {
        success: true,
        isConfigured: true,
        checkoutUrl: data.data.checkout_url,
        data: data.data,
      };
    }

    return {
      success: false,
      isConfigured: true,
      message:
        data.message || "Failed to initialize payment transaction with Chapa.",
      data,
    };
  } catch (error) {
    console.error("Chapa initialize error:", error);
    return {
      success: false,
      isConfigured: true,
      message: error.message || "Network error connecting to Chapa API.",
    };
  }
};

/**
 * Verifies a transaction status with Chapa and updates the order status.
 */
export const verifyChapaTransaction = async (txRef) => {
  const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
  if (!chapaSecretKey || chapaSecretKey.trim() === "") {
    return {
      success: false,
      isConfigured: false,
      message: "CHAPA_SECRET_KEY is not set in backend/.env.",
    };
  }

  try {
    const response = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${txRef}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${chapaSecretKey.trim()}`,
        },
      },
    );

    const data = await response.json();

    if (response.ok && data.status === "success") {
      // Find and update order if txRef has orderId
      // txRef format: chapa_<orderId>_<timestamp>
      const parts = txRef.split("_");
      const orderId = parts[1];
      if (orderId) {
        await OrderModel.updateOne(
          { orderId },
          { paymentStatus: "PAID", orderStatus: "PROCESSING" },
        );
        await TransactionModel.updateOne(
          { orderId },
          { transactionStatus: "COMPLETED" },
        );
      }

      return {
        success: true,
        data: data.data,
      };
    }

    return {
      success: false,
      message: data.message || "Chapa payment verification failed.",
      data,
    };
  } catch (error) {
    console.error("Chapa verify error:", error);
    return {
      success: false,
      message: error.message || "Error verifying transaction with Chapa.",
    };
  }
};
