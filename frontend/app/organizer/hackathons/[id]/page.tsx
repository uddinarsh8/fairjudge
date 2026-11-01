
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ======================================================
// TYPES
// ======================================================

type Hackathon = {
  _id: string;
  hackathonId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  isPublished?: boolean;
  setup?: {
    roundsConfigured?: boolean;
    evaluationConfigured?: boolean;
  };
};

type HackathonStats = {
  teams: number;
  judges: number;
  rounds: number;
  evaluations: number;
};

type EvaluationRound = {
  _id: string;
  name?: string;
  roundNumber?: number;
};

type ActionMessage = {
  type: "success" | "error";
  text: string;
};

// ======================================================
// PAGE
// ======================================================

export default function HackathonManagementPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();

  // params.id is the MongoDB _id, not the public hackathon ID.
  const hackathonMongoId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  // ====================================================
  // STATE
  // ====================================================

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);

  const [stats, setStats] = useState<HackathonStats>({
    teams: 0,
    judges: 0,
    rounds: 0,
    evaluations: 0,
  });

  const [roundsConfigured, setRoundsConfigured] = useState(false);
  const [evaluationConfigured, setEvaluationConfigured] =
    useState(false);

  // True when the rounds endpoint was successfully checked.
  // This prevents stale database flags from overriding fresh results.
  const [readinessVerified, setReadinessVerified] = useState(false);

  const [loading, setLoading] = useState(true);
  const [startingEvaluation, setStartingEvaluation] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] =
    useState<ActionMessage | null>(null);

  // ====================================================
  // LOAD HACKATHON, STATS, AND SETUP READINESS
  // ====================================================

  useEffect(() => {
    let cancelled = false;

    const loadHackathonData = async () => {
      if (!token || !hackathonMongoId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setActionMessage(null);

        // -----------------------------------------------
        // 1. Load the hackathon
        // -----------------------------------------------

        const hackathonResponse = await apiRequest(
          `/hackathons/${hackathonMongoId}`,
          { token }
        );

        const loadedHackathon = hackathonResponse?.hackathon;

        if (!loadedHackathon) {
          throw new Error(
            "Hackathon data was not returned by the server."
          );
        }

        if (cancelled) return;

        setHackathon(loadedHackathon);

        // Use stored setup flags as a fallback if the
        // detailed readiness endpoints are unavailable.
        setRoundsConfigured(
          Boolean(loadedHackathon.setup?.roundsConfigured)
        );

        setEvaluationConfigured(
          Boolean(loadedHackathon.setup?.evaluationConfigured)
        );

        // -----------------------------------------------
        // 2. Load dashboard statistics
        // -----------------------------------------------

        try {
          const statsResponse = await apiRequest(
            `/organizer/hackathons/${hackathonMongoId}/stats`,
            { token }
          );

          if (cancelled) return;

          if (statsResponse?.stats) {
            setStats({
              teams: Number(statsResponse.stats.teams ?? 0),
              judges: Number(statsResponse.stats.judges ?? 0),
              rounds: Number(statsResponse.stats.rounds ?? 0),
              evaluations: Number(
                statsResponse.stats.evaluations ?? 0
              ),
            });
          }
        } catch (statsError) {
          console.error("Stats API error:", statsError);
          // A stats failure should not prevent the rest
          // of the dashboard from loading.
        }

        // -----------------------------------------------
        // 3. Verify rounds and criteria
        // -----------------------------------------------

        try {
          const roundsResponse = await apiRequest(
            `/rounds/${hackathonMongoId}`,
            { token }
          );

          const roundList: EvaluationRound[] | null =
            Array.isArray(roundsResponse)
              ? roundsResponse
              : Array.isArray(roundsResponse?.rounds)
                ? roundsResponse.rounds
                : Array.isArray(roundsResponse?.data?.rounds)
                  ? roundsResponse.data.rounds
                  : Array.isArray(roundsResponse?.data)
                    ? roundsResponse.data
                    : null;

          // An unknown response shape is not treated as
          // proof that the hackathon has no rounds.
          if (!roundList) {
            throw new Error(
              "The rounds endpoint returned an unexpected response."
            );
          }

          if (cancelled) return;

          const hasRounds = roundList.length > 0;
          setRoundsConfigured(hasRounds);

          if (!hasRounds) {
            setEvaluationConfigured(false);
            setReadinessVerified(true);
          } else {
            // Every round must report complete criteria.

            const criteriaChecks = await Promise.all(
              roundList.map(async (round) => {
                try {
                  const response = await apiRequest(
                    `/criteria/${hackathonMongoId}/${round._id}`,
                    { token }
                  );

                  // Support direct responses and wrapped responses.
                  const result =
                    response?.data?.data ??
                    response?.data ??
                    response;

                  const criteria = Array.isArray(result?.criteria)
                    ? result.criteria
                    : Array.isArray(response?.criteria)
                      ? response.criteria
                      : [];

                  // Calculate total weight from the saved criteria.
                  const calculatedWeight = criteria.reduce(
                    (total: number, criterion: { weight?: number | string }) =>
                      total + Number(criterion.weight ?? 0),
                    0
                  );

                  const totalWeight =
                    result?.totalWeight != null
                      ? Number(result.totalWeight)
                      : calculatedWeight;

                  const complete =
                    result?.isComplete === true ||
                    response?.isComplete === true ||
                    (
                      criteria.length > 0 &&
                      Number.isFinite(totalWeight) &&
                      Math.abs(totalWeight - 100) < 0.001
                    );

                  console.log("ROUND CRITERIA STATUS", {
                    roundName: round.name,
                    roundNumber: round.roundNumber,
                    roundId: round._id,
                    criteriaCount: criteria.length,
                    totalWeight,
                    complete,
                  });

                  return complete;
                } catch (error) {
                  console.error(
                    `Criteria check failed for round ${round.name ?? round._id}:`,
                    error
                  );

                  return false;
                }
              })
            );

            if (cancelled) return;

            const allRoundsComplete =
              criteriaChecks.length > 0 &&
              criteriaChecks.every(Boolean);

            setEvaluationConfigured(allRoundsComplete);
            setReadinessVerified(true);

            console.log("ALL ROUND CRITERIA COMPLETE:", allRoundsComplete);


            setReadinessVerified(true);
          }
        } catch (readinessError) {
          console.error(
            "Could not verify setup readiness:",
            readinessError
          );

          // Fall back to the persisted setup flags and stats.
          // The backend must still validate everything before
          // starting evaluation.
          if (!cancelled) {
            setReadinessVerified(false);
          }
        }
      } catch (loadError) {
        console.error("Load hackathon error:", loadError);

        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load hackathon."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadHackathonData();

    return () => {
      cancelled = true;
    };
  }, [token, hackathonMongoId]);

  // ====================================================
  // PUBLISH HACKATHON
  // ====================================================

  const handlePublishHackathon = async () => {
    if (!token || !hackathonMongoId || publishing) return;

    setPublishing(true);
    setActionMessage(null);

    try {
      const response = await apiRequest(
        `/hackathons/${hackathonMongoId}/publish`,
        { method: "POST", token }
      );

      if (!response || response.success === false || !response.hackathon) {
        throw new Error(response?.message || "Unable to publish hackathon.");
      }

      setHackathon((current) =>
        current
          ? {
              ...current,
              ...response.hackathon,
              isPublished: true,
              status: response.hackathon.status || "UPCOMING",
            }
          : current
      );
      setActionMessage({
        type: "success",
        text: "Hackathon published. Participants can now find it and register.",
      });
    } catch (publishError) {
      setActionMessage({
        type: "error",
        text:
          publishError instanceof Error
            ? publishError.message
            : "Unable to publish hackathon.",
      });
    } finally {
      setPublishing(false);
    }
  };

  // ====================================================  // START EVALUATION
  // ====================================================

  const handleStartEvaluation = async () => {
    if (!token || !hackathonMongoId) {
      setActionMessage({
        type: "error",
        text: "Authentication required. Please log in again.",
      });
      return;
    }

    if (startingEvaluation) return;

    setStartingEvaluation(true);
    setActionMessage(null);

    try {
      const response = await apiRequest(
        `/hackathons/${hackathonMongoId}/start-evaluation`,
        {
          method: "POST",
          token,
        }
      );

      if (!response || response.success === false || response.error) {
        throw new Error(
          response?.message || "Unable to start evaluation."
        );
      }

      setHackathon((current) => {
        if (!current) return current;

        return {
          ...current,
          ...(response.hackathon ?? {}),
          status: response.hackathon?.status || "ACTIVE",
          isPublished: true,
          setup: {
            ...current.setup,
            ...(response.hackathon?.setup ?? {}),
            roundsConfigured: true,
            evaluationConfigured: true,
          },
        };
      });

      setRoundsConfigured(true);
      setEvaluationConfigured(true);
      setReadinessVerified(true);

      setActionMessage({
        type: "success",
        text:
          response.message ||
          "Evaluation started successfully.",
      });

      // Refresh statistics without undoing a successful start
      // if the statistics endpoint is temporarily unavailable.
      try {
        const statsResponse = await apiRequest(
          `/organizer/hackathons/${hackathonMongoId}/stats`,
          { token }
        );

        if (statsResponse?.stats) {
          setStats({
            teams: Number(statsResponse.stats.teams ?? 0),
            judges: Number(statsResponse.stats.judges ?? 0),
            rounds: Number(statsResponse.stats.rounds ?? 0),
            evaluations: Number(
              statsResponse.stats.evaluations ?? 0
            ),
          });
        }
      } catch (statsError) {
        console.error(
          "Could not refresh stats after starting evaluation:",
          statsError
        );
      }
    } catch (startError) {
      console.error("Start evaluation error:", startError);

      setActionMessage({
        type: "error",
        text:
          startError instanceof Error
            ? startError.message
            : "Unable to start evaluation. Please try again.",
      });
    } finally {
      setStartingEvaluation(false);
    }
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading hackathon...
      </main>
    );
  }

  // ====================================================
  // ERROR
  // ====================================================

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <h2 className="text-xl font-semibold text-red-400">
              Unable to load hackathon
            </h2>

            <p className="mt-2 text-sm text-red-300">{error}</p>

            <button
              onClick={() => router.push("/organizer/hackathons")}
              className="mt-5 rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
            >
              ← Back to Hackathons
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ====================================================
  // NOT FOUND
  // ====================================================

  if (!hackathon) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Hackathon not found.
      </main>
    );
  }

  // ====================================================
  // DERIVED READINESS
  // ====================================================

  const publicHackathonId = hackathon.hackathonId;

  const isActive = hackathon.status === "ACTIVE";
  const isCompleted = hackathon.status === "COMPLETED";

  // When live readiness checks succeeded, use their results.
  // Otherwise, use the persisted flags and stats as a fallback.
  const roundsReady = readinessVerified
    ? roundsConfigured
    : Boolean(hackathon.setup?.roundsConfigured) ||
    stats.rounds > 0;

  const criteriaReady = readinessVerified
    ? evaluationConfigured
    : Boolean(hackathon.setup?.evaluationConfigured);

  const teamsReady = stats.teams > 0;
  const judgesReady = stats.judges > 0;

  // These frontend checks help guide the organizer.
  // The backend must also validate approved teams, submitted
  // projects, scoring criteria, and judge assignments.
  const canStartEvaluation =
    roundsReady &&
    criteriaReady &&
    teamsReady &&
    judgesReady &&
    !isActive &&
    !isCompleted;

  const completedSteps = [
    true,
    roundsReady,
    criteriaReady,
    teamsReady,
    judgesReady,
    isActive || isCompleted,
  ].filter(Boolean).length;

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-8">
          <button
            onClick={() => router.push("/organizer/hackathons")}
            className="mb-5 text-sm text-slate-400 hover:text-white"
          >
            ← My Hackathons
          </button>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold">
                  {hackathon.name}
                </h1>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${isActive
                      ? "bg-green-500/10 text-green-400"
                      : isCompleted
                        ? "bg-slate-700 text-slate-300"
                        : "bg-blue-500/10 text-blue-400"
                    }`}
                >
                  {hackathon.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">
                  Hackathon ID:
                </span>

                <span className="rounded-md border border-blue-500/20 bg-blue-500/5 px-2.5 py-1 font-mono text-xs font-medium text-blue-400">
                  {publicHackathonId || "Not generated"}
                </span>
              </div>

              <p className="mt-3 max-w-3xl text-slate-400">
                {hackathon.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-500">
                <span>
                  Start:{" "}
                  {new Date(hackathon.startDate).toLocaleString()}
                </span>

                <span>
                  End:{" "}
                  {new Date(hackathon.endDate).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/settings`
                )
              }
              className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium hover:bg-slate-800"
            >
              Hackathon Settings
            </button>
          </div>
        </div>

        {/* LIVE STATISTICS */}

        <div className="grid gap-5 md:grid-cols-4">
          <StatCard
            title="Teams"
            value={stats.teams.toString()}
            description="Registered teams"
          />

          <StatCard
            title="Judges"
            value={stats.judges.toString()}
            description="Registered judges"
          />

          <StatCard
            title="Rounds"
            value={stats.rounds.toString()}
            description="Evaluation rounds"
          />

          <StatCard
            title="Evaluations"
            value={stats.evaluations.toString()}
            description="Submitted evaluations"
          />
        </div>

        {/* ACTION MESSAGE */}

        {actionMessage && (
          <div
            role="status"
            className={`mt-6 rounded-xl border p-4 ${actionMessage.type === "success"
                ? "border-green-500/30 bg-green-500/10 text-green-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
          >
            <p className="text-sm">{actionMessage.text}</p>
          </div>
        )}

        {!hackathon.isPublished && (
          <section className="mt-6 flex flex-col gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-white">Publish for participant submissions</h2>
              <p className="mt-1 text-sm text-slate-400">
                Publish with your basic event details. You can add rounds and configure each round’s criteria later, before evaluation starts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handlePublishHackathon()}
              disabled={publishing}
              className="shrink-0 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {publishing ? "Publishing..." : "Publish Hackathon"}
            </button>
          </section>
        )}
        {/* SETUP PROGRESS */}

        <section className="mt-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-blue-400">
                HACKATHON SETUP
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Setup Progress
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Complete these steps to prepare your hackathon
                for evaluation.
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2">
              <span className="text-sm text-slate-400">
                Progress
              </span>

              <span className="ml-2 text-sm font-semibold text-white">
                {completedSteps} / 6
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* STEP 1 */}

            <SetupStep
              number="01"
              title="Create Hackathon"
              description="Basic hackathon information has been configured."
              status="Complete"
              complete
            />

            {/* STEP 2 */}

            <SetupStep
              number="02"
              title="Create Evaluation Rounds"
              description="Define the different rounds for your hackathon."
              status={roundsReady ? "Complete" : "Pending"}
              complete={roundsReady}
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/rounds`
                )
              }
            />

            {/* STEP 3 */}

            <SetupStep
              number="03"
              title="Configure Scoring Criteria"
              description="Configure criteria and scoring levels for every round."
              status={criteriaReady ? "Complete" : "Pending"}
              complete={criteriaReady}
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/rounds`
                )
              }
            />

            {/* STEP 4 */}

            <SetupStep
              number="04"
              title="Manage Teams"
              description="Review registered teams and submitted projects."
              status={teamsReady ? "Ready" : "Pending"}
              complete={teamsReady}
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${publicHackathonId}/teams`
                )
              }
            />

            {/* STEP 5 */}

            <SetupStep
              number="05"
              title="Assign Judges"
              description="Assign judges to teams and evaluation rounds."
              status={judgesReady ? "Ready" : "Pending"}
              complete={judgesReady}
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/assignments`
                )
              }
            />

            {/* STEP 6 */}

            <SetupStep
              number="06"
              title={
                isCompleted
                  ? "Evaluation Completed"
                  : isActive
                    ? "Evaluation Started"
                    : "Start Evaluation"
              }
              description={
                isCompleted
                  ? "This hackathon's evaluation has been completed."
                  : isActive
                    ? "Evaluation is currently active."
                    : "Start evaluation after completing the required setup."
              }
              status={
                isCompleted || isActive
                  ? "Complete"
                  : startingEvaluation
                    ? "Starting..."
                    : canStartEvaluation
                      ? "Ready"
                      : "Locked"
              }
              complete={isActive || isCompleted}
              disabled={!canStartEvaluation || startingEvaluation}
              loading={startingEvaluation}
              actionLabel="Start Evaluation"
              onClick={() => void handleStartEvaluation()}
            />
          </div>

          {!isActive && !isCompleted && (
            <p className="mt-4 text-sm text-slate-500">
              {canStartEvaluation
                ? "The basic setup checks have passed. The server will validate the required teams, projects, criteria, and judge assignments before starting."
                : "Start Evaluation will unlock when the required setup checks are complete."}
            </p>
          )}
        </section>

        {/* HACKATHON CONFIGURATION */}

        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            Hackathon Configuration
          </h2>

          <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <ManagementCard
              icon="🔄"
              title="Evaluation Rounds"
              description="Create and manage different evaluation rounds."
              action="Manage Rounds"
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/rounds`
                )
              }
            />

            <ManagementCard
              icon="📊"
              title="Scoring Criteria"
              description="Define standardized criteria and scoring levels for each round."
              action="Configure Criteria"
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/rounds`
                )
              }
            />

            <ManagementCard
              icon="⚖️"
              title="Judge Assignments"
              description="Assign judges to teams and evaluation rounds."
              action="Manage Assignments"
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/assignments`
                )
              }
            />

            <ManagementCard
              icon="👥"
              title="Teams"
              description="View registered teams and their submitted projects."
              action="Manage Teams"
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${publicHackathonId}/teams`
                )
              }
            />

            <ManagementCard
              icon="📋"
              title="Evaluations"
              description="View submitted judge evaluations and integrity records."
              action="View Evaluations"
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/evaluations`
                )
              }
            />

            <ManagementCard
              icon="🏆"
              title="Leaderboard"
              description="View final rankings calculated from locked evaluations."
              action="View Leaderboard"
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/leaderboard`
                )
              }
            />
          </div>
        </section>

        {/* JUDGE ASSIGNMENT */}

        <section className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚖️</span>

                <h2 className="text-xl font-semibold">
                  Judge Assignment
                </h2>
              </div>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Assign judges to specific teams and evaluation
                rounds. Judges should only evaluate projects
                assigned to them.
              </p>
            </div>

            <button
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/assignments`
                )
              }
              className="whitespace-nowrap rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
            >
              Manage Judges
            </button>
          </div>
        </section>

        {/* LEADERBOARD */}

        <section className="mt-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>

                <h2 className="text-xl font-semibold">
                  Final Rankings
                </h2>
              </div>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                View team rankings calculated from locked judge
                evaluations.
              </p>
            </div>

            <button
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/leaderboard`
                )
              }
              className="whitespace-nowrap rounded-lg bg-yellow-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-yellow-400"
            >
              View Leaderboard
            </button>
          </div>
        </section>

        {/* INTEGRITY */}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>

                <h2 className="text-xl font-semibold">
                  Evaluation Integrity
                </h2>
              </div>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                Submitted judge evaluations should remain
                immutable. Organizers can view evaluation records
                and audit information without silently changing
                submitted scores.
              </p>
            </div>

            <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-5 py-4">
              <p className="text-sm font-medium text-green-400">
                Integrity Protection
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Enabled
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// ======================================================
// STAT CARD
// ======================================================

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{title}</p>

      <p className="mt-2 text-2xl font-bold">{value}</p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

// ======================================================
// MANAGEMENT CARD
// ======================================================

function ManagementCard({
  icon,
  title,
  description,
  action,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <span className="text-2xl">{icon}</span>

        <button
          onClick={onClick}
          className="text-sm font-medium text-blue-400 hover:text-blue-300"
        >
          {action} →
        </button>
      </div>

      <h3 className="mt-5 text-lg font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}

// ======================================================
// SETUP STEP
// ======================================================

function SetupStep({
  number,
  title,
  description,
  status,
  complete = false,
  disabled = false,
  loading = false,
  actionLabel = "Configure",
  onClick,
}: {
  number: string;
  title: string;
  description: string;
  status: string;
  complete?: boolean;
  disabled?: boolean;
  loading?: boolean;
  actionLabel?: string;
  onClick?: () => void;
}) {
  const statusStyles = complete
    ? "border-green-500/30 bg-green-500/10 text-green-400"
    : status === "Locked"
      ? "border-slate-700 bg-slate-800 text-slate-500"
      : status === "Starting..."
        ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
        : "border-blue-500/30 bg-blue-500/10 text-blue-400";

  return (
    <div
      className={`group rounded-2xl border p-5 transition ${complete
          ? "border-green-500/20 bg-slate-900"
          : "border-slate-800 bg-slate-900 hover:border-blue-500/40"
        }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${complete
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-slate-700 bg-slate-800 text-slate-300"
            }`}
        >
          {complete ? "✓" : number}
        </div>

        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles}`}
        >
          {status}
        </span>
      </div>

      <h3 className="mt-5 text-base font-semibold text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {description}
      </p>

      {onClick && !complete && (
        <button
          onClick={onClick}
          disabled={disabled}
          className={`mt-5 text-sm font-medium transition ${disabled
              ? "cursor-not-allowed text-slate-600"
              : "text-blue-400 hover:text-blue-300"
            }`}
        >
          {loading ? "Starting..." : `${actionLabel} →`}
        </button>
      )}
    </div>
  );
}
