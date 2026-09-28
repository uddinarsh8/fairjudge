const express = require("express");

const {
  createRound,
  getRounds,
  updateRound,
  deleteRound,
} = require("../controllers/roundController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ======================================================
// CREATE ROUND
// POST /rounds/:hackathonId
// ======================================================

router.post(
  "/:hackathonId",
  protect,
  authorizeRoles("ORGANIZER"),
  createRound
);


// ======================================================
// GET ALL ROUNDS
// GET /rounds/:hackathonId
// ======================================================

router.get(
  "/:hackathonId",
  protect,
  authorizeRoles("ORGANIZER"),
  getRounds
);


// ======================================================
// UPDATE ROUND
// PUT /rounds/:hackathonId/:roundId
// ======================================================

router.put(
  "/:hackathonId/:roundId",
  protect,
  authorizeRoles("ORGANIZER"),
  updateRound
);


// ======================================================
// DELETE ROUND
// DELETE /rounds/:hackathonId/:roundId
// ======================================================

router.delete(
  "/:hackathonId/:roundId",
  protect,
  authorizeRoles("ORGANIZER"),
  deleteRound
);


module.exports = router;