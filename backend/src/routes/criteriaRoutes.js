const express = require("express");

const {
  createCriteria,
  getCriteria,
  updateCriteria,
  deleteCriteria,
} = require("../controllers/criteriaController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// CREATE CRITERION
// POST /api/criteria
// Organizer only
// ======================================================

router.post(
  "/",
  protect,
  authorizeRoles("ORGANIZER"),
  createCriteria
);

// ======================================================
// GET CRITERIA FOR ROUND
// GET /api/criteria/:hackathonId/:roundId
// Organizer only
// ======================================================

router.get(
  "/:hackathonId/:roundId",
  protect,
  authorizeRoles("ORGANIZER"),
  getCriteria
);

// ======================================================
// UPDATE CRITERION
// PUT /api/criteria/:hackathonId/:roundId/:criteriaId
// Organizer only
// ======================================================

router.put(
  "/:hackathonId/:roundId/:criteriaId",
  protect,
  authorizeRoles("ORGANIZER"),
  updateCriteria
);

// ======================================================
// DELETE CRITERION
// DELETE /api/criteria/:hackathonId/:roundId/:criteriaId
// Organizer only
// ======================================================

router.delete(
  "/:hackathonId/:roundId/:criteriaId",
  protect,
  authorizeRoles("ORGANIZER"),
  deleteCriteria
);

module.exports = router;