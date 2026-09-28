"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import { useParams, useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ======================================================
// TYPES
// ======================================================

type Round = {
  _id: string;
  name: string;
  roundNumber: number;
};

type Judge = {
  _id: string;
  name: string;
  email: string;
  role?: string;
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
  leader?: string;
  project?: Project | null;
};

type Assignment = {
  _id: string;

  judge?: {
    _id: string;
    name: string;
    email: string;
  };

  team?: {
    _id: string;
    name: string;
  };

  project?: {
    _id: string;
    projectName: string;
  };

  round?: {
    _id: string;
    name: string;
    roundNumber: number;
  };
};

// ======================================================
// PAGE
// ======================================================

export default function AssignmentsPage() {
  const router = useRouter();
  const params = useParams();

  // IMPORTANT:
  // authLoading tells us whether AuthContext has finished
  // restoring the JWT from localStorage.
  const {
    token: authToken,
    loading: authLoading,
  } = useAuth();

  const hackathonId = params.id as string;

  // ======================================================
  // STATE
  // ======================================================

  const [token, setToken] = useState<string | null>(
    null
  );

  const [rounds, setRounds] = useState<Round[]>([]);

  const [judges, setJudges] = useState<Judge[]>([]);

  const [teams, setTeams] = useState<Team[]>([]);

  const [assignments, setAssignments] = useState<
    Assignment[]
  >([]);

  const [selectedRound, setSelectedRound] =
    useState("");

  const [selectedJudge, setSelectedJudge] =
    useState("");

  const [selectedTeam, setSelectedTeam] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  // ======================================================
  // AUTHENTICATION
  // ======================================================

  useEffect(() => {
    // Do nothing while AuthContext is restoring
    // authentication from localStorage.
    if (authLoading) {
      return;
    }

    // Prefer the token from AuthContext.
    if (authToken) {
      setToken(authToken);
      return;
    }

    // Fallback for existing sessions.
    //
    // Your AuthContext stores the JWT using:
    // "fairjudge_token"
    //
    // Some older pages in the project use:
    // "token"
    //
    // Supporting both prevents authentication mismatch.
    const storedToken =
      localStorage.getItem("fairjudge_token") ||
      localStorage.getItem("token");

    if (storedToken) {
      console.log(
        "Assignments: JWT found in localStorage."
      );

      setToken(storedToken);
    } else {
      console.error(
        "Assignments: No authentication token found."
      );

      setError(
        "Authentication token not available. Please log in again."
      );

      setLoading(false);
    }
  }, [authToken, authLoading]);

  // ======================================================
  // LOAD ROUNDS + ASSIGNMENTS
  // ======================================================

  const loadData = useCallback(
    async (currentToken?: string) => {
      const activeToken =
        currentToken ||
        token ||
        localStorage.getItem(
          "fairjudge_token"
        ) ||
        localStorage.getItem("token");

      if (!hackathonId) {
        setError(
          "Hackathon ID is missing."
        );

        setLoading(false);

        return;
      }

      if (!activeToken) {
        setError(
          "Authentication token not available. Please log in again."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log(
          "================================="
        );

        console.log(
          "Assignments Page: Loading data"
        );

        console.log(
          "Hackathon ID:",
          hackathonId
        );

        console.log(
          "Token available:",
          Boolean(activeToken)
        );

        console.log(
          "================================="
        );

        const [
          roundsResponse,
          assignmentsResponse,
        ] = await Promise.all([
          apiRequest(
            `/rounds/${hackathonId}`,
            {
              method: "GET",
              token: activeToken,
            }
          ),

          apiRequest(
            `/assignments/hackathon/${hackathonId}`,
            {
              method: "GET",
              token: activeToken,
            }
          ),
        ]);

        console.log(
          "Rounds API response:",
          roundsResponse
        );

        console.log(
          "Assignments API response:",
          assignmentsResponse
        );

        const fetchedRounds =
          Array.isArray(
            roundsResponse?.rounds
          )
            ? roundsResponse.rounds
            : [];

        const fetchedAssignments =
          Array.isArray(
            assignmentsResponse?.assignments
          )
            ? assignmentsResponse.assignments
            : [];

        setRounds(fetchedRounds);

        setAssignments(
          fetchedAssignments
        );

        // Automatically select first round.
        if (
          fetchedRounds.length > 0 &&
          !selectedRound
        ) {
          setSelectedRound(
            fetchedRounds[0]._id
          );
        }
      } catch (error) {
        console.error(
          "Load assignment data error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load assignment data."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      token,
      hackathonId,
      selectedRound,
    ]
  );

  // ======================================================
  // LOAD JUDGES
  // ======================================================

  const loadJudges = useCallback(
    async (currentToken?: string) => {
      const activeToken =
        currentToken ||
        token ||
        localStorage.getItem(
          "fairjudge_token"
        ) ||
        localStorage.getItem("token");

      if (!activeToken) {
        return;
      }

      try {
        console.log(
          "Assignments: Loading judges..."
        );

        const response =
          await apiRequest(
            "/organizer/judges",
            {
              method: "GET",
              token: activeToken,
            }
          );

        console.log(
          "Judges API response:",
          response
        );

        const fetchedJudges =
          response?.judges ||
          response?.users ||
          [];

        setJudges(
          Array.isArray(fetchedJudges)
            ? fetchedJudges
            : []
        );
      } catch (error) {
        console.error(
          "Unable to load judges:",
          error
        );

        // Do not overwrite the main error
        // if rounds/assignments already loaded.
        if (!judges.length) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load judges."
          );
        }
      }
    },
    [token, judges.length]
  );

  // ======================================================
  // LOAD HACKATHON TEAMS
  // ======================================================

  const loadTeams = useCallback(
    async (currentToken?: string) => {
      const activeToken =
        currentToken ||
        token ||
        localStorage.getItem(
          "fairjudge_token"
        ) ||
        localStorage.getItem("token");

      if (
        !activeToken ||
        !hackathonId
      ) {
        return;
      }

      try {
        console.log(
          "Assignments: Loading teams..."
        );

        const response =
          await apiRequest(
            `/organizer/hackathons/${hackathonId}/teams`,
            {
              method: "GET",
              token: activeToken,
            }
          );

        console.log(
          "Teams API response:",
          response
        );

        const fetchedTeams =
          response?.teams || [];

        setTeams(
          Array.isArray(fetchedTeams)
            ? fetchedTeams
            : []
        );
      } catch (error) {
        console.error(
          "Unable to load teams:",
          error
        );

        if (!teams.length) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load teams."
          );
        }
      }
    },
    [token, hackathonId, teams.length]
  );

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {
    // VERY IMPORTANT:
    // Never make API requests before AuthContext
    // finishes restoring the JWT.

    if (authLoading) {
      return;
    }

    if (!hackathonId) {
      setError(
        "Hackathon ID is missing."
      );

      setLoading(false);

      return;
    }

    const activeToken =
      authToken ||
      localStorage.getItem(
        "fairjudge_token"
      ) ||
      localStorage.getItem("token");

    if (!activeToken) {
      setError(
        "Authentication token not available. Please log in again."
      );

      setLoading(false);

      return;
    }

    setToken(activeToken);

    // Load everything after authentication
    // has definitely been restored.
    loadData(activeToken);
    loadJudges(activeToken);
    loadTeams(activeToken);
  }, [
    authLoading,
    authToken,
    hackathonId,
    loadData,
    loadJudges,
    loadTeams,
  ]);

  // ======================================================
  // CREATE ASSIGNMENT
  // ======================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    const activeToken =
      token ||
      authToken ||
      localStorage.getItem(
        "fairjudge_token"
      ) ||
      localStorage.getItem("token");

    if (!activeToken) {
      setError(
        "Authentication required. Please log in again."
      );

      return;
    }

    if (!hackathonId) {
      setError(
        "Hackathon ID is missing."
      );

      return;
    }

    if (!selectedRound) {
      setError(
        "Please select an evaluation round."
      );

      return;
    }

    if (!selectedJudge) {
      setError(
        "Please select a judge."
      );

      return;
    }

    if (!selectedTeam) {
      setError(
        "Please select a team."
      );

      return;
    }

    try {
      setSubmitting(true);

      console.log(
        "Creating assignment:",
        {
          hackathonId,
          roundId: selectedRound,
          judgeId: selectedJudge,
          teamId: selectedTeam,
        }
      );

      await apiRequest(
        "/assignments",
        {
          method: "POST",
          token: activeToken,
          body: {
            hackathonId,
            roundId: selectedRound,
            judgeId: selectedJudge,
            teamId: selectedTeam,
          },
        }
      );

      // Reset judge/team.
      setSelectedJudge("");
      setSelectedTeam("");

      // Reload assignments.
      await loadData(activeToken);
    } catch (error) {
      console.error(
        "Create assignment error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to create assignment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ======================================================
  // DELETE ASSIGNMENT
  // ======================================================

  const handleDelete = async (
    assignment: Assignment
  ) => {
    const activeToken =
      token ||
      authToken ||
      localStorage.getItem(
        "fairjudge_token"
      ) ||
      localStorage.getItem("token");

    if (!activeToken) {
      setError(
        "Authentication required. Please log in again."
      );

      return;
    }

    if (!assignment._id) {
      return;
    }

    const judgeName =
      assignment.judge?.name ||
      "this judge";

    const teamName =
      assignment.team?.name ||
      "this team";

    const confirmed =
      window.confirm(
        `Remove ${judgeName} from ${teamName}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        assignment._id
      );

      setError("");

      await apiRequest(
        `/assignments/${assignment._id}`,
        {
          method: "DELETE",
          token: activeToken,
        }
      );

      await loadData(activeToken);
    } catch (error) {
      console.error(
        "Delete assignment error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to remove assignment."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ======================================================
  // AUTH LOADING
  // ======================================================

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

          <p>
            Restoring authentication...
          </p>
        </div>
      </main>
    );
  }

  // ======================================================
  // DATA LOADING
  // ======================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

          <p>
            Loading assignments...
          </p>
        </div>
      </main>
    );
  }

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">

        {/* ==================================================
            BACK
        ================================================== */}

        <button
          type="button"
          onClick={() =>
            router.push(
              `/organizer/hackathons/${hackathonId}`
            )
          }
          className="mb-6 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Hackathon
        </button>

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">
            Evaluation Management
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Judge Assignments
          </h1>

          <p className="mt-2 max-w-2xl text-slate-400">
            Assign judges to teams for specific
            evaluation rounds.
          </p>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-red-400">
                {error}
              </p>

              {error.toLowerCase().includes(
                "authentication"
              ) && (
                <button
                  type="button"
                  onClick={() =>
                    router.push("/login")
                  }
                  className="w-fit rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/30"
                >
                  Go to Login
                </button>
              )}
            </div>
          </div>
        )}

        {/* ==================================================
            CREATE ASSIGNMENT
        ================================================== */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Create Assignment
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Select a round, judge and team.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 md:grid-cols-3"
          >

            {/* ==================================================
                ROUND
            ================================================== */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Evaluation Round
              </label>

              <select
                required
                value={selectedRound}
                onChange={(event) =>
                  setSelectedRound(
                    event.target.value
                  )
                }
                disabled={
                  submitting ||
                  rounds.length === 0
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  Select round
                </option>

                {rounds.map(
                  (round) => (
                    <option
                      key={round._id}
                      value={round._id}
                    >
                      Round{" "}
                      {round.roundNumber}:{" "}
                      {round.name}
                    </option>
                  )
                )}
              </select>

              {rounds.length === 0 && (
                <p className="mt-2 text-xs text-yellow-500">
                  No rounds have been created yet.
                </p>
              )}
            </div>

            {/* ==================================================
                JUDGE
            ================================================== */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Judge
              </label>

              <select
                required
                value={selectedJudge}
                onChange={(event) =>
                  setSelectedJudge(
                    event.target.value
                  )
                }
                disabled={
                  submitting ||
                  judges.length === 0
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  Select judge
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
                <p className="mt-2 text-xs text-yellow-500">
                  No judges available.
                </p>
              )}
            </div>

            {/* ==================================================
                TEAM
            ================================================== */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Team
              </label>

              <select
                required
                value={selectedTeam}
                onChange={(event) =>
                  setSelectedTeam(
                    event.target.value
                  )
                }
                disabled={
                  submitting ||
                  teams.length === 0
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  Select team
                </option>

                {teams.map(
                  (team) => (
                    <option
                      key={team._id}
                      value={team._id}
                    >
                      {team.name}
                      {team.project
                        ? ` — ${team.project.projectName}`
                        : ""}
                    </option>
                  )
                )}
              </select>

              {teams.length === 0 && (
                <p className="mt-2 text-xs text-yellow-500">
                  No teams registered for this hackathon.
                </p>
              )}
            </div>

            {/* ==================================================
                SUBMIT
            ================================================== */}

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={
                  submitting ||
                  !token ||
                  rounds.length === 0 ||
                  judges.length === 0 ||
                  teams.length === 0
                }
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Assigning..."
                  : "Assign Judge"}
              </button>
            </div>

          </form>
        </section>

        {/* ==================================================
            EXISTING ASSIGNMENTS
        ================================================== */}

        <section className="mt-8">

          <div className="mb-5 flex items-center justify-between">

            <div>
              <h2 className="text-xl font-semibold">
                Existing Assignments
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Judges currently assigned to teams.
              </p>
            </div>

            <span className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-400">
              {assignments.length}{" "}
              assignment
              {assignments.length !== 1
                ? "s"
                : ""}
            </span>

          </div>

          {/* ==================================================
              EMPTY STATE
          ================================================== */}

          {assignments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">

              <div className="text-5xl">
                👨‍⚖️
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                No assignments yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your first judge assignment
                using the form above.
              </p>

            </div>
          ) : (

            /* ==================================================
               ASSIGNMENT LIST
            ================================================== */

            <div className="space-y-4">

              {assignments.map(
                (
                  assignment,
                  index
                ) => (

                  <div
                    key={
                      assignment._id
                    }
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                  >

                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">

                      <div className="flex gap-4">

                        {/* NUMBER */}

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-bold text-blue-400">
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </div>

                        <div className="grid gap-5 md:grid-cols-3">

                          {/* ==================================================
                              ROUND
                          ================================================== */}

                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Round
                            </p>

                            <p className="mt-1 font-semibold">
                              Round{" "}
                              {
                                assignment
                                  .round
                                  ?.roundNumber
                              }
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                              {
                                assignment
                                  .round
                                  ?.name
                              }
                            </p>
                          </div>

                          {/* ==================================================
                              JUDGE
                          ================================================== */}

                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Judge
                            </p>

                            <p className="mt-1 font-semibold">
                              {
                                assignment
                                  .judge
                                  ?.name ||
                                "Unknown Judge"
                              }
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {
                                assignment
                                  .judge
                                  ?.email
                              }
                            </p>
                          </div>

                          {/* ==================================================
                              TEAM
                          ================================================== */}

                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Team
                            </p>

                            <p className="mt-1 font-semibold">
                              {
                                assignment
                                  .team
                                  ?.name ||
                                "Unknown Team"
                              }
                            </p>

                            {assignment.project && (
                              <p className="mt-1 text-sm text-slate-500">
                                {
                                  assignment
                                    .project
                                    .projectName
                                }
                              </p>
                            )}
                          </div>

                        </div>
                      </div>

                      {/* ==================================================
                          DELETE
                      ================================================== */}

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            assignment
                          )
                        }
                        disabled={
                          deletingId ===
                          assignment._id
                        }
                        className="shrink-0 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId ===
                        assignment._id
                          ? "Removing..."
                          : "Remove"}
                      </button>

                    </div>
                  </div>
                )
              )}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}