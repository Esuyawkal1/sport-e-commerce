import {
  createVendorByAdmin,
  assignVendorRoleByAdmin,
  listAllVendorsByAdmin,
} from "../services/adminVendor.service.js";

export const handleCreateVendor = async (req, res) => {
  try {
    const result = await createVendorByAdmin(req.body);
    return res.status(201).json({
      status: 201,
      message: "Vendor created successfully by admin.",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        error: error.statusCode === 400 ? "Bad Request" : "Conflict",
        message: error.message,
      });
    }
    console.error("Admin create vendor error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while creating vendor.",
    });
  }
};

export const handleAssignVendorRole = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "User ID is required to assign vendor role.",
      });
    }

    const result = await assignVendorRoleByAdmin(userId, req.body);
    return res.status(200).json({
      status: 200,
      message: "Vendor role and profile successfully assigned to user.",
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
    console.error("Admin assign vendor role error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while assigning vendor role.",
    });
  }
};

export const handleListAdminVendors = async (req, res) => {
  try {
    const result = await listAllVendorsByAdmin();
    return res.status(200).json({
      status: 200,
      ...result,
    });
  } catch (error) {
    console.error("Admin list vendors error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Failed to retrieve vendors.",
    });
  }
};
