import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model.js";
import { RoleModel } from "../models/role.model.js";
import { VendorProfileModel } from "../models/vendorProfile.model.js";

const generateToken = (user, roles = []) => {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      roles: roles.map((r) => (typeof r === "string" ? r : r.roleType)),
    },
    process.env.JWT_SECRET || "dev_jwt_secret_change_in_production",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
};

export const registerUser = async ({
  email,
  password,
  firstName,
  lastName,
  phoneNumber,
  address,
  city,
  state,
  postalCode,
  country,
}) => {
  const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error(`Email address ${email} is already registered.`);
    error.statusCode = 400;
    throw error;
  }

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = await UserModel.create({
    email,
    passwordHash,
    firstName,
    lastName,
    phoneNumber: phoneNumber || null,
    address: address || null,
    city: city || null,
    state: state || null,
    postalCode: postalCode || null,
    country: country || null,
  });

  const role = await RoleModel.create({
    userId: user.userId,
    roleType: "CUSTOMER",
  });

  const token = generateToken(user, [role.roleType]);

  return {
    token,
    user: {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      address: user.address,
      city: user.city,
      state: user.state,
      postalCode: user.postalCode,
      country: user.country,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    role: {
      roleId: role.roleId,
      roleType: role.roleType,
      assignedAt: role.assignedAt,
    },
  };
};

export const registerSeller = async ({
  email,
  password,
  firstName,
  lastName,
  phoneNumber,
  storeName,
  description,
  sportsSpecialization = [],
  logoUrl,
  bannerUrl,
  contactEmail,
  contactPhone,
  businessAddress,
}) => {
  const normalizedEmail = email.toLowerCase();
  const existingUser = await UserModel.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error(`Email address ${email} is already registered.`);
    error.statusCode = 400;
    throw error;
  }

  if (!storeName || !storeName.trim()) {
    const error = new Error("Store name is required for seller registration.");
    error.statusCode = 400;
    throw error;
  }

  const slug = storeName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const existingStore = await VendorProfileModel.findOne({
    $or: [{ storeName: storeName.trim() }, { slug }],
  });
  if (existingStore) {
    const error = new Error(`Store name '${storeName}' is already taken.`);
    error.statusCode = 400;
    throw error;
  }

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = await UserModel.create({
    email: normalizedEmail,
    passwordHash,
    firstName,
    lastName,
    phoneNumber: phoneNumber || null,
  });

  const role = await RoleModel.create({
    userId: user.userId,
    roleType: "SELLER",
  });

  const vendorProfile = await VendorProfileModel.create({
    userId: user.userId,
    storeName: storeName.trim(),
    slug,
    description: description || null,
    sportsSpecialization: Array.isArray(sportsSpecialization)
      ? sportsSpecialization
      : [],
    logoUrl: logoUrl || null,
    bannerUrl: bannerUrl || null,
    contactEmail: (contactEmail || normalizedEmail).toLowerCase().trim(),
    contactPhone: contactPhone || phoneNumber || null,
    businessAddress: businessAddress || {},
    isVerified: false,
  });

  const token = generateToken(user, [role.roleType]);

  return {
    token,
    user: {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
    },
    role: {
      roleId: role.roleId,
      roleType: role.roleType,
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

export const loginUser = async ({ email, password }) => {
  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const roles = await RoleModel.find({ userId: user.userId, revokedAt: null });
  const roleTypes = roles.map((r) => r.roleType);

  let vendorProfile = null;
  if (roleTypes.includes("SELLER")) {
    vendorProfile = await VendorProfileModel.findOne({
      userId: user.userId,
    }).lean();
  }

  const token = generateToken(user, roleTypes);

  return {
    token,
    user: {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
    },
    roles: roles.map((r) => ({
      roleId: r.roleId,
      roleType: r.roleType,
      assignedAt: r.assignedAt,
    })),
    vendorProfile: vendorProfile
      ? {
          vendorId: vendorProfile.vendorId,
          storeName: vendorProfile.storeName,
          slug: vendorProfile.slug,
          isVerified: vendorProfile.isVerified,
        }
      : null,
  };
};

export const getMeUser = async (userId) => {
  const user = await UserModel.findOne({ userId }).select("-passwordHash -_id").lean();
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const roles = await RoleModel.find({ userId, revokedAt: null }).lean();
  const roleTypes = roles.map((r) => r.roleType);

  let vendorProfile = null;
  if (roleTypes.includes("SELLER")) {
    vendorProfile = await VendorProfileModel.findOne({ userId }).lean();
  }

  return {
    user,
    roles: roles.map((r) => ({ roleType: r.roleType })),
    vendorProfile,
  };
};
