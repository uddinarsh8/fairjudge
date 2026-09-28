"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Evaluation = {
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

  totalScore?: number;

  status?: string;

  submittedAt?: string;

  createdAt?: string;
};

export default function EvaluationsPage() {
  const router = useRouter();
  const params = useParams();

  const { token } = useAuth();

  const hackathonId = params.id as string;

  const [evaluations, setEvaluations] = useState<
    Evaluation[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadEvaluations = async () => {
    if (!token || !hackathonId) return;

    try {
      setLoading(true);
      setError("");

      const response = await apiRequest(
        `/evaluations/hackathon/${hackathonId}`,
        {
          token,
        }
      );

      setEvaluations(
        response.evaluations || []
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load evaluations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvaluations();
  }, [token, hackathonId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading evaluations...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">

        {/* BACK BUTTON */}

        <button
          onClick={() =>
            router.push(
              `/organizer/hackathons/${hackathonId}`
            )
          }
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Back to Hackathon
        </button>

        {/* HEADER */}

        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>
            <h1 className="text-3xl font-bold">
              Evaluations
            </h1>

            <p className="mt-2 text-slate-400">
              View all submitted judge evaluations
              for this hackathon.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-400">
            {evaluations.length} Evaluation
            {evaluations.length !== 1 ? "s" : ""}
          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* EMPTY STATE */}

        {evaluations.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">

            <div className="text-5xl">
              📋
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              No evaluations yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Submitted evaluations from judges will
              appear here once the evaluation process
              begins.
            </p>

          </div>

        ) : (

          <div className="space-y-5">

            {evaluations.map((evaluation) => (

              <div
                key={evaluation._id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >

                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">

                  {/* EVALUATION DETAILS */}

                  <div className="grid flex-1 gap-6 md:grid-cols-4">

                    {/* TEAM */}

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Team
                      </p>

                      <p className="mt-2 font-semibold">
                        {evaluation.team?.name ||
                          "Unknown Team"}
                      </p>

                      {evaluation.project && (
                        <p className="mt-1 text-sm text-slate-500">
                          {
                            evaluation.project
                              .projectName
                          }
                        </p>
                      )}
                    </div>

                    {/* JUDGE */}

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Judge
                      </p>

                      <p className="mt-2 font-semibold">
                        {evaluation.judge?.name ||
                          "Unknown Judge"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {evaluation.judge?.email}
                      </p>
                    </div>

                    {/* ROUND */}

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Round
                      </p>

                      <p className="mt-2 font-semibold">
                        {evaluation.round
                          ? `Round ${evaluation.round.roundNumber}`
                          : "Unknown Round"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {evaluation.round?.name}
                      </p>
                    </div>

                    {/* SUBMITTED */}

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Submitted
                      </p>

                      <p className="mt-2 text-sm">
                        {evaluation.submittedAt ||
                        evaluation.createdAt
                          ? new Date(
                              evaluation.submittedAt ||
                                evaluation.createdAt ||
                                ""
                            ).toLocaleString()
                          : "Not available"}
                      </p>
                    </div>

                  </div>

                  {/* SCORE */}

                  <div className="flex min-w-[120px] flex-col items-start gap-3 md:items-end">

                    <div className="rounded-xl bg-blue-500/10 px-5 py-3 text-center">

                      <p className="text-xs text-slate-400">
                        Total Score
                      </p>

                      <p className="mt-1 text-2xl font-bold text-blue-400">
                        {evaluation.totalScore ?? "—"}
                      </p>

                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        evaluation.status === "submitted" ||
                        evaluation.status === "locked"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {evaluation.status || "Submitted"}
                    </span>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>
    </main>
  );
}