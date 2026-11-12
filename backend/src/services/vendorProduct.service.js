import { ProductModel } from "../models/product.model.js";
import { VariantModel } from "../models/variant.model.js";
import { InventoryModel } from "../models/inventory.model.js";
import { CategoryModel } from "../models/category.model.js";

export const createVendorProduct = async ({
  sellerId,
  categoryId,
  name,
  description,
  longDescription,
  basePrice,
  sku,
  sportType = [],
  gearCategory = "EQUIPMENT",
  brand,
  skillLevel = "ALL",
  genderAgeGroup = "UNISEX",
  isBulky = false,
  specifications = {},
  images = [],
  variants = [],
}) => {
  // 1. Verify category exists
  const category = await CategoryModel.findOne({ categoryId });
  if (!category) {
    const error = new Error(`Category '${categoryId}' does not exist.`);
    error.statusCode = 404;
    throw error;
  }

  // 2. Verify product SKU uniqueness
  const existingProduct = await ProductModel.findOne({ sku: sku.trim() });
  if (existingProduct) {
    const error = new Error(`Product SKU '${sku}' is already in use.`);
    error.statusCode = 409;
    throw error;
  }

  // 3. Verify variant SKUs uniqueness if provided
  if (Array.isArray(variants) && variants.length > 0) {
    const skus = variants.map((v) => v.sku?.trim()).filter(Boolean);
    const uniqueSkus = new Set(skus);
    if (uniqueSkus.size !== skus.length) {
      const error = new Error("Variant SKUs must be unique within the product.");
      error.statusCode = 400;
      throw error;
    }

    const existingVariants = await VariantModel.find({ sku: { $in: skus } });
    if (existingVariants.length > 0) {
      const error = new Error(
        `Variant SKU '${existingVariants[0].sku}' is already in use.`,
      );
      error.statusCode = 409;
      throw error;
    }
  }

  // 4. Create Product
  const product = await ProductModel.create({
    sellerId,
    categoryId,
    name: name.trim(),
    description: description ? description.trim() : null,
    longDescription: longDescription ? longDescription.trim() : null,
    basePrice: parseFloat(basePrice),
    sku: sku.trim(),
    sportType: Array.isArray(sportType) ? sportType : [sportType],
    gearCategory,
    brand: brand ? brand.trim() : null,
    skillLevel,
    genderAgeGroup,
    isBulky: Boolean(isBulky),
    specifications: specifications || {},
    images: Array.isArray(images) ? images : [],
    createdBy: sellerId,
  });

  // 5. Create Variants & Initial Inventory
  const createdVariants = [];
  const variantList =
    Array.isArray(variants) && variants.length > 0
      ? variants
      : [
          {
            variantName: "Standard",
            sku: `${sku.trim()}-STD`,
            price: basePrice,
            weightKg: isBulky ? 15 : 1,
            stock: 0,
          },
        ];

  for (const v of variantList) {
    const variant = await VariantModel.create({
      productId: product.productId,
      variantName: v.variantName?.trim() || "Standard",
      sku: (v.sku || `${product.sku}-${Date.now()}`).trim(),
      price: v.price !== undefined ? parseFloat(v.price) : product.basePrice,
      costPrice: v.costPrice !== undefined ? parseFloat(v.costPrice) : 0,
      weightKg: v.weightKg !== undefined ? parseFloat(v.weightKg) : 0,
      attributes: v.attributes || {},
    });

    const stock = Math.max(0, parseInt(v.stock, 10) || 0);
    const inventory = await InventoryModel.create({
      variantId: variant.variantId,
      quantityOnHand: stock,
      quantityReserved: 0,
      quantityAvailable: stock,
      reorderLevel: v.reorderLevel !== undefined ? parseInt(v.reorderLevel, 10) : 5,
      reorderQuantity:
        v.reorderQuantity !== undefined ? parseInt(v.reorderQuantity, 10) : 20,
      warehouseLocation: v.warehouseLocation || "DEFAULT-BAY",
    });

    createdVariants.push({
      ...variant.toObject(),
      inventory: {
        quantityOnHand: inventory.quantityOnHand,
        quantityAvailable: inventory.quantityAvailable,
        reorderLevel: inventory.reorderLevel,
        warehouseLocation: inventory.warehouseLocation,
      },
    });
  }

  return {
    ...product.toObject(),
    variants: createdVariants,
  };
};

export const getVendorProducts = async (
  sellerId,
  { page = 1, limit = 20, isActive } = {},
) => {
  const filter = { sellerId };

  if (isActive !== undefined) {
    filter.isActive = isActive === "true" || isActive === true;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ProductModel.countDocuments(filter),
  ]);

  const productIds = products.map((p) => p.productId);
  const variants = await VariantModel.find({
    productId: { $in: productIds },
  }).lean();

  const variantIds = variants.map((v) => v.variantId);
  const inventories = await InventoryModel.find({
    variantId: { $in: variantIds },
  }).lean();

  const inventoryMap = {};
  for (const inv of inventories) {
    inventoryMap[inv.variantId] = inv;
  }

  const variantsByProduct = {};
  for (const v of variants) {
    if (!variantsByProduct[v.productId]) {
      variantsByProduct[v.productId] = [];
    }
    variantsByProduct[v.productId].push({
      ...v,
      inventory: inventoryMap[v.variantId] || null,
    });
  }

  const productsWithVariants = products.map((p) => ({
    ...p,
    variants: variantsByProduct[p.productId] || [],
  }));

  return {
    products: productsWithVariants,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  };
};

export const getVendorProductById = async (sellerId, productId) => {
  const product = await ProductModel.findOne({ productId }).lean();

  if (!product) {
    const error = new Error(`Product '${productId}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (product.sellerId !== sellerId) {
    const error = new Error(
      "Access denied: You do not have permission to manage this product.",
    );
    error.statusCode = 403;
    throw error;
  }

  const variants = await VariantModel.find({ productId }).lean();
  const variantIds = variants.map((v) => v.variantId);
  const inventories = await InventoryModel.find({
    variantId: { $in: variantIds },
  }).lean();

  const inventoryMap = {};
  for (const inv of inventories) {
    inventoryMap[inv.variantId] = inv;
  }

  const variantsWithInventory = variants.map((v) => ({
    ...v,
    inventory: inventoryMap[v.variantId] || null,
  }));

  return {
    ...product,
    variants: variantsWithInventory,
  };
};

export const updateVendorProduct = async (sellerId, productId, updateData) => {
  const product = await ProductModel.findOne({ productId });

  if (!product) {
    const error = new Error(`Product '${productId}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (product.sellerId !== sellerId) {
    const error = new Error(
      "Access denied: You do not have permission to modify this product.",
    );
    error.statusCode = 403;
    throw error;
  }

  if (updateData.categoryId && updateData.categoryId !== product.categoryId) {
    const category = await CategoryModel.findOne({
      categoryId: updateData.categoryId,
    });
    if (!category) {
      const error = new Error(
        `Category '${updateData.categoryId}' does not exist.`,
      );
      error.statusCode = 404;
      throw error;
    }
    product.categoryId = updateData.categoryId;
  }

  if (updateData.sku && updateData.sku.trim() !== product.sku) {
    const duplicate = await ProductModel.findOne({
      sku: updateData.sku.trim(),
      productId: { $ne: productId },
    });
    if (duplicate) {
      const error = new Error(
        `Product SKU '${updateData.sku}' is already in use.`,
      );
      error.statusCode = 409;
      throw error;
    }
    product.sku = updateData.sku.trim();
  }

  const updatableFields = [
    "name",
    "description",
    "longDescription",
    "basePrice",
    "sportType",
    "gearCategory",
    "brand",
    "skillLevel",
    "genderAgeGroup",
    "isBulky",
    "specifications",
    "images",
    "isActive",
  ];

  for (const field of updatableFields) {
    if (updateData[field] !== undefined) {
      product[field] = updateData[field];
    }
  }

  await product.save();
  return product;
};

export const deleteVendorProduct = async (sellerId, productId) => {
  const product = await ProductModel.findOne({ productId });

  if (!product) {
    const error = new Error(`Product '${productId}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (product.sellerId !== sellerId) {
    const error = new Error(
      "Access denied: You do not have permission to delete this product.",
    );
    error.statusCode = 403;
    throw error;
  }

  product.isActive = false;
  await product.save();

  return {
    message: `Product '${product.name}' deactivated successfully.`,
    productId,
    isActive: false,
  };
};

export const adjustVendorInventory = async (
  sellerId,
  variantId,
  {
    quantityAdjustment,
    absoluteQuantity,
    reorderLevel,
    reorderQuantity,
    warehouseLocation,
  },
) => {
  const variant = await VariantModel.findOne({ variantId });
  if (!variant) {
    const error = new Error(`Variant '${variantId}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  const product = await ProductModel.findOne({ productId: variant.productId });
  if (!product || product.sellerId !== sellerId) {
    const error = new Error(
      "Access denied: You do not have permission to manage this variant's inventory.",
    );
    error.statusCode = 403;
    throw error;
  }

  let inventory = await InventoryModel.findOne({ variantId });
  if (!inventory) {
    inventory = new InventoryModel({
      variantId,
      quantityOnHand: 0,
      quantityReserved: 0,
      quantityAvailable: 0,
    });
  }

  if (absoluteQuantity !== undefined) {
    const newQty = parseInt(absoluteQuantity, 10);
    if (isNaN(newQty) || newQty < 0) {
      const error = new Error("absoluteQuantity must be a non-negative integer.");
      error.statusCode = 400;
      throw error;
    }
    inventory.quantityOnHand = newQty;
  } else if (quantityAdjustment !== undefined) {
    const delta = parseInt(quantityAdjustment, 10);
    if (isNaN(delta)) {
      const error = new Error("quantityAdjustment must be a valid integer.");
      error.statusCode = 400;
      throw error;
    }
    const newTotal = inventory.quantityOnHand + delta;
    if (newTotal < 0) {
      const error = new Error(
        `Insufficient stock: Cannot reduce quantityOnHand below 0 (current: ${inventory.quantityOnHand}).`,
      );
      error.statusCode = 400;
      throw error;
    }
    inventory.quantityOnHand = newTotal;
  }

  inventory.quantityAvailable = Math.max(
    0,
    inventory.quantityOnHand - (inventory.quantityReserved || 0),
  );

  if (reorderLevel !== undefined) {
    inventory.reorderLevel = Math.max(0, parseInt(reorderLevel, 10) || 0);
  }
  if (reorderQuantity !== undefined) {
    inventory.reorderQuantity = Math.max(0, parseInt(reorderQuantity, 10) || 0);
  }
  if (warehouseLocation !== undefined) {
    inventory.warehouseLocation = warehouseLocation ? warehouseLocation.trim() : null;
  }

  inventory.lastCountedAt = new Date();
  await inventory.save();

  return {
    variantId: variant.variantId,
    sku: variant.sku,
    variantName: variant.variantName,
    inventory: {
      quantityOnHand: inventory.quantityOnHand,
      quantityReserved: inventory.quantityReserved,
      quantityAvailable: inventory.quantityAvailable,
      reorderLevel: inventory.reorderLevel,
      reorderQuantity: inventory.reorderQuantity,
      warehouseLocation: inventory.warehouseLocation,
      lastCountedAt: inventory.lastCountedAt,
    },
  };
};
