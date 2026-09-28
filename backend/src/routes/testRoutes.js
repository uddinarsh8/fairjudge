const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/organizer",
  protect,
  authorizeRoles("ORGANIZER"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Organizer",
      user: req.user,
    });
  }
);

router.get(
  "/judge",
  protect,
  authorizeRoles("JUDGE"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Judge",
      user: req.user,
    });
  }
);

router.get(
  "/team",
  protect,
  authorizeRoles("TEAM"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Team",
      user: req.user,
    });
  }
);

module.exports = router;