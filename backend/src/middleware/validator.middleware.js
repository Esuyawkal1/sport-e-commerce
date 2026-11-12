/**
 * Lightweight, schema-based request validation middleware adhering to Clean Architecture.
 * Validates request body, query, or params against specified rules.
 */

export const validateBody = (rules) => {
  return (req, res, next) => {
    const errors = [];
    const body = req.body || {};

    for (const [field, rule] of Object.entries(rules)) {
      const val = body[field];

      // Check required
      if (rule.required && (val === undefined || val === null || val === "")) {
        errors.push({
          field,
          message: rule.message || `${field} is required.`,
        });
        continue;
      }

      if (val === undefined || val === null) {
        continue;
      }

      // Check type
      if (rule.type) {
        if (rule.type === "string" && typeof val !== "string") {
          errors.push({ field, message: `${field} must be a string.` });
        } else if (
          rule.type === "number" &&
          (typeof val !== "number" || isNaN(val))
        ) {
          errors.push({ field, message: `${field} must be a valid number.` });
        } else if (rule.type === "boolean" && typeof val !== "boolean") {
          errors.push({ field, message: `${field} must be a boolean.` });
        } else if (rule.type === "array" && !Array.isArray(val)) {
          errors.push({ field, message: `${field} must be an array.` });
        }
      }

      // Check min/max for numbers
      if (typeof val === "number") {
        if (rule.min !== undefined && val < rule.min) {
          errors.push({
            field,
            message: `${field} must be at least ${rule.min}.`,
          });
        }
        if (rule.max !== undefined && val > rule.max) {
          errors.push({
            field,
            message: `${field} must be at most ${rule.max}.`,
          });
        }
      }

      // Check minLength/maxLength for strings
      if (typeof val === "string") {
        if (rule.minLength && val.trim().length < rule.minLength) {
          errors.push({
            field,
            message: `${field} must be at least ${rule.minLength} characters.`,
          });
        }
        if (rule.maxLength && val.trim().length > rule.maxLength) {
          errors.push({
            field,
            message: `${field} cannot exceed ${rule.maxLength} characters.`,
          });
        }
      }

      // Check enum
      if (rule.enum && Array.isArray(rule.enum)) {
        if (!rule.enum.includes(val)) {
          errors.push({
            field,
            message: `${field} must be one of: ${rule.enum.join(", ")}.`,
          });
        }
      }

      // Check custom validator function
      if (typeof rule.custom === "function") {
        const customResult = rule.custom(val, body);
        if (customResult !== true) {
          errors.push({
            field,
            message:
              typeof customResult === "string"
                ? customResult
                : `${field} is invalid.`,
          });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "Validation failed.",
        errors,
      });
    }

    next();
  };
};
