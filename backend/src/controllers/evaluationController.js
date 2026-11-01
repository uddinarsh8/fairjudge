const Evaluation = require("../models/Evaluation");
const JudgeAssignment = require("../models/JudgeAssignment");
const EvaluationCriteria = require(
  "../models/EvaluationCriteria"
);
const Round = require("../models/Round");

const getEvaluationData = async (req, res) => {
  try {
    const assignment = await JudgeAssignment.findOne({
      _id: req.params.assignmentId,
      judge: req.user.userId,
    })
      .populate("team", "name")
      .populate(
        "project",
        "projectName problemStatement solution technologyStack githubUrl demoUrl presentationUrl"
      )
      .populate("round", "name roundNumber status")
      .populate("hackathon", "name status");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message:
          "Assignment not found or you are not authorized to evaluate it",
      });
    }

    if (!assignment.project) {
      return res.status(400).json({
        success: false,
        message: "This team has not submitted a project yet",
      });
    }

    if (!assignment.team) {
      return res.status(404).json({
        success: false,
        message: "The team linked to this assignment could not be found. Ask the organizer to update the assignment.",
      });
    }

    if (!assignment.round || !assignment.hackathon) {
      return res.status(404).json({
        success: false,
        message: "This assignment is missing its round or hackathon. Ask the organizer to update the assignment.",
      });
    }

    const criteria = await EvaluationCriteria.find({
      hackathon: assignment.hackathon._id,
      round: assignment.round._id,
    }).sort({ createdAt: 1 });

    const evaluation = await Evaluation.findOne({
      assignment: assignment._id,
      judge: req.user.userId,
    });

    return res.status(200).json({
      success: true,
      assignment,
      criteria,
      evaluation,
    });
  } catch (error) {
    console.error("Get evaluation data error:", error);
    return res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message:
        error.name === "CastError"
          ? "Invalid assignment ID"
          : "Server error while loading evaluation",
    });
  }
};


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

      const maximumScore = Math.max(
        ...criterion.scoringLevels.map(
          (level) => Number(level.score)
        )
      );

      if (!Number.isFinite(maximumScore) || maximumScore <= 0) {
        return res.status(400).json({
          success: false,
          message:
            `Scoring levels for ${criterion.name} must include a score greater than zero`,
        });
      }

      const weightedScore =
        (numericScore / maximumScore) *
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

    if (evaluationStatus === "SUBMITTED") {
      await JudgeAssignment.updateOne(
        {
          _id: assignment._id,
          judge: req.user.userId,
        },
        { $set: { status: "COMPLETED" } }
      );
    }

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
  getEvaluationData,
  submitEvaluation,
};
