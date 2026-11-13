import {
  registerUser,
  loginUser,
  getMeUser,
} from "../services/auth.service.js";

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message:
          "Missing required fields: email, password, firstName, and lastName are required.",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "Password must be at least 8 characters long.",
      });
    }

    const result = await registerUser(req.body);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: error.message,
      });
    }
    console.error("Registration error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected server error occurred during user registration.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "Invalid email or password format.",
      });
    }

    const result = await loginUser(req.body);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(401).json({
        status: 401,
        error: "Unauthorized",
        message: error.message,
      });
    }
    console.error("Login error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred during login authentication.",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const result = await getMeUser(req.user.userId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        status: 404,
        error: "Not Found",
        message: error.message,
      });
    }
    console.error("Get Me error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while retrieving user profile.",
    });
  }
};
