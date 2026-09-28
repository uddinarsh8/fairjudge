"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Judge = {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
};

export default function JudgesPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();

  const hackathonId = params.id as string;

  const [judges, setJudges] = useState<Judge[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadJudges = async () => {
      if (!token || !hackathonId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // This endpoint may need adjustment based on your backend.
        const response = await apiRequest(
          `/users/judges`,
          { token }
        );

        setJudges(response.judges || response.users || []);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load judges"
        );
      } finally {
        setLoading(false);
      }
    };

    loadJudges();
  }, [token, hackathonId]);

  const filteredJudges = useMemo(() => {
    const searchText = search.toLowerCase();

    return judges.filter(
      (judge) =>
        judge.name?.toLowerCase().includes(searchText) ||
        judge.email?.toLowerCase().includes(searchText)
    );
  }, [judges, search]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading judges...
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
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

          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <h2 className="text-xl font-semibold text-red-400">
              Unable to load judges
            </h2>

            <p className="mt-2 text-sm text-red-300">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        {/* BACK */}

        <button
          onClick={() =>
            router.push(
              `/organizer/hackathons/${hackathonId}`
            )
          }
          className="mb-6 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Hackathon
        </button>

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

          <div>
            <p className="text-sm font-semibold text-blue-400">
              EVALUATOR MANAGEMENT
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Judges
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Manage judges available for evaluating projects
              in this hackathon.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-3">
            <p className="text-xs text-slate-500">
              AVAILABLE JUDGES
            </p>

            <p className="mt-1 text-2xl font-bold">
              {judges.length}
            </p>
          </div>

        </div>

        {/* SEARCH */}

        <div className="mt-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search judges by name or email..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
          />
        </div>

        {/* SUMMARY */}

        <div className="mt-6 grid gap-5 md:grid-cols-3">

          <SummaryCard
            title="Total Judges"
            value={judges.length}
            description="Available evaluators"
            icon="⚖️"
          />

          <SummaryCard
            title="Active"
            value={judges.length}
            description="Ready for assignments"
            icon="✓"
          />

          <SummaryCard
            title="Assignments"
            value="Manage"
            description="Assign judges to teams"
            icon="📋"
          />

        </div>

        {/* JUDGE LIST */}

        <section className="mt-10">

          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Available Judges
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {filteredJudges.length} judge
                {filteredJudges.length !== 1 ? "s" : ""} found
              </p>
            </div>

            <button
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonId}/assignments`
                )
              }
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
            >
              Manage Assignments →
            </button>
          </div>

          {filteredJudges.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">

              <div className="text-5xl">
                ⚖️
              </div>

              <h3 className="mt-5 text-xl font-semibold">
                {judges.length === 0
                  ? "No judges available"
                  : "No judges found"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                {judges.length === 0
                  ? "Users registered with the Judge role will appear here."
                  : "Try searching with a different name or email."}
              </p>

            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

              {filteredJudges.map((judge) => (
                <div
                  key={judge._id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-blue-500/40"
                >
                  <div className="flex items-start justify-between">

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                      ⚖️
                    </div>

                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                      Available
                    </span>

                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    {judge.name}
                  </h3>

                  <p className="mt-2 truncate text-sm text-slate-400">
                    {judge.email}
                  </p>

                  <div className="mt-6 border-t border-slate-800 pt-5">

                    <button
                      onClick={() =>
                        router.push(
                          `/organizer/hackathons/${hackathonId}/assignments/create`
                        )
                      }
                      className="text-sm font-medium text-blue-400 hover:text-blue-300"
                    >
                      Create Assignment →
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
          {icon}
        </div>

      </div>
    </div>
  );
}