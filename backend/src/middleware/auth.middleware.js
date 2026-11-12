import jwt from "jsonwebtoken";
import { RoleModel } from "../models/role.model.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "Authorization token missing or invalid.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_jwt_secret_change_in_production",
    );

    let roles = decoded.roles;
    if (!roles || !Array.isArray(roles)) {
      const dbRoles = await RoleModel.find({
        userId: decoded.userId,
        revokedAt: null,
      }).lean();
      roles = dbRoles.map((r) => r.roleType);
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      roles,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      status: 401,
      error: "Unauthorized",
      message: "Authorization token missing, invalid, or expired.",
    });
  }
};

export const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          status: 401,
          error: "Unauthorized",
          message: "Authentication required.",
        });
      }

      let userRoles = req.user.roles;
      if (!userRoles || !Array.isArray(userRoles) || userRoles.length === 0) {
        const dbRoles = await RoleModel.find({
          userId: req.user.userId,
          revokedAt: null,
        }).lean();
        userRoles = dbRoles.map((r) => r.roleType);
        req.user.roles = userRoles;
      }

      const hasPermission = userRoles.some((role) =>
        allowedRoles.includes(role),
      );

      if (!hasPermission) {
        return res.status(403).json({
          status: 403,
          error: "Forbidden",
          message: `Access denied. Requires one of the following roles: ${allowedRoles.join(", ")}`,
        });
      }

      next();
    } catch (err) {
      console.error("Authorization middleware error:", err);
      return res.status(500).json({
        status: 500,
        error: "Internal Server Error",
        message: "Authorization check encountered an internal error.",
      });
    }
  };
};

export default authenticate;
