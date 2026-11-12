import {
  createCategory,
  updateCategory,
  deleteCategory,
  listAdminCategories,
} from "../services/adminCategory.service.js";

export const handleCreateCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      slug,
      parentCategoryId,
      iconUrl,
      imageUrl,
      displayOrder,
      metadata,
    } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "Category name is required and must be a string.",
      });
    }

    const category = await createCategory({
      name,
      description,
      slug,
      parentCategoryId,
      iconUrl,
      imageUrl,
      displayOrder,
      metadata,
    });

    return res.status(201).json({
      status: 201,
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        error: error.statusCode === 409 ? "Conflict" : "Bad Request",
        message: error.message,
      });
    }
    console.error("Admin create category error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while creating category.",
    });
  }
};

export const handleUpdateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await updateCategory(categoryId, req.body);

    return res.status(200).json({
      status: 200,
      message: "Category updated successfully.",
      category,
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
    console.error("Admin update category error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while updating category.",
    });
  }
};

export const handleDeleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const hardDelete = req.query.hard === "true";

    const result = await deleteCategory(categoryId, { hardDelete });
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
    console.error("Admin delete category error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while deleting category.",
    });
  }
};

export const handleListAdminCategories = async (req, res) => {
  try {
    const result = await listAdminCategories();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Admin list categories error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve admin categories.",
    });
  }
};
