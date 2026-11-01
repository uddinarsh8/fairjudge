const express = require("express");

const {
  getEvaluationData,
  submitEvaluation,
} = require("../controllers/evaluationController");

const protect = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/:assignmentId/data",
  protect,
  authorizeRoles("JUDGE"),
  getEvaluationData
);


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
