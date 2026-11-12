import { VendorProfileModel } from "../models/vendorProfile.model.js";

export const getPublicVendors = async ({ sport, isVerified } = {}) => {
  const filter = { isActive: true };

  if (isVerified !== undefined) {
    filter.isVerified = isVerified === "true" || isVerified === true;
  }

  if (sport) {
    filter.sportsSpecialization = sport.toLowerCase().trim();
  }

  const vendors = await VendorProfileModel.find(filter)
    .select(
      "vendorId storeName slug description sportsSpecialization logoUrl bannerUrl isVerified rating totalSalesCount -_id",
    )
    .lean();

  return { vendors };
};

export const getVendorBySlugOrId = async (identifier) => {
  const vendor = await VendorProfileModel.findOne({
    $or: [{ vendorId: identifier }, { slug: identifier.toLowerCase() }],
    isActive: true,
  })
    .select(
      "vendorId storeName slug description sportsSpecialization logoUrl bannerUrl contactEmail contactPhone businessAddress isVerified rating totalSalesCount createdAt -_id",
    )
    .lean();

  if (!vendor) {
    const error = new Error(`Vendor '${identifier}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  return { vendor };
};

export const getMyVendorProfile = async (userId) => {
  const profile = await VendorProfileModel.findOne({ userId }).lean();
  if (!profile) {
    const error = new Error("Vendor profile not found for this account.");
    error.statusCode = 404;
    throw error;
  }

  return { profile };
};

export const updateMyVendorProfile = async (userId, updateData) => {
  const profile = await VendorProfileModel.findOne({ userId });
  if (!profile) {
    const error = new Error("Vendor profile not found for this account.");
    error.statusCode = 404;
    throw error;
  }

  const allowedFields = [
    "description",
    "sportsSpecialization",
    "logoUrl",
    "bannerUrl",
    "contactPhone",
    "contactEmail",
    "businessAddress",
  ];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      profile[field] = updateData[field];
    }
  }

  await profile.save();
  return { profile };
};
