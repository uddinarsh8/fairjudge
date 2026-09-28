const express = require("express");

const {
  submitEvaluation,
} = require("../controllers/evaluationController");

const protect = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ======================================================
// SUBMIT / SAVE EVALUATION
// Judge only
// ======================================================

router.post(
  "/",
  protect,
  authorizeRoles("JUDGE"),
  submitEvaluation
);


module.exports = router;