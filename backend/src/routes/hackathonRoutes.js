const express = require("express");

const {
  createHackathon,
  getOrganizerHackathons,
  getHackathonById,
  updateHackathon,
  deleteHackathon,
  publishHackathon,
  getPublicHackathons,
  getHackathonByPublicId,
  startEvaluation,
} = require("../controllers/hackathonController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// CREATE HACKATHON
// POST /api/hackathons
// ======================================================

router.post(
  "/",
  protect,
  authorizeRoles("ORGANIZER"),
  createHackathon
);

// ======================================================
// GET ORGANIZER HACKATHONS
// GET /api/hackathons/organizer
// ======================================================

router.get(
  "/organizer",
  protect,
  authorizeRoles("ORGANIZER"),
  getOrganizerHackathons
);

// ======================================================
// GET PUBLIC HACKATHON BY PUBLIC ID
// GET /api/hackathons/public/:publicId
//
// Used by members when entering a Hackathon ID.
// This route is intentionally available before /:id.
// ======================================================

router.get("/public", getPublicHackathons);

router.get(
  "/public/:publicId",
  getHackathonByPublicId
);

// ======================================================
// PUBLISH HACKATHON
// POST /api/hackathons/:id/publish
//
// Only the organizer who owns the hackathon can publish it.
// Rounds and scoring criteria can be configured after publishing.
// ======================================================

router.post(
  "/:id/publish",
  protect,
  authorizeRoles("ORGANIZER"),
  publishHackathon
);

// ======================================================
// GET SINGLE HACKATHON
// GET /api/hackathons/:id
// ======================================================

router.get(
  "/:id",
  protect,
  authorizeRoles("ORGANIZER"),
  getHackathonById
);

// ======================================================
// UPDATE HACKATHON
// PUT /api/hackathons/:id
// ======================================================

router.put(
  "/:id",
  protect,
  authorizeRoles("ORGANIZER"),
  updateHackathon
);

// ======================================================
// DELETE HACKATHON
// DELETE /api/hackathons/:id
// ======================================================

router.delete(
  "/:id",
  protect,
  authorizeRoles("ORGANIZER"),
  deleteHackathon
);
// POST /api/hackathons/:id/start-evaluation
router.post(
  "/:id/start-evaluation",
  protect,
  authorizeRoles("ORGANIZER"),
  startEvaluation
);
// ======================================================
// EXPORT
// ======================================================

module.exports = router;
