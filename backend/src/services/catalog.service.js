import { CategoryModel } from "../models/category.model.js";
import { ProductModel } from "../models/product.model.js";
import { VariantModel } from "../models/variant.model.js";
import { InventoryModel } from "../models/inventory.model.js";

const PRODUCT_SELECT_FIELDS =
  "productId categoryId sellerId name description longDescription basePrice sku sportType gearCategory brand skillLevel genderAgeGroup isBulky specifications images rating isActive createdAt updatedAt createdBy -_id";

export const listCategories = async ({ isActive, parentCategoryId } = {}) => {
  const filter = {};

  if (isActive !== undefined) {
    filter.isActive = isActive === "true" || isActive === true;
  }

  if (parentCategoryId !== undefined) {
    filter.parentCategoryId =
      parentCategoryId === "null" ? null : parentCategoryId;
  }

  const categories = await CategoryModel.find(filter)
    .select(
      "categoryId name description slug parentCategoryId iconUrl imageUrl displayOrder metadata isActive createdAt updatedAt -_id",
    )
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  return { categories };
};

export const listProducts = async ({
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
  sort = "newest",
  page = 1,
  limit = 10,
} = {}) => {
  const filter = { isActive: true };

  // Full-text search
  if (search && search.trim()) {
    filter.$text = { $search: search.trim() };
  }

  // Category filter (includes subcategories if parent category)
  if (categoryId) {
    const childCategories = await CategoryModel.find({
      parentCategoryId: categoryId,
    })
      .select("categoryId")
      .lean();
    if (childCategories && childCategories.length > 0) {
      filter.categoryId = {
        $in: [categoryId, ...childCategories.map((c) => c.categoryId)],
      };
    } else {
      filter.categoryId = categoryId;
    }
  }

  // SKU / Slug filter
  if (slug) {
    filter.sku = slug;
  }

  // Sport type filter (supports single or comma-separated sports)
  if (sport) {
    const sportsList = sport
      .split(",")
      .map((s) => s.toLowerCase().trim())
      .filter(Boolean);
    if (sportsList.length === 1) {
      filter.sportType = sportsList[0];
    } else if (sportsList.length > 1) {
      filter.sportType = { $in: sportsList };
    }
  }

  // Gear Category filter
  if (gearCategory) {
    const categoriesList = gearCategory
      .split(",")
      .map((c) => c.toUpperCase().trim())
      .filter(Boolean);
    if (categoriesList.length === 1) {
      filter.gearCategory = categoriesList[0];
    } else if (categoriesList.length > 1) {
      filter.gearCategory = { $in: categoriesList };
    }
  }

  // Brand filter
  if (brand) {
    const brandsList = brand
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);
    if (brandsList.length === 1) {
      filter.brand = new RegExp(`^${brandsList[0]}$`, "i");
    } else if (brandsList.length > 1) {
      filter.brand = {
        $in: brandsList.map((b) => new RegExp(`^${b}$`, "i")),
      };
    }
  }

  // Skill Level filter
  if (skillLevel) {
    const levelsList = skillLevel
      .split(",")
      .map((l) => l.toUpperCase().trim())
      .filter(Boolean);
    if (levelsList.length === 1) {
      filter.skillLevel = levelsList[0];
    } else if (levelsList.length > 1) {
      filter.skillLevel = { $in: levelsList };
    }
  }

  // Bulky freight filter
  if (isBulky !== undefined) {
    filter.isBulky = isBulky === "true" || isBulky === true;
  }

  // Seller filter
  if (sellerId) {
    filter.sellerId = sellerId;
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.basePrice = {};
    if (minPrice !== undefined && !isNaN(parseFloat(minPrice))) {
      filter.basePrice.$gte = parseFloat(minPrice);
    }
    if (maxPrice !== undefined && !isNaN(parseFloat(maxPrice))) {
      filter.basePrice.$lte = parseFloat(maxPrice);
    }
    if (Object.keys(filter.basePrice).length === 0) {
      delete filter.basePrice;
    }
  }

  // In-stock only filter
  if (inStockOnly === "true" || inStockOnly === true) {
    const availableInventory = await InventoryModel.find({
      quantityAvailable: { $gt: 0 },
    })
      .select("variantId -_id")
      .lean();
    const availableVariantIds = availableInventory.map((i) => i.variantId);

    const availableVariants = await VariantModel.find({
      variantId: { $in: availableVariantIds },
    })
      .select("productId -_id")
      .lean();
    const availableProductIds = [
      ...new Set(availableVariants.map((v) => v.productId)),
    ];

    filter.productId = { $in: availableProductIds };
  }

  // Sorting
  const sortMap = {
    price_asc: { basePrice: 1 },
    price_desc: { basePrice: -1 },
    rating_desc: { rating: -1 },
    newest: { createdAt: -1 },
  };
  const sortOrder = sortMap[sort] || sortMap.newest;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    ProductModel.find(filter)
      .select(PRODUCT_SELECT_FIELDS)
      .sort(sortOrder)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ProductModel.countDocuments(filter),
  ]);

  return {
    products,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  };
};

export const getCatalogFacets = async ({ categoryId, sport } = {}) => {
  const matchFilter = { isActive: true };

  if (categoryId) {
    matchFilter.categoryId = categoryId;
  }
  if (sport) {
    matchFilter.sportType = sport.toLowerCase().trim();
  }

  const [sportsAggregation, brandsAggregation, gearCategoryAggregation, priceStats] =
    await Promise.all([
      ProductModel.aggregate([
        { $match: matchFilter },
        { $unwind: "$sportType" },
        { $group: { _id: "$sportType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ProductModel.aggregate([
        { $match: { ...matchFilter, brand: { $ne: null } } },
        { $group: { _id: "$brand", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ProductModel.aggregate([
        { $match: matchFilter },
        { $group: { _id: "$gearCategory", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ProductModel.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            minPrice: { $min: "$basePrice" },
            maxPrice: { $max: "$basePrice" },
            totalProducts: { $sum: 1 },
          },
        },
      ]),
    ]);

  return {
    sports: sportsAggregation.map((s) => ({ sport: s._id, count: s.count })),
    brands: brandsAggregation.map((b) => ({ brand: b._id, count: b.count })),
    gearCategories: gearCategoryAggregation.map((g) => ({
      gearCategory: g._id,
      count: g.count,
    })),
    priceRange: priceStats.length
      ? {
          min: priceStats[0].minPrice || 0,
          max: priceStats[0].maxPrice || 0,
          total: priceStats[0].totalProducts || 0,
        }
      : { min: 0, max: 0, total: 0 },
  };
};

export const getProductDetails = async (productId) => {
  const product = await ProductModel.findOne({ productId })
    .select(PRODUCT_SELECT_FIELDS)
    .lean();

  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  const variants = await VariantModel.find({ productId })
    .select(
      "variantId productId variantName sku price costPrice weightKg attributes createdAt updatedAt -_id",
    )
    .lean();

  const variantIds = variants.map((v) => v.variantId);

  const inventoryRecords = await InventoryModel.find({
    variantId: { $in: variantIds },
  })
    .select(
      "inventoryId variantId quantityOnHand quantityReserved quantityAvailable reorderLevel reorderQuantity warehouseLocation -_id",
    )
    .lean();

  const inventoryMap = {};
  for (const inv of inventoryRecords) {
    inventoryMap[inv.variantId] = {
      inventoryId: inv.inventoryId,
      quantityOnHand: inv.quantityOnHand,
      quantityReserved: inv.quantityReserved,
      quantityAvailable: inv.quantityAvailable,
      reorderLevel: inv.reorderLevel,
      reorderQuantity: inv.reorderQuantity,
      warehouseLocation: inv.warehouseLocation,
    };
  }

  const variantsWithInventory = variants.map((variant) => ({
    ...variant,
    inventory: inventoryMap[variant.variantId] || null,
  }));

  return {
    ...product,
    variants: variantsWithInventory,
  };
};
