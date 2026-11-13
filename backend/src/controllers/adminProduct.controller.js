import {
  listAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  adjustAdminInventory,
} from "../services/adminProduct.service.js";

export const handleListAdminProducts = async (req, res) => {
  try {
    const { page, limit, search, categoryId, gearCategory, isActive, sort } = req.query;
    const result = await listAdminProducts({
      page,
      limit,
      search,
      categoryId,
      gearCategory,
      isActive,
      sort,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Admin list products error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve products list.",
    });
  }
};

export const handleGetAdminProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await getAdminProductById(productId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        error: error.statusCode === 404 ? "Not Found" : "Bad Request",
        message: error.message,
      });
    }
    console.error("Admin get product by id error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve product details.",
    });
  }
};

export const handleCreateAdminProduct = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const result = await createAdminProduct(req.body, adminId);
    return res.status(201).json({
      status: 201,
      message: "Product created successfully.",
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
    console.error("Admin create product error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while creating product.",
    });
  }
};

export const handleUpdateAdminProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await updateAdminProduct(productId, req.body);
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
            : error.statusCode === 409
              ? "Conflict"
              : "Bad Request",
        message: error.message,
      });
    }
    console.error("Admin update product error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while updating product.",
    });
  }
};

export const handleDeleteAdminProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const hard = req.query.hard === "true";
    const result = await deleteAdminProduct(productId, { hard });
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
    console.error("Admin delete product error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while deleting product.",
    });
  }
};

export const handleAdjustAdminInventory = async (req, res) => {
  try {
    const { variantId } = req.params;
    const result = await adjustAdminInventory(variantId, req.body);
    return res.status(200).json({
      status: 200,
      message: "Inventory updated successfully.",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        error: error.statusCode === 404 ? "Not Found" : "Bad Request",
        message: error.message,
      });
    }
    console.error("Admin adjust inventory error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while updating inventory.",
    });
  }
};
