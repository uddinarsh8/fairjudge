const EvaluationCriteria = require("../models/EvaluationCriteria");
const Hackathon = require("../models/Hackathon");
const Round = require("../models/Round");

// ======================================================
// CREATE CRITERIA
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

    if (
      !Array.isArray(scoringLevels) ||
      scoringLevels.length !== 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Exactly 5 scoring levels are required",
      });
    }

    const requiredLevels = [
      "BEST",
      "GOOD",
      "AVERAGE",
      "POOR",
      "WORST",
    ];

    for (const requiredLevel of requiredLevels) {
      const level = scoringLevels.find(
        (item) => item.name === requiredLevel
      );

      if (!level) {
        return res.status(400).json({
          success: false,
          message:
            `Missing scoring level: ${requiredLevel}`,
        });
      }

      if (
        level.score === undefined ||
        !Number.isFinite(Number(level.score))
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid score for ${requiredLevel}`,
        });
      }

      if (
        !level.description ||
        !level.description.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Description is required for ${requiredLevel}`,
        });
      }
    }

    const hackathon = await Hackathon.findOne({
      _id: hackathonId,
      organizer: req.user.userId,
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

    const criterion =
      await EvaluationCriteria.create({
        hackathon: hackathonId,
        round: roundId,
        name: name.trim(),
        description: description || "",
        weight: numericWeight,
        scoringLevels: scoringLevels.map(
          (level) => ({
            name: level.name,
            score: Number(level.score),
            description:
              level.description.trim(),
          })
        ),
      });

    return res.status(201).json({
      success: true,
      message:
        "Evaluation criterion created successfully",
      criterion,
      totalWeight: newTotalWeight,
      remainingWeight:
        100 - newTotalWeight,
    });
  } catch (error) {
    console.error(
      "Create criteria error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This evaluation criterion already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating evaluation criterion",
    });
  }
};

// ======================================================
// GET CRITERIA
// ======================================================

const getCriteria = async (req, res) => {
  try {
    const {
      hackathonId,
      roundId,
    } = req.params;

    const hackathon = await Hackathon.findOne({
      _id: hackathonId,
      organizer: req.user.userId,
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

    const totalWeight =
      criteria.reduce(
        (total, criterion) =>
          total + Number(criterion.weight || 0),
        0
      );

    return res.status(200).json({
      success: true,
      criteria,
      totalWeight,
      remainingWeight:
        Math.max(0, 100 - totalWeight),
      isComplete:
        Math.abs(totalWeight - 100) < 0.001,
    });
  } catch (error) {
    console.error(
      "Get criteria error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching criteria",
    });
  }
};

// ======================================================
// UPDATE CRITERIA
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

    const hackathon = await Hackathon.findOne({
      _id: hackathonId,
      organizer: req.user.userId,
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

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Criterion name is required",
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

    if (
      !Array.isArray(scoringLevels) ||
      scoringLevels.length !== 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Exactly 5 scoring levels are required",
      });
    }

    const requiredLevels = [
      "BEST",
      "GOOD",
      "AVERAGE",
      "POOR",
      "WORST",
    ];

    for (const requiredLevel of requiredLevels) {
      const level = scoringLevels.find(
        (item) =>
          item.name === requiredLevel
      );

      if (!level) {
        return res.status(400).json({
          success: false,
          message:
            `Missing scoring level: ${requiredLevel}`,
        });
      }

      if (
        level.score === undefined ||
        !Number.isFinite(Number(level.score))
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid score for ${requiredLevel}`,
        });
      }

      if (
        !level.description ||
        !level.description.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Description is required for ${requiredLevel}`,
        });
      }
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
      description || "";
    criterion.weight =
      numericWeight;

    criterion.scoringLevels =
      scoringLevels.map((level) => ({
        name: level.name,
        score: Number(level.score),
        description:
          level.description.trim(),
      }));

    await criterion.save();

    return res.status(200).json({
      success: true,
      message:
        "Evaluation criterion updated successfully",
      criterion,
      totalWeight:
        newTotalWeight,
      remainingWeight:
        100 - newTotalWeight,
    });
  } catch (error) {
    console.error(
      "Update criteria error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating evaluation criterion",
    });
  }
};

// ======================================================
// DELETE CRITERIA
// ======================================================

const deleteCriteria = async (req, res) => {
  try {
    const {
      hackathonId,
      roundId,
      criteriaId,
    } = req.params;

    const hackathon = await Hackathon.findOne({
      _id: hackathonId,
      organizer: req.user.userId,
    });

    if (!hackathon) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to manage this hackathon",
      });
    }

    // Verify round belongs to hackathon
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

    return res.status(200).json({
      success: true,
      message:
        "Evaluation criterion deleted successfully",
      totalWeight,
      remainingWeight:
        Math.max(0, 100 - totalWeight),
    });
  } catch (error) {
    console.error(
      "Delete criteria error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting evaluation criterion",
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