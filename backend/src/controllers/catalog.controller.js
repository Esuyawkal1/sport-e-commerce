import {
  listCategories,
  listProducts,
  getProductDetails,
  getCatalogFacets,
} from "../services/catalog.service.js";

export const getCategories = async (req, res) => {
  try {
    const { isActive, parentCategoryId } = req.query;
    const result = await listCategories({ isActive, parentCategoryId });
    return res.status(200).json(result);
  } catch (error) {
    console.error("List categories error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve category catalog.",
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    const {
      search,
      categoryId,
      slug,
      sport,
      gearCategory,
      brand,
      skillLevel,
      isBulky,
      sellerId,
      minPrice,
      maxPrice,
      inStockOnly,
      sort,
      page,
      limit,
    } = req.query;

    if (
      page !== undefined &&
      (isNaN(parseInt(page, 10)) || parseInt(page, 10) < 1)
    ) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "Invalid query parameter page.",
      });
    }

    if (
      limit !== undefined &&
      (isNaN(parseInt(limit, 10)) || parseInt(limit, 10) < 1)
    ) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "Invalid query parameter limit.",
      });
    }

    const result = await listProducts({
      search,
      categoryId,
      slug,
      sport,
      gearCategory,
      brand,
      skillLevel,
      isBulky,
      sellerId,
      minPrice,
      maxPrice,
      inStockOnly,
      sort,
      page,
      limit,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("List products error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve products list.",
    });
  }
};

export const getFacets = async (req, res) => {
  try {
    const { categoryId, sport } = req.query;
    const result = await getCatalogFacets({ categoryId, sport });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get facets error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve catalog facets.",
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!productId || !uuidRegex.test(productId)) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "Invalid or malformed product ID format.",
      });
    }

    const result = await getProductDetails(productId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        status: 404,
        error: "Not Found",
        message: error.message,
      });
    }
    console.error("Get product by id error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while retrieving product details.",
    });
  }
};
