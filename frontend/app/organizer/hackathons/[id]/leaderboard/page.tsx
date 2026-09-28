"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type LeaderboardEntry = {
  rank: number;
  team: {
    _id: string;
    name: string;
  };
  averageScore: number;
  totalEvaluations: number;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();

  const hackathonId = params.id as string;

  const [leaderboard, setLeaderboard] = useState<
    LeaderboardEntry[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLeaderboard = async () => {
    if (!token || !hackathonId) return;

    try {
      setLoading(true);
      setError("");

      const response = await apiRequest(
        `/leaderboard/hackathon/${hackathonId}`,
        {
          token,
        }
      );

      setLeaderboard(
        response.leaderboard || []
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load leaderboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [token, hackathonId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Calculating leaderboard...
      </main>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

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

        <div className="mb-8">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 text-2xl">
              🏆
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                Leaderboard
              </h1>

              <p className="mt-1 text-slate-400">
                Team rankings based on submitted
                evaluations.
              </p>
            </div>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* EMPTY STATE */}

        {leaderboard.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">

            <div className="text-5xl">
              🏆
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              No rankings available yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Rankings will appear once judges submit
              evaluations for the participating teams.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {/* TOP 3 */}

            {leaderboard
              .filter((entry) => entry.rank <= 3)
              .map((entry) => (

                <div
                  key={entry.team._id}
                  className={`flex flex-col justify-between gap-5 rounded-2xl border p-6 md:flex-row md:items-center ${
                    entry.rank === 1
                      ? "border-yellow-500/40 bg-yellow-500/5"
                      : entry.rank === 2
                      ? "border-slate-400/30 bg-slate-800"
                      : "border-orange-500/30 bg-orange-500/5"
                  }`}
                >

                  <div className="flex items-center gap-5">

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-2xl">
                      {getRankIcon(entry.rank)}
                    </div>

                    <div>

                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Rank {entry.rank}
                      </p>

                      <h2 className="mt-1 text-xl font-bold">
                        {entry.team.name}
                      </h2>

                      <p className="mt-1 text-sm text-slate-400">
                        {entry.totalEvaluations} evaluation
                        {entry.totalEvaluations !== 1
                          ? "s"
                          : ""}
                      </p>

                    </div>

                  </div>

                  <div className="md:text-right">

                    <p className="text-sm text-slate-500">
                      Average Score
                    </p>

                    <p className="mt-1 text-3xl font-bold text-blue-400">
                      {entry.averageScore.toFixed(2)}
                    </p>

                  </div>

                </div>

              ))}

            {/* OTHER RANKINGS */}

            {leaderboard
              .filter((entry) => entry.rank > 3)
              .map((entry) => (

                <div
                  key={entry.team._id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 px-6 py-5 md:flex-row md:items-center"
                >

                  <div className="flex items-center gap-5">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-sm font-bold text-slate-400">
                      #{entry.rank}
                    </div>

                    <div>

                      <h2 className="font-semibold">
                        {entry.team.name}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {entry.totalEvaluations} evaluation
                        {entry.totalEvaluations !== 1
                          ? "s"
                          : ""}
                      </p>

                    </div>

                  </div>

                  <div className="md:text-right">

                    <p className="text-sm text-slate-500">
                      Average Score
                    </p>

                    <p className="mt-1 text-xl font-bold text-blue-400">
                      {entry.averageScore.toFixed(2)}
                    </p>

                  </div>

                </div>

              ))}

          </div>

        )}

        {/* INFORMATION */}

        <section className="mt-10 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">

          <div className="flex gap-4">

            <div className="text-2xl">
              ℹ️
            </div>

            <div>

              <h2 className="font-semibold">
                How rankings work
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Rankings are calculated using the average
                score from submitted evaluations. Teams
                with higher average scores are ranked
                above other teams. Only valid submitted
                evaluations are included in the final
                calculation.
              </p>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}