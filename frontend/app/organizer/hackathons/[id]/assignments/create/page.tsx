"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Judge = {
  _id: string;
  name: string;
  email: string;
};

type Round = {
  _id: string;
  name: string;
  roundNumber: number;
  status?: string;
};

type Project = {
  _id: string;
  projectName: string;
  status?: string;
};

type Team = {
  _id: string;
  name: string;
  status?: string;
  project: Project | null;
};

export default function CreateAssignmentPage() {
  const router = useRouter();
  const params = useParams();

  const { token } = useAuth();

  const hackathonId = params.id as string;

  const [judges, setJudges] = useState<Judge[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [selectedJudge, setSelectedJudge] = useState("");
  const [selectedRound, setSelectedRound] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!token || !hackathonId) {
        setLoading(false);
        return;
      }

      try {
        setError("");

        const [
          judgesResponse,
          roundsResponse,
          teamsResponse,
        ] = await Promise.all([
          apiRequest(
            "/organizer/judges",
            {
              token,
            }
          ),

          apiRequest(
            `/organizer/hackathons/${hackathonId}/rounds`,
            {
              token,
            }
          ),

          apiRequest(
            `/organizer/hackathons/${hackathonId}/teams`,
            {
              token,
            }
          ),
        ]);

        setJudges(
          judgesResponse.judges || []
        );

        setRounds(
          roundsResponse.rounds || []
        );

        setTeams(
          teamsResponse.teams || []
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load assignment data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, hackathonId]);

  // Only teams that have submitted a project
  const teamsWithProjects = teams.filter(
    (team) => team.project
  );

  const selectedTeamData =
    teams.find(
      (team) =>
        team._id === selectedTeam
    );

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!selectedJudge) {
      setError(
        "Please select a judge."
      );
      return;
    }

    if (!selectedRound) {
      setError(
        "Please select an evaluation round."
      );
      return;
    }

    if (!selectedTeam) {
      setError(
        "Please select a team."
      );
      return;
    }

    if (!selectedTeamData?.project) {
      setError(
        "This team has not submitted a project."
      );
      return;
    }

    setSubmitting(true);

    try {
      await apiRequest(
        "/assignments",
        {
          method: "POST",
          token:
            token || undefined,
          body: {
            hackathonId,
            roundId:
              selectedRound,
            judgeId:
              selectedJudge,
            teamId:
              selectedTeam,
          },
        }
      );

      setSuccess(
        "Judge assigned successfully."
      );

      setSelectedJudge("");
      setSelectedRound("");
      setSelectedTeam("");

      setTimeout(() => {
        router.push(
          `/organizer/hackathons/${hackathonId}/assignments`
        );
      }, 800);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create assignment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">

        {/* Back */}

        <button
          onClick={() =>
            router.push(
              `/organizer/hackathons/${hackathonId}/assignments`
            )
          }
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Judge Assignments
        </button>

        {/* Header */}

        <div className="mb-8">
          <p className="text-sm font-medium text-blue-400">
            JUDGE MANAGEMENT
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Create Judge Assignment
          </h1>

          <p className="mt-2 text-slate-400">
            Assign a judge to evaluate a team's project
            for a specific evaluation round.
          </p>
        </div>

        {/* Error */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Success */}

        {success && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
            {success}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
            Loading assignment options...
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">

            {/* Judge */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Judge
              </label>

              <select
                value={selectedJudge}
                onChange={(e) =>
                  setSelectedJudge(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                <option value="">
                  Select a judge
                </option>

                {judges.map(
                  (judge) => (
                    <option
                      key={judge._id}
                      value={judge._id}
                    >
                      {judge.name} —{" "}
                      {judge.email}
                    </option>
                  )
                )}
              </select>

              {judges.length === 0 && (
                <p className="mt-2 text-xs text-yellow-400">
                  No judge accounts are available.
                </p>
              )}
            </div>

            {/* Round */}

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Evaluation Round
              </label>

              <select
                value={selectedRound}
                onChange={(e) =>
                  setSelectedRound(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                <option value="">
                  Select a round
                </option>

                {rounds.map(
                  (round) => (
                    <option
                      key={round._id}
                      value={round._id}
                    >
                      Round{" "}
                      {round.roundNumber}
                      {" — "}
                      {round.name}
                    </option>
                  )
                )}
              </select>

              {rounds.length === 0 && (
                <p className="mt-2 text-xs text-yellow-400">
                  Create an evaluation round first.
                </p>
              )}
            </div>

            {/* Team */}

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Team / Project
              </label>

              <select
                value={selectedTeam}
                onChange={(e) =>
                  setSelectedTeam(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                <option value="">
                  Select a team
                </option>

                {teamsWithProjects.map(
                  (team) => (
                    <option
                      key={team._id}
                      value={team._id}
                    >
                      {team.name}
                      {" — "}
                      {team.project?.projectName}
                    </option>
                  )
                )}
              </select>

              {teamsWithProjects.length ===
                0 && (
                <p className="mt-2 text-xs text-yellow-400">
                  No teams with submitted projects
                  are available.
                </p>
              )}

              {teams.length >
                teamsWithProjects.length && (
                <p className="mt-2 text-xs text-slate-500">
                  Teams without a submitted project
                  are hidden.
                </p>
              )}
            </div>

            {/* Project Preview */}

            {selectedTeamData?.project && (
              <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
                <p className="text-xs font-medium text-blue-400">
                  PROJECT TO BE EVALUATED
                </p>

                <p className="mt-2 text-lg font-semibold">
                  {
                    selectedTeamData
                      .project.projectName
                  }
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Team:{" "}
                  {selectedTeamData.name}
                </p>
              </div>
            )}

            {/* Assignment Summary */}

            {selectedJudge &&
              selectedRound &&
              selectedTeamData?.project && (
                <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 p-5">
                  <p className="text-xs font-medium text-slate-500">
                    ASSIGNMENT SUMMARY
                  </p>

                  <div className="mt-4 space-y-2 text-sm">
                    <p>
                      <span className="text-slate-500">
                        Judge:
                      </span>{" "}
                      {
                        judges.find(
                          (judge) =>
                            judge._id ===
                            selectedJudge
                        )?.name
                      }
                    </p>

                    <p>
                      <span className="text-slate-500">
                        Round:
                      </span>{" "}
                      {
                        rounds.find(
                          (round) =>
                            round._id ===
                            selectedRound
                        )?.name
                      }
                    </p>

                    <p>
                      <span className="text-slate-500">
                        Team:
                      </span>{" "}
                      {selectedTeamData.name}
                    </p>

                    <p>
                      <span className="text-slate-500">
                        Project:
                      </span>{" "}
                      {
                        selectedTeamData
                          .project.projectName
                      }
                    </p>
                  </div>
                </div>
              )}

            {/* Security */}

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-800/50 p-5">
              <div className="flex gap-3">
                <span className="text-xl">
                  🛡️
                </span>

                <div>
                  <h3 className="text-sm font-semibold">
                    Assignment Protection
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    The backend verifies the hackathon,
                    round, judge, team and submitted project.
                    Duplicate judge/team/round assignments
                    are rejected.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() =>
                  router.push(
                    `/organizer/hackathons/${hackathonId}/assignments`
                  )
                }
                className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !selectedJudge ||
                  !selectedRound ||
                  !selectedTeam
                }
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Assigning..."
                  : "Assign Judge"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}