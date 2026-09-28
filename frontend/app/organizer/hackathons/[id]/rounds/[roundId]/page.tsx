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
import { useAuth } from "@/context/AuthContext";

type ScoringLevel = {
  name: "BEST" | "GOOD" | "AVERAGE" | "POOR" | "WORST";
  score: number;
  description: string;
};

type Criteria = {
  _id: string;
  name: string;
  description: string;
  weight: number;
  scoringLevels: ScoringLevel[];
};

const LEVELS: ScoringLevel["name"][] = [
  "BEST",
  "GOOD",
  "AVERAGE",
  "POOR",
  "WORST",
];

const DEFAULT_SCORES: Record<
  ScoringLevel["name"],
  number
> = {
  BEST: 10,
  GOOD: 8,
  AVERAGE: 6,
  POOR: 4,
  WORST: 2,
};

export default function CriteriaPage() {
  const router = useRouter();
  const params = useParams();

  const {
    token,
    loading: authLoading,
  } = useAuth();

  const hackathonId = params.id as string;
  const roundId = params.roundId as string;

  const [criteria, setCriteria] = useState<
    Criteria[]
  >([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("20");

  const [scoringLevels, setScoringLevels] = useState<
    ScoringLevel[]
  >(
    LEVELS.map((level) => ({
      name: level,
      score: DEFAULT_SCORES[level],
      description: "",
    }))
  );

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // LOAD CRITERIA
  // ==========================================

  const loadCriteria = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!hackathonId || !roundId) {
      setError(
        "Hackathon ID or Round ID is missing."
      );

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

      console.log(
        "Loading criteria:",
        hackathonId,
        roundId
      );

      const response = await apiRequest(
        `/criteria/${hackathonId}/${roundId}`,
        {
          method: "GET",
          token,
        }
      );

      setCriteria(response.criteria || []);
    } catch (error) {
      console.error(
        "Load criteria error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load criteria."
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
  // LOAD ON PAGE OPEN
  // ==========================================

  useEffect(() => {
    loadCriteria();
  }, [loadCriteria]);

  // ==========================================
  // CALCULATE TOTAL WEIGHT
  // ==========================================

  const totalWeight = criteria.reduce(
    (total, criterion) =>
      total + Number(criterion.weight || 0),
    0
  );

  const remainingWeight =
    Math.max(0, 100 - totalWeight);

  // ==========================================
  // UPDATE SCORING LEVEL
  // ==========================================

  const updateLevel = (
    levelName: ScoringLevel["name"],
    field: "score" | "description",
    value: string
  ) => {
    setScoringLevels((current) =>
      current.map((level) =>
        level.name === levelName
          ? {
              ...level,
              [field]:
                field === "score"
                  ? Number(value)
                  : value,
            }
          : level
      )
    );
  };

  // ==========================================
  // CREATE CRITERIA
  // ==========================================

  const handleCreateCriteria = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

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

    if (!hackathonId || !roundId) {
      setError(
        "Hackathon ID or Round ID is missing."
      );

      return;
    }

    if (!name.trim()) {
      setError(
        "Criterion name is required."
      );

      return;
    }

    const numericWeight = Number(weight);

    if (
      !Number.isFinite(numericWeight) ||
      numericWeight <= 0
    ) {
      setError(
        "Please enter a valid weight greater than 0."
      );

      return;
    }

    if (numericWeight > 100) {
      setError(
        "Criterion weight cannot exceed 100%."
      );

      return;
    }

    if (
      totalWeight + numericWeight > 100
    ) {
      setError(
        `Total criteria weight cannot exceed 100%. Only ${remainingWeight}% is available.`
      );

      return;
    }

    for (const level of scoringLevels) {
      if (
        !level.description ||
        !level.description.trim()
      ) {
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
      setCreating(true);

      await apiRequest("/criteria", {
        method: "POST",

        token,

        body: {
          hackathonId,
          roundId,

          name: name.trim(),

          description:
            description.trim(),

          weight: numericWeight,

          scoringLevels,
        },
      });

      setSuccess(
        "Evaluation criterion created successfully."
      );

      setName("");
      setDescription("");
      setWeight("20");

      setScoringLevels(
        LEVELS.map((level) => ({
          name: level,
          score: DEFAULT_SCORES[level],
          description: "",
        }))
      );

      await loadCriteria();
    } catch (error) {
      console.error(
        "Create criteria error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to create criterion."
      );
    } finally {
      setCreating(false);
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
  // PAGE
  // ==========================================

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8">

          <button
            type="button"
            onClick={() =>
              router.push(
                `/organizer/hackathons/${hackathonId}/rounds`
              )
            }
            className="mb-5 text-sm text-slate-400 hover:text-white"
          >
            ← Evaluation Rounds
          </button>

          <h1 className="text-3xl font-bold">
            Evaluation Criteria
          </h1>

          <p className="mt-2 max-w-3xl text-slate-400">
            Define standardized criteria and scoring levels
            for this evaluation round.
          </p>

          <div className="mt-5 flex gap-4">

            <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">

              <p className="text-xs text-slate-500">
                Total Weight
              </p>

              <p className="text-lg font-bold">
                {totalWeight}%
              </p>

            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">

              <p className="text-xs text-slate-500">
                Remaining
              </p>

              <p className="text-lg font-bold text-blue-400">
                {remainingWeight}%
              </p>

            </div>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
            {success}
          </div>
        )}

        {/* NO TOKEN */}

        {!token && (
          <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">

            <p className="text-sm text-yellow-400">
              Your authentication session is not available.
              Please log in again.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/login")
              }
              className="mt-3 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400"
            >
              Go to Login
            </button>

          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">

          {/* CREATE CRITERION */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-6">

              <p className="text-sm font-medium text-blue-400">
                STANDARDIZED RUBRIC
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Add Evaluation Criterion
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Every judge will use these same definitions
                when evaluating teams.
              </p>

            </div>

            <form
              onSubmit={handleCreateCriteria}
              className="space-y-6"
            >

              {/* NAME */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Criterion Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="e.g. Innovation"
                  required
                  disabled={
                    creating ||
                    !token
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-50"
                />

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Criterion Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="What should judges consider?"
                  rows={3}
                  disabled={
                    creating ||
                    !token
                  }
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-50"
                />

              </div>

              {/* WEIGHT */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Weight (%)
                </label>

                <input
                  type="number"
                  min="1"
                  max={remainingWeight}
                  value={weight}
                  onChange={(e) =>
                    setWeight(e.target.value)
                  }
                  required
                  disabled={
                    creating ||
                    !token ||
                    remainingWeight <= 0
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-50"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Remaining available weight:{" "}
                  {remainingWeight}%
                </p>

              </div>

              {/* SCORING LEVELS */}

              <div>

                <div className="mb-4">

                  <h3 className="font-semibold">
                    Scoring Levels
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Define exactly what each level means.
                  </p>

                </div>

                <div className="space-y-4">

                  {scoringLevels.map((level) => (

                    <div
                      key={level.name}
                      className="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
                    >

                      <div className="flex items-center justify-between gap-4">

                        <span className="font-medium">
                          {level.name}
                        </span>

                        <input
                          type="number"
                          value={level.score}
                          min="0"
                          disabled={
                            creating ||
                            !token
                          }
                          onChange={(e) =>
                            updateLevel(
                              level.name,
                              "score",
                              e.target.value
                            )
                          }
                          className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-center text-white outline-none focus:border-blue-500 disabled:opacity-50"
                        />

                      </div>

                      <textarea
                        value={level.description}
                        onChange={(e) =>
                          updateLevel(
                            level.name,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder={`What does ${level.name.toLowerCase()} mean?`}
                        rows={2}
                        required
                        disabled={
                          creating ||
                          !token
                        }
                        className="mt-3 w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
                      />

                    </div>

                  ))}

                </div>

              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={
                  creating ||
                  !token ||
                  remainingWeight <= 0
                }
                className="w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {creating
                  ? "Creating..."
                  : "Create Criterion"}

              </button>

            </form>

          </section>

          {/* EXISTING CRITERIA */}

          <section>

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-semibold">
                  Configured Criteria
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Criteria judges will use in this round.
                </p>

              </div>

              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                {criteria.length}{" "}
                {criteria.length === 1
                  ? "Criterion"
                  : "Criteria"}
              </span>

            </div>

            {loading ? (

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
                Loading criteria...
              </div>

            ) : criteria.length === 0 ? (

              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center">

                <div className="text-3xl">
                  📊
                </div>

                <h3 className="mt-4 font-medium">
                  No criteria configured
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Add your first criterion using the form.
                </p>

              </div>

            ) : (

              <div className="space-y-5">

                {criteria.map(
                  (criterion) => (

                    <div
                      key={criterion._id}
                      className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <h3 className="text-xl font-semibold">
                            {criterion.name}
                          </h3>

                          {criterion.description && (

                            <p className="mt-2 text-sm text-slate-400">
                              {criterion.description}
                            </p>

                          )}

                        </div>

                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                          {criterion.weight}%
                        </span>

                      </div>

                      <div className="mt-5 space-y-2">

                        {criterion.scoringLevels.map(
                          (level) => (

                            <div
                              key={level.name}
                              className="flex gap-3 rounded-lg bg-slate-800/50 p-3"
                            >

                              <div className="w-20 shrink-0">

                                <span className="text-xs font-semibold text-slate-300">
                                  {level.name}
                                </span>

                                <p className="text-sm font-bold text-blue-400">
                                  {level.score}
                                </p>

                              </div>

                              <p className="text-sm text-slate-400">
                                {level.description}
                              </p>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        </div>

        {/* TRANSPARENCY NOTICE */}

        <section className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">

          <div className="flex gap-4">

            <span className="text-2xl">
              ⚖️
            </span>

            <div>

              <h3 className="font-semibold text-blue-400">
                Why standardized scoring matters
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Every judge will see the same scoring levels and
                descriptions. This reduces subjective differences
                between judges and makes the evaluation process
                more consistent and transparent.
              </p>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}