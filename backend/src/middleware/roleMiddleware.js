// ======================================================
// ROLE AUTHORIZATION MIDDLEWARE
// ======================================================

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // --------------------------------------------------
      // Make sure authentication middleware ran first
      // --------------------------------------------------

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // --------------------------------------------------
      // User Role
      // --------------------------------------------------

      const userRole = req.user.role
        ? String(req.user.role).toUpperCase()
        : null;

      // --------------------------------------------------
      // Normalize Allowed Roles
      // --------------------------------------------------

      const normalizedRoles = allowedRoles.map((role) =>
        String(role).toUpperCase()
      );

      console.log("=================================");
      console.log("ROLE AUTHORIZATION");
      console.log("User role:", userRole);
      console.log("Allowed roles:", normalizedRoles);
      console.log("=================================");

      // --------------------------------------------------
      // Check Role
      // --------------------------------------------------

      if (
        !userRole ||
        !normalizedRoles.includes(userRole)
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      next();
    } catch (error) {
      console.error(
        "Role authorization error:",
        error
      );

      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
  };
};

module.exports = authorizeRoles;