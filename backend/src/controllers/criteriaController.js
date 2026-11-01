const mongoose = require("mongoose");

const EvaluationCriteria = require("../models/EvaluationCriteria");
const Hackathon = require("../models/Hackathon");
const Round = require("../models/Round");

// ======================================================
// CONSTANTS
// ======================================================

const REQUIRED_LEVELS = [
  "BEST",
  "GOOD",
  "AVERAGE",
  "POOR",
  "WORST",
];

// ======================================================
// HELPER: VALIDATE SCORING LEVELS
// ======================================================

const validateScoringLevels = (scoringLevels) => {
  if (
    !Array.isArray(scoringLevels) ||
    scoringLevels.length !== 5
  ) {
    return "Exactly 5 scoring levels are required";
  }

  for (const requiredLevel of REQUIRED_LEVELS) {
    const level = scoringLevels.find(
      (item) => item?.name === requiredLevel
    );

    if (!level) {
      return `Missing scoring level: ${requiredLevel}`;
    }

    if (
      level.score === undefined ||
      level.score === null ||
      !Number.isFinite(Number(level.score))
    ) {
      return `Invalid score for ${requiredLevel}`;
    }

    if (
      typeof level.description !== "string" ||
      !level.description.trim()
    ) {
      return `Description is required for ${requiredLevel}`;
    }
  }

  return null;
};

// ======================================================
// HELPER: CHECK WHETHER A SAVED CRITERION IS VALID
// ======================================================

const isValidSavedCriterion = (criterion) => {
  const weight = Number(criterion.weight);
  const levels = criterion.scoringLevels;

  if (
    !Number.isFinite(weight) ||
    weight <= 0 ||
    weight > 100
  ) {
    return false;
  }

  if (!Array.isArray(levels) || levels.length !== 5) {
    return false;
  }

  return REQUIRED_LEVELS.every((requiredLevel) => {
    const level = levels.find(
      (item) => item?.name === requiredLevel
    );

    return (
      level &&
      level.score !== undefined &&
      level.score !== null &&
      Number.isFinite(Number(level.score)) &&
      typeof level.description === "string" &&
      level.description.trim().length > 0
    );
  });
};

// ======================================================
// HELPER: SYNCHRONIZE HACKATHON EVALUATION SETUP
//
// Evaluation is configured only when:
// 1. At least one round exists.
// 2. Every round has at least one criterion.
// 3. Every round's total criterion weight is 100%.
// 4. Every criterion has all five valid scoring levels.
// ======================================================

const syncEvaluationConfigured = async (hackathon) => {
  const rounds = await Round.find({
    hackathon: hackathon._id,
  })
    .select("_id")
    .lean();

  let evaluationConfigured = rounds.length > 0;

  if (evaluationConfigured) {
    const roundCriteria = await Promise.all(
      rounds.map((round) =>
        EvaluationCriteria.find({
          hackathon: hackathon._id,
          round: round._id,
        })
          .select("weight scoringLevels")
          .lean()
      )
    );

    evaluationConfigured = roundCriteria.every(
      (criteria) => {
        if (criteria.length === 0) {
          return false;
        }

        const totalWeight = criteria.reduce(
          (total, criterion) =>
            total + Number(criterion.weight || 0),
          0
        );

        const weightIsComplete =
          Math.abs(totalWeight - 100) < 0.001;

        const allCriteriaAreValid =
          criteria.every(isValidSavedCriterion);

        return weightIsComplete && allCriteriaAreValid;
      }
    );
  }

  if (!hackathon.setup) {
    hackathon.setup = {};
  }

  hackathon.setup.evaluationConfigured =
    evaluationConfigured;

  await hackathon.save();

  return evaluationConfigured;
};

// ======================================================
// HELPER: VALIDATE MONGODB IDS
// ======================================================

const areValidIds = (...ids) =>
  ids.every(
    (id) =>
      id &&
      mongoose.Types.ObjectId.isValid(id)
  );

// ======================================================
// CREATE CRITERIA
// POST /criteria
// ======================================================

const createCriteria = async (req, res) => {
  try {
    const {
      hackathonId,
      roundId,
      name,
      description,
      weight,
      scoringLevels,
    } = req.body;

    if (
      !hackathonId ||
      !roundId ||
      !name ||
      weight === undefined ||
      !scoringLevels
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Hackathon, round, name, weight and scoring levels are required",
      });
    }

    if (
      !areValidIds(hackathonId, roundId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid hackathon ID or round ID",
      });
    }

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Criterion name is required",
      });
    }

    const numericWeight = Number(weight);

    if (
      !Number.isFinite(numericWeight) ||
      numericWeight <= 0 ||
      numericWeight > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Weight must be a number greater than 0 and at most 100",
      });
    }

    const levelError =
      validateScoringLevels(scoringLevels);

    if (levelError) {
      return res.status(400).json({
        success: false,
        message: levelError,
      });
    }

    const organizerId = req.user?.userId || req.user?.id;

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    // Verify hackathon ownership.
    const hackathon = await Hackathon.findOne({
      _id: hackathonId,
      organizer: organizerId,
    });

    if (!hackathon) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to manage this hackathon",
      });
    }

    // Verify the round belongs to this hackathon.
    const round = await Round.findOne({
      _id: roundId,
      hackathon: hackathonId,
    });

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Round not found",
      });
    }

    // Prevent duplicate criterion names within a round.
    const existingCriteria =
      await EvaluationCriteria.findOne({
        hackathon: hackathonId,
        round: roundId,
        name: name.trim(),
      });

    if (existingCriteria) {
      return res.status(409).json({
        success: false,
        message:
          "A criterion with this name already exists in this round",
      });
    }

    // Calculate existing weights.
    const existingCriteriaList =
      await EvaluationCriteria.find({
        hackathon: hackathonId,
        round: roundId,
      });

    const existingWeight =
      existingCriteriaList.reduce(
        (total, criterion) =>
          total + Number(criterion.weight || 0),
        0
      );

    const newTotalWeight =
      existingWeight + numericWeight;

    if (newTotalWeight > 100) {
      return res.status(400).json({
        success: false,
        message:
          `Total criteria weight cannot exceed 100%. Existing: ${existingWeight}%, attempted total: ${newTotalWeight}%`,
      });
    }

    // Save criterion.
    const criterion =
      await EvaluationCriteria.create({
        hackathon: hackathonId,
        round: roundId,
        name: name.trim(),
        description:
          typeof description === "string"
            ? description.trim()
            : "",
        weight: numericWeight,
        scoringLevels: scoringLevels.map(
          (level) => ({
            name: level.name,
            score: Number(level.score),
            description: level.description.trim(),
          })
        ),
      });

    // Recalculate evaluation readiness across all rounds.
    const evaluationConfigured =
      await syncEvaluationConfigured(hackathon);

    return res.status(201).json({
      success: true,
      message:
        "Evaluation criterion created successfully",
      criterion,
      totalWeight: newTotalWeight,
      remainingWeight: Math.max(
        0,
        100 - newTotalWeight
      ),
      evaluationConfigured,
    });
  } catch (error) {
    console.error("Create criteria error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This evaluation criterion already exists",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid hackathon or round ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating evaluation criterion",
      error: error.message,
    });
  }
};

// ======================================================
// GET CRITERIA
// GET /criteria/:hackathonId/:roundId
// ======================================================

const getCriteria = async (req, res) => {
  try {
    const {
      hackathonId,
      roundId,
    } = req.params;

    if (!areValidIds(hackathonId, roundId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hackathon ID or round ID",
      });
    }

    const organizerId = req.user?.userId || req.user?.id;

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    const hackathon = await Hackathon.findOne({
      _id: hackathonId,
      organizer: organizerId,
    });

    if (!hackathon) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to access this hackathon",
      });
    }

    const round = await Round.findOne({
      _id: roundId,
      hackathon: hackathonId,
    });

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Round not found",
      });
    }

    const criteria =
      await EvaluationCriteria.find({
        hackathon: hackathonId,
        round: roundId,
      }).sort({
        createdAt: 1,
      });

    const totalWeight = criteria.reduce(
      (total, criterion) =>
        total + Number(criterion.weight || 0),
      0
    );

    const isComplete =
      criteria.length > 0 &&
      Math.abs(totalWeight - 100) < 0.001 &&
      criteria.every(isValidSavedCriterion);

    // Synchronize the stored setup flag.
    const evaluationConfigured =
      await syncEvaluationConfigured(hackathon);

    return res.status(200).json({
      success: true,
      criteria,
      totalWeight,
      remainingWeight: Math.max(
        0,
        100 - totalWeight
      ),
      isComplete,
      evaluationConfigured,
    });
  } catch (error) {
    console.error("Get criteria error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid hackathon or round ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching criteria",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE CRITERIA
// PUT /criteria/:hackathonId/:roundId/:criteriaId
// ======================================================

const updateCriteria = async (req, res) => {
  try {
    const {
      hackathonId,
      roundId,
      criteriaId,
    } = req.params;

    const {
      name,
      description,
      weight,
      scoringLevels,
    } = req.body;

    if (
      !areValidIds(
        hackathonId,
        roundId,
        criteriaId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid hackathon, round or criterion ID",
      });
    }

    const organizerId = req.user?.userId || req.user?.id;

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    const hackathon = await Hackathon.findOne({
      _id: hackathonId,
      organizer: organizerId,
    });

    if (!hackathon) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to manage this hackathon",
      });
    }

    const round = await Round.findOne({
      _id: roundId,
      hackathon: hackathonId,
    });

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Round not found",
      });
    }

    const criterion =
      await EvaluationCriteria.findOne({
        _id: criteriaId,
        hackathon: hackathonId,
        round: roundId,
      });

    if (!criterion) {
      return res.status(404).json({
        success: false,
        message:
          "Evaluation criterion not found",
      });
    }

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Criterion name is required",
      });
    }

    const numericWeight = Number(weight);

    if (
      !Number.isFinite(numericWeight) ||
      numericWeight <= 0 ||
      numericWeight > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Weight must be greater than 0 and at most 100",
      });
    }

    const levelError =
      validateScoringLevels(scoringLevels);

    if (levelError) {
      return res.status(400).json({
        success: false,
        message: levelError,
      });
    }

    const duplicate =
      await EvaluationCriteria.findOne({
        hackathon: hackathonId,
        round: roundId,
        name: name.trim(),
        _id: {
          $ne: criteriaId,
        },
      });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message:
          "A criterion with this name already exists in this round",
      });
    }

    const otherCriteria =
      await EvaluationCriteria.find({
        hackathon: hackathonId,
        round: roundId,
        _id: {
          $ne: criteriaId,
        },
      });

    const existingWeight =
      otherCriteria.reduce(
        (total, item) =>
          total + Number(item.weight || 0),
        0
      );

    const newTotalWeight =
      existingWeight + numericWeight;

    if (newTotalWeight > 100) {
      return res.status(400).json({
        success: false,
        message:
          `Total criteria weight cannot exceed 100%. Attempted total: ${newTotalWeight}%`,
      });
    }

    criterion.name = name.trim();
    criterion.description =
      typeof description === "string"
        ? description.trim()
        : "";
    criterion.weight = numericWeight;

    criterion.scoringLevels =
      scoringLevels.map((level) => ({
        name: level.name,
        score: Number(level.score),
        description: level.description.trim(),
      }));

    await criterion.save();

    const evaluationConfigured =
      await syncEvaluationConfigured(hackathon);

    return res.status(200).json({
      success: true,
      message:
        "Evaluation criterion updated successfully",
      criterion,
      totalWeight: newTotalWeight,
      remainingWeight: Math.max(
        0,
        100 - newTotalWeight
      ),
      evaluationConfigured,
    });
  } catch (error) {
    console.error("Update criteria error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A criterion with this name already exists in this round",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid hackathon, round or criterion ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating evaluation criterion",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE CRITERIA
// DELETE /criteria/:hackathonId/:roundId/:criteriaId
// ======================================================

const deleteCriteria = async (req, res) => {
  try {
    const {
      hackathonId,
      roundId,
      criteriaId,
    } = req.params;

    if (
      !areValidIds(
        hackathonId,
        roundId,
        criteriaId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid hackathon, round or criterion ID",
      });
    }

    const organizerId = req.user?.userId || req.user?.id;

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    const hackathon = await Hackathon.findOne({
      _id: hackathonId,
      organizer: organizerId,
    });

    if (!hackathon) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to manage this hackathon",
      });
    }

    const round = await Round.findOne({
      _id: roundId,
      hackathon: hackathonId,
    });

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Round not found",
      });
    }

    const criterion =
      await EvaluationCriteria.findOne({
        _id: criteriaId,
        hackathon: hackathonId,
        round: roundId,
      });

    if (!criterion) {
      return res.status(404).json({
        success: false,
        message:
          "Evaluation criterion not found",
      });
    }

    await criterion.deleteOne();

    // Recalculate the total weight for this round.
    const remainingCriteria =
      await EvaluationCriteria.find({
        hackathon: hackathonId,
        round: roundId,
      });

    const totalWeight =
      remainingCriteria.reduce(
        (total, item) =>
          total + Number(item.weight || 0),
        0
      );

    // Deleting a criterion may make evaluation incomplete.
    const evaluationConfigured =
      await syncEvaluationConfigured(hackathon);

    return res.status(200).json({
      success: true,
      message:
        "Evaluation criterion deleted successfully",
      totalWeight,
      remainingWeight: Math.max(
        0,
        100 - totalWeight
      ),
      evaluationConfigured,
    });
  } catch (error) {
    console.error("Delete criteria error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid hackathon, round or criterion ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting evaluation criterion",
      error: error.message,
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createCriteria,
  getCriteria,
  updateCriteria,
  deleteCriteria,
};