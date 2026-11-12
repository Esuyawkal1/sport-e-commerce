import {
  processTransaction,
  handleStripeWebhook,
  getTransactionsByUser,
} from "../services/transaction.service.js";

export const createTransaction = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { orderId, amount, paymentMethod, transactionType, transactionStatus, referenceId, notes } = req.body;

    if (!orderId) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "orderId is required.",
      });
    }

    const result = await processTransaction({
      userId,
      orderId,
      amount,
      paymentMethod,
      transactionType,
      transactionStatus,
      referenceId,
      notes,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: error.message,
      });
    }
    if (error.statusCode === 404) {
      return res.status(404).json({
        status: 404,
        error: "Not Found",
        message: error.message,
      });
    }
    console.error("Process transaction error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while processing transaction.",
    });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await getTransactionsByUser(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get transactions error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve transaction history.",
    });
  }
};

export const handleWebhook = async (req, res) => {
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
    console.error("Stripe webhook processing error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Error processing webhook event and updating database state.",
    });
  }
};
