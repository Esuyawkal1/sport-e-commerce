import { UserModel } from "../models/user.model.js";
import { RoleModel } from "../models/role.model.js";
import { VendorProfileModel } from "../models/vendorProfile.model.js";
import { registerSeller } from "./auth.service.js";

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

/**
 * Admin creates a new vendor from scratch.
 */
export const createVendorByAdmin = async (vendorData) => {
  const result = await registerSeller(vendorData);
  await VendorProfileModel.findOneAndUpdate(
    { vendorId: result.vendorProfile.vendorId },
    { isVerified: true },
  );
  result.vendorProfile.isVerified = true;
  return result;
};

/**
 * Admin assigns the SELLER (vendor) role to an existing registered customer.
 */
export const assignVendorRoleByAdmin = async (
  userId,
  {
    storeName,
    description,
    sportsSpecialization = [],
    logoUrl,
    bannerUrl,
    contactEmail,
    contactPhone,
    businessAddress,
    isVerified = true,
  },
) => {
  const user = await UserModel.findOne({ userId });
  if (!user) {
    const error = new Error(`User with ID '${userId}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (!storeName || !storeName.trim()) {
    const error = new Error("Store name is required to assign a vendor profile.");
    error.statusCode = 400;
    throw error;
  }

  const slug = generateSlug(storeName);

  const existingStore = await VendorProfileModel.findOne({
    $or: [{ storeName: storeName.trim() }, { slug }],
    userId: { $ne: userId },
  });
  if (existingStore) {
    const error = new Error(`Store name '${storeName}' is already taken.`);
    error.statusCode = 400;
    throw error;
  }

  let sellerRole = await RoleModel.findOne({ userId, roleType: "SELLER" });
  if (!sellerRole) {
    sellerRole = await RoleModel.create({
      userId,
      roleType: "SELLER",
    });
  }

  let vendorProfile = await VendorProfileModel.findOne({ userId });
  if (vendorProfile) {
    vendorProfile.storeName = storeName.trim();
    vendorProfile.slug = slug;
    if (description !== undefined) vendorProfile.description = description;
    if (sportsSpecialization) vendorProfile.sportsSpecialization = sportsSpecialization;
    if (logoUrl !== undefined) vendorProfile.logoUrl = logoUrl;
    if (bannerUrl !== undefined) vendorProfile.bannerUrl = bannerUrl;
    if (contactEmail) vendorProfile.contactEmail = contactEmail.toLowerCase().trim();
    if (contactPhone !== undefined) vendorProfile.contactPhone = contactPhone;
    if (businessAddress) vendorProfile.businessAddress = businessAddress;
    vendorProfile.isVerified = isVerified;
    await vendorProfile.save();
  } else {
    vendorProfile = await VendorProfileModel.create({
      userId,
      storeName: storeName.trim(),
      slug,
      description: description || null,
      sportsSpecialization: Array.isArray(sportsSpecialization) ? sportsSpecialization : [],
      logoUrl: logoUrl || null,
      bannerUrl: bannerUrl || null,
      contactEmail: (contactEmail || user.email).toLowerCase().trim(),
      contactPhone: contactPhone || user.phoneNumber || null,
      businessAddress: businessAddress || {},
      isVerified,
    });
  }

  return {
    user: {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    role: {
      roleId: sellerRole.roleId,
      roleType: sellerRole.roleType,
    },
    vendorProfile: {
      vendorId: vendorProfile.vendorId,
      storeName: vendorProfile.storeName,
      slug: vendorProfile.slug,
      sportsSpecialization: vendorProfile.sportsSpecialization,
      isVerified: vendorProfile.isVerified,
    },
  };
};

/**
 * Admin lists all registered vendors.
 */
export const listAllVendorsByAdmin = async () => {
  const vendors = await VendorProfileModel.find().lean();
  const enrichedVendors = await Promise.all(
    vendors.map(async (v) => {
      const user = await UserModel.findOne({ userId: v.userId })
        .select("userId email firstName lastName isActive")
        .lean();
      return {
        ...v,
        user: user || null,
      };
    }),
  );
  return { vendors: enrichedVendors };
};
