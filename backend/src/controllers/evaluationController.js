const Evaluation = require("../models/Evaluation");
const JudgeAssignment = require("../models/JudgeAssignment");
const EvaluationCriteria = require(
  "../models/EvaluationCriteria"
);
const Round = require("../models/Round");


// ======================================================
// CREATE / SUBMIT EVALUATION
// Judge only
// ======================================================

const submitEvaluation = async (req, res) => {
  try {
    const {
      assignmentId,
      scores,
      overallComment,
      status,
    } = req.body;

    // --------------------------------------------------
    // Validate required fields
    // --------------------------------------------------

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: "Assignment ID is required",
      });
    }

    if (
      !Array.isArray(scores) ||
      scores.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one criterion score is required",
      });
    }

    // --------------------------------------------------
    // Verify assignment belongs to logged-in judge
    // --------------------------------------------------

    const assignment =
      await JudgeAssignment.findOne({
        _id: assignmentId,
        judge: req.user.userId,
      });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message:
          "Assignment not found or you are not authorized to evaluate it",
      });
    }

    // --------------------------------------------------
    // Verify round exists
    // --------------------------------------------------

    const round = await Round.findOne({
      _id: assignment.round,
      hackathon: assignment.hackathon,
    });

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Evaluation round not found",
      });
    }

    // --------------------------------------------------
    // Load criteria for this round
    // --------------------------------------------------

    const criteria =
      await EvaluationCriteria.find({
        hackathon: assignment.hackathon,
        round: assignment.round,
      });

    if (criteria.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No evaluation criteria found for this round",
      });
    }

    // --------------------------------------------------
    // Check total criteria weight
    // --------------------------------------------------

    const totalWeight =
      criteria.reduce(
        (total, criterion) =>
          total +
          Number(criterion.weight || 0),
        0
      );

    if (
      Math.abs(totalWeight - 100) >
      0.001
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Evaluation criteria must total exactly 100%. Current total: ${totalWeight}%`,
      });
    }

    // --------------------------------------------------
    // Prevent duplicate criterion submissions
    // --------------------------------------------------

    const submittedCriterionIds =
      scores.map(
        (item) =>
          item.criterionId
      );

    const uniqueCriterionIds =
      new Set(
        submittedCriterionIds.map(
          (id) => String(id)
        )
      );

    if (
      uniqueCriterionIds.size !==
      submittedCriterionIds.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Duplicate criterion scores are not allowed",
      });
    }

    // --------------------------------------------------
    // Judge must score every criterion
    // --------------------------------------------------

    if (
      scores.length !== criteria.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Every evaluation criterion must be scored",
      });
    }

    const evaluationScores = [];

    let finalScore = 0;

    // --------------------------------------------------
    // Process every criterion
    // --------------------------------------------------

    for (const criterion of criteria) {
      const submittedScore =
        scores.find(
          (item) =>
            String(item.criterionId) ===
            String(criterion._id)
        );

      if (!submittedScore) {
        return res.status(400).json({
          success: false,
          message:
            `Missing score for criterion: ${criterion.name}`,
        });
      }

      // ----------------------------------------------
      // Validate selected level
      // ----------------------------------------------

      const validLevels = [
        "BEST",
        "GOOD",
        "AVERAGE",
        "POOR",
        "WORST",
      ];

      if (
        !validLevels.includes(
          submittedScore.selectedLevel
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid scoring level for ${criterion.name}`,
        });
      }

      // ----------------------------------------------
      // Find the selected scoring level
      // ----------------------------------------------

      const scoringLevel =
        criterion.scoringLevels.find(
          (level) =>
            level.name ===
            submittedScore.selectedLevel
        );

      if (!scoringLevel) {
        return res.status(400).json({
          success: false,
          message:
            `Scoring level not found for ${criterion.name}`,
        });
      }

      // ----------------------------------------------
      // Get official score from database
      // Never trust score sent by frontend
      // ----------------------------------------------

      const numericScore =
        Number(scoringLevel.score);

      // ----------------------------------------------
      // Calculate weighted score
      //
      // Example:
      //
      // Weight = 30%
      // Score = 5
      //
      // Weighted Score:
      // (5 / 5) × 30 = 30
      // ----------------------------------------------

      const weightedScore =
        (numericScore / 5) *
        Number(criterion.weight);

      finalScore +=
        weightedScore;

      // ----------------------------------------------
      // Store score
      // ----------------------------------------------

      evaluationScores.push({
        criterion: criterion._id,
        criterionName:
          criterion.name,
        weight:
          criterion.weight,
        selectedLevel:
          submittedScore.selectedLevel,
        score:
          numericScore,
        weightedScore:
          Number(
            weightedScore.toFixed(2)
          ),
        comment:
          submittedScore.comment || "",
      });
    }

    // --------------------------------------------------
    // Round final score
    // Maximum = 100
    // --------------------------------------------------

    finalScore =
      Number(
        finalScore.toFixed(2)
      );

    // --------------------------------------------------
    // Validate evaluation status
    // --------------------------------------------------

    const evaluationStatus =
      status === "SUBMITTED"
        ? "SUBMITTED"
        : "DRAFT";

    // --------------------------------------------------
    // Check existing evaluation
    // --------------------------------------------------

    const existingEvaluation =
      await Evaluation.findOne({
        assignment: assignment._id,
        judge: req.user.userId,
      });

    if (existingEvaluation) {
      return res.status(409).json({
        success: false,
        message:
          "An evaluation already exists for this assignment",
      });
    }

    // --------------------------------------------------
    // Create evaluation
    // --------------------------------------------------

    const evaluation =
      await Evaluation.create({
        hackathon:
          assignment.hackathon,
        round:
          assignment.round,
        judge:
          req.user.userId,
        assignment:
          assignment._id,
        team:
          assignment.team,
        project:
          assignment.project,
        scores:
          evaluationScores,
        finalScore,
        overallComment:
          overallComment || "",
        status:
          evaluationStatus,
      });

    // --------------------------------------------------
    // Return evaluation
    // --------------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        evaluationStatus ===
        "SUBMITTED"
          ? "Evaluation submitted successfully"
          : "Evaluation saved as draft",
      evaluation,
    });
  } catch (error) {
    console.error(
      "Submit evaluation error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An evaluation already exists for this assignment",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while submitting evaluation",
    });
  }
};


module.exports = {
  submitEvaluation,
};