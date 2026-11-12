import {
  createVendorProduct,
  getVendorProducts,
  getVendorProductById,
  updateVendorProduct,
  deleteVendorProduct,
  adjustVendorInventory,
} from "../services/vendorProduct.service.js";

export const handleCreateProduct = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const result = await createVendorProduct({
      ...req.body,
      sellerId,
    });

    return res.status(201).json({
      status: 201,
      message: "Product and variants created successfully.",
      product: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        error:
          error.statusCode === 409
            ? "Conflict"
            : error.statusCode === 404
              ? "Not Found"
              : "Bad Request",
        message: error.message,
      });
    }
    console.error("Vendor create product error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while creating product.",
    });
  }
};

export const handleGetMyProducts = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { page, limit, isActive } = req.query;

    const result = await getVendorProducts(sellerId, {
      page,
      limit,
      isActive,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Vendor list products error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve vendor products.",
    });
  }
};

export const handleGetProductById = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { productId } = req.params;

    const result = await getVendorProductById(sellerId, productId);
    return res.status(200).json(result);
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
    console.error("Vendor get product by id error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve product details.",
    });
  }
};

export const handleUpdateProduct = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { productId } = req.params;

    const result = await updateVendorProduct(sellerId, productId, req.body);
    return res.status(200).json({
      status: 200,
      message: "Product updated successfully.",
      product: result,
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
              : error.statusCode === 409
                ? "Conflict"
                : "Bad Request",
        message: error.message,
      });
    }
    console.error("Vendor update product error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while updating product.",
    });
  }
};

export const handleDeleteProduct = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { productId } = req.params;

    const result = await deleteVendorProduct(sellerId, productId);
    return res.status(200).json({
      status: 200,
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
    console.error("Vendor delete product error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while deleting product.",
    });
  }
};

export const handleAdjustInventory = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { variantId } = req.params;

    const result = await adjustVendorInventory(sellerId, variantId, req.body);
    return res.status(200).json({
      status: 200,
      message: "Inventory updated successfully.",
      data: result,
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
    console.error("Vendor adjust inventory error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while updating inventory.",
    });
  }
};
