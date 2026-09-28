const jwt = require("jsonwebtoken");

// ======================================================
// AUTHENTICATION MIDDLEWARE
// ======================================================

const protect = (req, res, next) => {
  try {
    // --------------------------------------------------
    // Check Authorization Header
    // --------------------------------------------------

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    // --------------------------------------------------
    // Extract Token
    // --------------------------------------------------

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    // --------------------------------------------------
    // Check JWT Secret
    // --------------------------------------------------

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error",
      });
    }

    // --------------------------------------------------
    // Verify Token
    // --------------------------------------------------

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("=================================");
    console.log("AUTHENTICATION");
    console.log("Decoded JWT:", decoded);
    console.log("=================================");

    // --------------------------------------------------
    // Normalize User ID
    //
    // Different login implementations may store the
    // user ID as userId, id or _id.
    // --------------------------------------------------

    const userId =
      decoded.userId ||
      decoded.id ||
      decoded._id;

    if (!userId) {
      console.error(
        "JWT does not contain userId, id or _id"
      );

      return res.status(401).json({
        success: false,
        message: "Invalid authentication token: user ID missing",
      });
    }

    // --------------------------------------------------
    // Normalize Role
    // --------------------------------------------------

    const role = decoded.role
      ? String(decoded.role).toUpperCase()
      : null;

    console.log("User ID:", userId);
    console.log("User Role:", role);
    console.log("=================================");

    // --------------------------------------------------
    // Attach User To Request
    // --------------------------------------------------

    req.user = {
      ...decoded,

      userId,
      role,
    };

    next();
  } catch (error) {
    console.error(
      "Authentication middleware error:",
      error.message
    );

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

module.exports = protect;