const Evaluation = require("../models/Evaluation");
const Hackathon = require("../models/Hackathon");

const getHackathonLeaderboard = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    // Verify organizer owns the hackathon
    const hackathon = await Hackathon.findOne({
      _id: hackathonId,
      organizer: req.user.userId,
    });

    if (!hackathon) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to access this leaderboard",
      });
    }

    // The evaluation flow stores completed judge scores as SUBMITTED.
    const evaluations = await Evaluation.find({
      hackathon: hackathonId,
      status: "SUBMITTED",
    })
      .populate("team", "name")
      .populate("project", "projectName")
      .populate("round", "name roundNumber")
      .populate("judge", "name email");

    // Group evaluations by team
    const teamMap = new Map();

    for (const evaluation of evaluations) {
      if (!evaluation.team) continue;

      const teamId = evaluation.team._id.toString();

      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, {
          team: {
            _id: evaluation.team._id,
            name: evaluation.team.name,
          },
          projectId: evaluation.project?._id,
          projectName:
            evaluation.project?.projectName || "",
          totalScore: 0,
          evaluationCount: 0,
          evaluations: [],
        });
      }

      const team = teamMap.get(teamId);

      team.totalScore += Number(evaluation.finalScore || 0);
      team.evaluationCount += 1;

      team.evaluations.push({
        evaluationId: evaluation._id,
        judge: evaluation.judge,
        round: evaluation.round,
        score: Number(evaluation.finalScore || 0),
        submittedAt: evaluation.createdAt,
      });
    }

    // Calculate average score
    const leaderboard = Array.from(
      teamMap.values()
    ).map((team) => ({
      ...team,
      totalEvaluations: team.evaluationCount,
      averageScore:
        team.evaluationCount > 0
          ? Number(
              (
                team.totalScore /
                team.evaluationCount
              ).toFixed(2)
            )
          : 0,
    }));

    // Highest average score first
    leaderboard.sort(
      (a, b) =>
        b.averageScore -
        a.averageScore
    );

    // Assign ranks
    let previousScore = null;
    let currentRank = 0;

    leaderboard.forEach(
      (team, index) => {
        if (
          previousScore ===
          null ||
          team.averageScore !==
            previousScore
        ) {
          currentRank = index + 1;
        }

        team.rank = currentRank;

        previousScore =
          team.averageScore;
      }
    );

    return res.status(200).json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    console.error(
      "Get leaderboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while generating leaderboard",
    });
  }
};

module.exports = {
  getHackathonLeaderboard,
};
