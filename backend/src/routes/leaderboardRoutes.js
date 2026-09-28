const express = require("express");

const {
  getHackathonLeaderboard,
} = require("../controllers/leaderboardController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/hackathon/:hackathonId",
  protect,
  authorizeRoles("ORGANIZER"),
  getHackathonLeaderboard
);

module.exports = router;