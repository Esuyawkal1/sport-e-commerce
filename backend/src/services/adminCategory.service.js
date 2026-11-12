import { CategoryModel } from "../models/category.model.js";
import { ProductModel } from "../models/product.model.js";

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export const createCategory = async ({
  name,
  description,
  slug,
  parentCategoryId,
  iconUrl,
  imageUrl,
  displayOrder = 0,
  metadata = {},
}) => {
  if (!name || !name.trim()) {
    const error = new Error("Category name is required.");
    error.statusCode = 400;
    throw error;
  }

  const categorySlug = (slug && slug.trim() ? slug : generateSlug(name))
    .toLowerCase()
    .trim();

  const existingCategory = await CategoryModel.findOne({
    $or: [{ name: name.trim() }, { slug: categorySlug }],
  });

  if (existingCategory) {
    const error = new Error(
      `Category with name '${name}' or slug '${categorySlug}' already exists.`,
    );
    error.statusCode = 409;
    throw error;
  }

  if (parentCategoryId) {
    const parent = await CategoryModel.findOne({ categoryId: parentCategoryId });
    if (!parent) {
      const error = new Error(
        `Parent category '${parentCategoryId}' does not exist.`,
      );
      error.statusCode = 404;
      throw error;
    }
  }

  const category = await CategoryModel.create({
    name: name.trim(),
    description: description ? description.trim() : null,
    slug: categorySlug,
    parentCategoryId: parentCategoryId || null,
    iconUrl: iconUrl || null,
    imageUrl: imageUrl || null,
    displayOrder: parseInt(displayOrder, 10) || 0,
    metadata: metadata || {},
    isActive: true,
  });

  return {
    categoryId: category.categoryId,
    name: category.name,
    description: category.description,
    slug: category.slug,
    parentCategoryId: category.parentCategoryId,
    iconUrl: category.iconUrl,
    imageUrl: category.imageUrl,
    displayOrder: category.displayOrder,
    metadata: category.metadata,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
};

export const updateCategory = async (categoryId, updateData) => {
  const category = await CategoryModel.findOne({ categoryId });
  if (!category) {
    const error = new Error(`Category '${categoryId}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (updateData.name && updateData.name.trim() !== category.name) {
    const duplicate = await CategoryModel.findOne({
      name: updateData.name.trim(),
      categoryId: { $ne: categoryId },
    });
    if (duplicate) {
      const error = new Error(
        `Category with name '${updateData.name}' already exists.`,
      );
      error.statusCode = 409;
      throw error;
    }
    category.name = updateData.name.trim();
  }

  if (updateData.slug) {
    const newSlug = updateData.slug.toLowerCase().trim();
    if (newSlug !== category.slug) {
      const duplicateSlug = await CategoryModel.findOne({
        slug: newSlug,
        categoryId: { $ne: categoryId },
      });
      if (duplicateSlug) {
        const error = new Error(
          `Category slug '${newSlug}' is already in use.`,
        );
        error.statusCode = 409;
        throw error;
      }
      category.slug = newSlug;
    }
  }

  if (updateData.parentCategoryId !== undefined) {
    if (updateData.parentCategoryId === categoryId) {
      const error = new Error("A category cannot be its own parent.");
      error.statusCode = 400;
      throw error;
    }
    if (updateData.parentCategoryId !== null) {
      const parent = await CategoryModel.findOne({
        categoryId: updateData.parentCategoryId,
      });
      if (!parent) {
        const error = new Error("Parent category not found.");
        error.statusCode = 404;
        throw error;
      }
    }
    category.parentCategoryId = updateData.parentCategoryId;
  }

  if (updateData.description !== undefined) {
    category.description = updateData.description;
  }
  if (updateData.iconUrl !== undefined) {
    category.iconUrl = updateData.iconUrl;
  }
  if (updateData.imageUrl !== undefined) {
    category.imageUrl = updateData.imageUrl;
  }
  if (updateData.displayOrder !== undefined) {
    category.displayOrder = parseInt(updateData.displayOrder, 10) || 0;
  }
  if (updateData.isActive !== undefined) {
    category.isActive = Boolean(updateData.isActive);
  }
  if (updateData.metadata !== undefined) {
    category.metadata = updateData.metadata;
  }

  await category.save();

  return category;
};

export const deleteCategory = async (categoryId, { hardDelete = false } = {}) => {
  const category = await CategoryModel.findOne({ categoryId });
  if (!category) {
    const error = new Error(`Category '${categoryId}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  const childCategoriesCount = await CategoryModel.countDocuments({
    parentCategoryId: categoryId,
  });
  if (childCategoriesCount > 0) {
    const error = new Error(
      "Cannot delete category that contains subcategories. Reassign or remove subcategories first.",
    );
    error.statusCode = 400;
    throw error;
  }

  const productsCount = await ProductModel.countDocuments({ categoryId });
  if (productsCount > 0 && hardDelete) {
    const error = new Error(
      `Cannot hard delete category with ${productsCount} existing products. Deactivate it instead.`,
    );
    error.statusCode = 400;
    throw error;
  }

  if (hardDelete && productsCount === 0) {
    await CategoryModel.deleteOne({ categoryId });
    return {
      message: `Category '${category.name}' permanently deleted.`,
      deleted: true,
      categoryId,
    };
  }

  category.isActive = false;
  await category.save();

  return {
    message: `Category '${category.name}' deactivated successfully.`,
    deactivated: true,
    categoryId,
  };
};

export const listAdminCategories = async () => {
  const categories = await CategoryModel.find()
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  return { categories };
};
