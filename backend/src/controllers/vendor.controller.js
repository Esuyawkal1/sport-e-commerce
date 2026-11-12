import {
  getPublicVendors,
  getVendorBySlugOrId,
  getMyVendorProfile,
  updateMyVendorProfile,
} from "../services/vendor.service.js";

export const handleGetPublicVendors = async (req, res) => {
  try {
    const { sport, isVerified } = req.query;
    const result = await getPublicVendors({ sport, isVerified });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get vendors error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve vendors.",
    });
  }
};

export const handleGetVendorByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;
    const result = await getVendorBySlugOrId(identifier);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        status: 404,
        error: "Not Found",
        message: error.message,
      });
    }
    console.error("Get vendor error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve vendor.",
    });
  }
};

export const handleGetMyProfile = async (req, res) => {
  try {
    const result = await getMyVendorProfile(req.user.userId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        status: 404,
        error: "Not Found",
        message: error.message,
      });
    }
    console.error("Get my vendor profile error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve vendor profile.",
    });
  }
};

export const handleUpdateMyProfile = async (req, res) => {
  try {
    const result = await updateMyVendorProfile(req.user.userId, req.body);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        status: 404,
        error: "Not Found",
        message: error.message,
      });
    }
    console.error("Update my vendor profile error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to update vendor profile.",
    });
  }
};
