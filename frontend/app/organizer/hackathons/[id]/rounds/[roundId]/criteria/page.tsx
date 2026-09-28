"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { apiRequest } from "@/lib/api";

type ScoringLevel = {
  name: "BEST" | "GOOD" | "AVERAGE" | "POOR" | "WORST";
  score: number;
  description: string;
};

type Criterion = {
  _id: string;
  name: string;
  description?: string;
  weight: number;
  scoringLevels: ScoringLevel[];
};

const defaultScoringLevels: ScoringLevel[] = [
  {
    name: "BEST",
    score: 5,
    description: "",
  },
  {
    name: "GOOD",
    score: 4,
    description: "",
  },
  {
    name: "AVERAGE",
    score: 3,
    description: "",
  },
  {
    name: "POOR",
    score: 2,
    description: "",
  },
  {
    name: "WORST",
    score: 1,
    description: "",
  },
];

export default function CriteriaPage() {
  const router = useRouter();
  const params = useParams();

  const hackathonId = params.id as string;
  const roundId = params.roundId as string;

  // ==========================================
  // AUTH TOKEN
  // ==========================================

 const [token, setToken] = useState<string | null>(null);
const [authLoading, setAuthLoading] = useState(true);

useEffect(() => {
  const storedToken =
    localStorage.getItem("fairjudge_token") ||
    localStorage.getItem("token");

  setToken(storedToken);
  setAuthLoading(false);
}, []);

  // ==========================================
  // STATES
  // ==========================================

  const [criteria, setCriteria] = useState<Criterion[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");

  const [scoringLevels, setScoringLevels] =
    useState<ScoringLevel[]>(defaultScoringLevels);

  // ==========================================
  // LOAD CRITERIA
  // ==========================================

  const loadCriteria = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!hackathonId) {
      setError("Hackathon ID is missing.");
      setLoading(false);
      return;
    }

    if (!roundId) {
      setError("Round ID is missing.");
      setLoading(false);
      return;
    }

    if (!token) {
      setError(
        "Authentication required. Please log in again."
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await apiRequest(
        `/criteria/${hackathonId}/${roundId}`,
        {
          method: "GET",
          token,
        }
      );

      setCriteria(response.criteria || []);
    } catch (error) {
      console.error("Load criteria error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load scoring criteria."
      );
    } finally {
      setLoading(false);
    }
  }, [
    token,
    hackathonId,
    roundId,
    authLoading,
  ]);

  // ==========================================
  // LOAD WHEN READY
  // ==========================================

  useEffect(() => {
    loadCriteria();
  }, [loadCriteria]);

  // ==========================================
  // TOTAL WEIGHT
  // ==========================================

  const totalWeight = criteria.reduce(
    (total, criterion) =>
      total + Number(criterion.weight || 0),
    0
  );

  const remainingWeight = Math.max(
    0,
    100 - totalWeight
  );

  // ==========================================
  // CRITERIA COMPLETE CHECK
  // ==========================================

  const criteriaComplete =
    criteria.length > 0 &&
    Math.round(totalWeight * 100) / 100 === 100;

  // ==========================================
  // GO TO JUDGE ASSIGNMENT
  // ==========================================

  const handleContinueToJudges = () => {
    setError("");

    if (!criteria.length) {
      setError(
        "Please add at least one scoring criterion before continuing."
      );
      return;
    }

    if (totalWeight !== 100) {
      setError(
        `Criteria weights must total exactly 100%. Current total is ${totalWeight}%.`
      );
      return;
    }

    router.push(
      `/organizer/hackathons/${hackathonId}/assignments`
    );
  };

  // ==========================================
  // UPDATE SCORING LEVEL
  // ==========================================

  const updateScoringLevel = (
    index: number,
    field: "score" | "description",
    value: string
  ) => {
    setScoringLevels((previous) =>
      previous.map((level, levelIndex) => {
        if (levelIndex !== index) {
          return level;
        }

        return {
          ...level,
          [field]:
            field === "score"
              ? Number(value)
              : value,
        };
      })
    );
  };

  // ==========================================
  // CREATE CRITERION
  // ==========================================

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (authLoading) {
      setError(
        "Authentication is still loading. Please wait."
      );
      return;
    }

    if (!token) {
      setError(
        "Authentication required. Please log in again."
      );
      return;
    }

    if (!hackathonId) {
      setError("Hackathon ID is missing.");
      return;
    }

    if (!roundId) {
      setError("Round ID is missing.");
      return;
    }

    if (!name.trim()) {
      setError("Criterion name is required.");
      return;
    }

    if (!weight || Number(weight) <= 0) {
      setError(
        "Please enter a valid weight greater than 0."
      );
      return;
    }

    if (Number(weight) > 100) {
      setError(
        "Criterion weight cannot be greater than 100%."
      );
      return;
    }

    if (
      totalWeight + Number(weight) >
      100
    ) {
      setError(
        `Total criteria weight cannot exceed 100%. Only ${remainingWeight}% is available.`
      );
      return;
    }

    for (const level of scoringLevels) {
      if (!level.description.trim()) {
        setError(
          `Description is required for ${level.name}.`
        );
        return;
      }

      if (
        !Number.isFinite(
          Number(level.score)
        )
      ) {
        setError(
          `Please enter a valid score for ${level.name}.`
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      setError("");

      await apiRequest("/criteria", {
        method: "POST",
        token,
        body: {
          hackathonId,
          roundId,
          name: name.trim(),
          description: description.trim(),
          weight: Number(weight),
          scoringLevels: scoringLevels.map(
            (level) => ({
              name: level.name,
              score: Number(level.score),
              description:
                level.description.trim(),
            })
          ),
        },
      });

      // RESET FORM

      setName("");
      setDescription("");
      setWeight("");

      setScoringLevels(
        defaultScoringLevels.map(
          (level) => ({
            ...level,
          })
        )
      );

      // RELOAD CRITERIA

      await loadCriteria();
    } catch (error) {
      console.error(
        "Create criterion error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to create scoring criterion."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // AUTH LOADING
  // ==========================================

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Checking authentication...
      </main>
    );
  }

  // ==========================================
  // PAGE LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading scoring criteria...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        {/* BACK BUTTON */}

        <button
          type="button"
          onClick={() =>
            router.push(
              `/organizer/hackathons/${hackathonId}/rounds/${roundId}`
            )
          }
          className="mb-6 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Round
        </button>

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

          <div>
            <p className="text-sm font-semibold text-blue-400">
              EVALUATION CONFIGURATION
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Scoring Criteria
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Define the evaluation criteria and scoring
              levels that judges will use for this round.
            </p>
          </div>

          {/* TOTAL WEIGHT */}

          <div
            className={`rounded-xl border px-5 py-3 ${
              criteriaComplete
                ? "border-green-500/30 bg-green-500/10"
                : "border-slate-800 bg-slate-900"
            }`}
          >
            <p className="text-xs text-slate-500">
              Total Weight
            </p>

            <p
              className={`mt-1 text-xl font-bold ${
                criteriaComplete
                  ? "text-green-400"
                  : "text-white"
              }`}
            >
              {totalWeight}
              <span className="text-sm text-slate-500">
                {" "} / 100%
              </span>
            </p>
          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-5">

          {/* CREATE FORM */}

          <section className="lg:col-span-2">

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <h2 className="text-lg font-semibold">
                Add Scoring Criterion
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Configure a criterion and its five scoring
                levels.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-6"
              >

                {/* NAME */}

                <div>
                  <label className="text-sm font-medium text-slate-200">
                    Criterion Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="e.g. Innovation"
                    disabled={
                      submitting || !token
                    }
                    required
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* DESCRIPTION */}

                <div className="mt-5">
                  <label className="text-sm font-medium text-slate-200">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                    rows={3}
                    disabled={
                      submitting || !token
                    }
                    placeholder="Explain what judges should evaluate..."
                    className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* WEIGHT */}

                <div className="mt-5">
                  <label className="text-sm font-medium text-slate-200">
                    Weight (%)
                  </label>

                  <input
                    type="number"
                    min="1"
                    max={remainingWeight}
                    value={weight}
                    onChange={(e) =>
                      setWeight(
                        e.target.value
                      )
                    }
                    placeholder="e.g. 25"
                    disabled={
                      submitting ||
                      !token ||
                      remainingWeight <= 0
                    }
                    required
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Remaining available weight:{" "}
                    {remainingWeight}%
                  </p>
                </div>

                {/* SCORING LEVELS */}

                <div className="mt-7">

                  <h3 className="text-sm font-semibold text-white">
                    Scoring Levels
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Define how judges should score this criterion.
                  </p>

                  <div className="mt-4 space-y-4">

                    {scoringLevels.map(
                      (level, index) => (
                        <div
                          key={level.name}
                          className="rounded-xl border border-slate-700 bg-slate-950 p-4"
                        >

                          <div className="flex items-center justify-between gap-4">

                            <p className="text-sm font-semibold text-blue-400">
                              {level.name}
                            </p>

                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={level.score}
                              onChange={(e) =>
                                updateScoringLevel(
                                  index,
                                  "score",
                                  e.target.value
                                )
                              }
                              disabled={
                                submitting ||
                                !token
                              }
                              className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />

                          </div>

                          <textarea
                            value={
                              level.description
                            }
                            onChange={(e) =>
                              updateScoringLevel(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            rows={2}
                            required
                            disabled={
                              submitting ||
                              !token
                            }
                            placeholder={`Describe ${level.name.toLowerCase()} performance...`}
                            className="mt-3 w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none placeholder:text-slate-600 focus:border-blue-500"
                          />

                        </div>
                      )
                    )}

                  </div>
                </div>

                {/* ADD BUTTON */}

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !token ||
                    remainingWeight <= 0
                  }
                  className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Adding Criterion..."
                    : "+ Add Criterion"}
                </button>

              </form>

            </div>

          </section>

          {/* CRITERIA LIST */}

          <section className="lg:col-span-3">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold">
                  Configured Criteria
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  These criteria will be used to evaluate
                  projects in this round.
                </p>
              </div>

              <span className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-400">
                {criteria.length} Criteria
              </span>

            </div>

            {/* NO CRITERIA */}

            {criteria.length === 0 ? (

              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">

                <div className="text-5xl">
                  📊
                </div>

                <h3 className="mt-5 text-xl font-semibold">
                  No scoring criteria yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Add your first evaluation criterion for
                  this round.
                </p>

              </div>

            ) : (

              <div className="mt-6 space-y-4">

                {criteria.map(
                  (criterion, index) => (

                    <div
                      key={criterion._id}
                      className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                    >

                      <div className="flex items-start justify-between gap-5">

                        <div className="flex gap-4">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-bold text-blue-400">
                            {String(
                              index + 1
                            ).padStart(2, "0")}
                          </div>

                          <div>

                            <h3 className="font-semibold">
                              {criterion.name}
                            </h3>

                            {criterion.description && (
                              <p className="mt-2 text-sm leading-6 text-slate-400">
                                {criterion.description}
                              </p>
                            )}

                            {criterion.scoringLevels && (
                              <div className="mt-4 grid gap-2 sm:grid-cols-5">

                                {criterion.scoringLevels.map(
                                  (level) => (

                                    <div
                                      key={level.name}
                                      className="rounded-lg border border-slate-700 bg-slate-950 p-3"
                                    >

                                      <p className="text-xs font-semibold text-blue-400">
                                        {level.name}
                                      </p>

                                      <p className="mt-1 text-sm font-bold">
                                        {level.score}
                                      </p>

                                      <p className="mt-1 text-xs text-slate-500">
                                        {level.description}
                                      </p>

                                    </div>

                                  )
                                )}

                              </div>
                            )}

                          </div>

                        </div>

                        <div className="shrink-0 text-right">

                          <p className="text-lg font-bold text-blue-400">
                            {criterion.weight}%
                          </p>

                          <p className="text-xs text-slate-500">
                            Weight
                          </p>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

            {/* TOTAL STATUS */}

            {criteria.length > 0 && (

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="font-medium">
                      Evaluation Weight Distribution
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      The combined weight of all criteria
                      for this round.
                    </p>
                  </div>

                  <p
                    className={`text-xl font-bold ${
                      criteriaComplete
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {totalWeight}%
                  </p>

                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">

                  <div
                    className={`h-full rounded-full ${
                      criteriaComplete
                        ? "bg-green-500"
                        : "bg-blue-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        totalWeight,
                        100
                      )}%`,
                    }}
                  />

                </div>

                {/* STATUS MESSAGE */}

                <div className="mt-4">

                  {criteriaComplete ? (

                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <span>✓</span>
                      <span>
                        All scoring criteria are configured.
                      </span>
                    </div>

                  ) : (

                    <p className="text-sm text-yellow-400">
                      {remainingWeight}% weight still needs
                      to be assigned.
                    </p>

                  )}

                </div>

              </div>

            )}

          </section>

        </div>

        {/* ==========================================
            NEXT STEP — JUDGE ASSIGNMENT
            ========================================== */}

        <section
          className={`mt-10 rounded-2xl border p-7 transition ${
            criteriaComplete
              ? "border-green-500/30 bg-gradient-to-r from-green-500/10 via-blue-500/5 to-slate-900"
              : "border-slate-800 bg-slate-900/60"
          }`}
        >

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

            <div>

              <div className="flex items-center gap-3">

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${
                    criteriaComplete
                      ? "bg-green-500/10"
                      : "bg-slate-800"
                  }`}
                >
                  {criteriaComplete
                    ? "✓"
                    : "⚖️"}
                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                    NEXT STEP
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    Assign Judges
                  </h2>

                </div>

              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">

                {criteriaComplete
                  ? "Your scoring criteria are complete. Continue to assign judges to teams for this hackathon."
                  : "Complete the scoring criteria first. The combined criterion weight must equal 100% before judges can be assigned."}

              </p>

            </div>

            <button
              type="button"
              onClick={
                handleContinueToJudges
              }
              disabled={
                !criteriaComplete
              }
              className={`whitespace-nowrap rounded-xl px-6 py-3 text-sm font-semibold transition ${
                criteriaComplete
                  ? "bg-green-600 text-white hover:bg-green-500"
                  : "cursor-not-allowed bg-slate-800 text-slate-500"
              }`}
            >
              {criteriaComplete
                ? "Continue to Judge Assignment →"
                : `${remainingWeight}% Weight Remaining`}
            </button>

          </div>

          {/* WORKFLOW STEPS */}

          <div className="mt-7 border-t border-slate-800 pt-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">

              {/* STEP 1 */}

              <div className="flex items-center gap-3">

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-sm font-bold text-green-400">
                  ✓
                </div>

                <span className="text-sm text-slate-300">
                  Create Round
                </span>

              </div>

              <div className="hidden h-px w-10 bg-slate-700 sm:block" />

              {/* STEP 2 */}

              <div className="flex items-center gap-3">

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-sm font-bold text-green-400">
                  ✓
                </div>

                <span className="text-sm font-medium text-white">
                  Scoring Criteria
                </span>

              </div>

              <div className="hidden h-px w-10 bg-slate-700 sm:block" />

              {/* STEP 3 */}

              <div className="flex items-center gap-3">

                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    criteriaComplete
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  3
                </div>

                <span
                  className={`text-sm ${
                    criteriaComplete
                      ? "text-white"
                      : "text-slate-500"
                  }`}
                >
                  Judge Assignment
                </span>

              </div>

              <div className="hidden h-px w-10 bg-slate-700 sm:block" />

              {/* STEP 4 */}

              <div className="flex items-center gap-3">

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-500">
                  4
                </div>

                <span className="text-sm text-slate-500">
                  Evaluations
                </span>

              </div>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}