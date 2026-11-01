"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type EvaluationRound = {
  _id: string;
  name: string;
  roundNumber: number;
  description?: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
};

type RoundResponse = {
  success?: boolean;
  rounds?: EvaluationRound[];
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString();
};

export default function EvaluationRoundsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const hackathonId = params?.id;
  const { token, loading: authLoading } = useAuth();

  const [rounds, setRounds] = useState<EvaluationRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const nextRoundNumber = rounds.reduce(
    (highest, round) => Math.max(highest, round.roundNumber),
    0
  ) + 1;

  const loadRounds = useCallback(async (): Promise<EvaluationRound[]> => {
    if (authLoading) return [];
    if (!hackathonId || !token) {
      setError("Please sign in and open a valid hackathon.");
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      setError("");
      const response = (await apiRequest(
        `/rounds/${encodeURIComponent(hackathonId)}`,
        { token }
      )) as RoundResponse;
      const loadedRounds = Array.isArray(response.rounds) ? response.rounds : [];
      setRounds(loadedRounds);
      return loadedRounds;
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load evaluation rounds."
      );
      return [];
    } finally {
      setLoading(false);
    }
  }, [authLoading, hackathonId, token]);

  const handleCreateRound = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token || !hackathonId) {
      setError("Please sign in and open a valid hackathon.");
      return;
    }

    if (!name.trim() || !startDate || !endDate) {
      setError("Enter a round name, start time, and end time.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      setError("The round end time must be later than its start time.");
      return;
    }

    try {
      setSaving(true);
      const createResponse = await apiRequest(`/rounds/${encodeURIComponent(hackathonId)}`, {
        method: "POST",
        token,
        body: {
          name: name.trim(),
          description: description.trim(),
          roundNumber: nextRoundNumber,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      });

      const updatedRounds = await loadRounds();
      const createdRound = createResponse?.round as EvaluationRound | undefined;
      if (
        createdRound &&
        !updatedRounds.some((round) => round._id === createdRound._id)
      ) {
        setRounds(
          [...updatedRounds, createdRound].sort(
            (left, right) => left.roundNumber - right.roundNumber
          )
        );
      }
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setSuccess(`Round ${nextRoundNumber} added to the schedule.`);
      if (updatedRounds.length === 0 && !createdRound) {
        setError("The round was created, but the schedule could not be refreshed.");
      }
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create the round."
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadRounds();
    });
  }, [loadRounds]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push(`/organizer/hackathons/${hackathonId}`)}
          className="mb-8 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Hackathon
        </button>

        <div className="mb-8">
          <div>
            <p className="text-sm font-semibold text-blue-400">HACKATHON CONFIGURATION</p>
            <h1 className="mt-2 text-3xl font-bold">Round Schedule</h1>
            <p className="mt-3 text-sm text-slate-400">
              Add and schedule as many rounds as your event needs. You can publish the hackathon first and configure rounds later.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        <form
          onSubmit={handleCreateRound}
          className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-xl font-semibold">Add a round</h2>
              <p className="mt-1 text-sm text-slate-400">
                The next round number is assigned automatically: Round {nextRoundNumber}.
              </p>
            </div>
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
              Optional before evaluation setup
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-300">
              Round Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Prototype Review"
                required
                disabled={saving}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-300">
              Description (optional)
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What happens in this round?"
                disabled={saving}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-300">
              Start Date &amp; Time
              <input
                type="datetime-local"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
                disabled={saving}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none [color-scheme:dark] focus:border-blue-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-300">
              End Date &amp; Time
              <input
                type="datetime-local"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
                disabled={saving}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none [color-scheme:dark] focus:border-blue-500"
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end border-t border-slate-800 pt-5">
            <button
              type="submit"
              disabled={saving || authLoading || !token}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Adding Round..." : `Add Round ${nextRoundNumber}`}
            </button>
          </div>
        </form>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
            Loading evaluation rounds…
          </div>
        ) : rounds.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-lg font-semibold">No rounds yet</h2>
            <p className="mt-2 text-sm text-slate-400">
              You can publish this hackathon now. Add rounds here whenever you are ready to schedule the evaluation.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {rounds.map((round) => (
              <article
                key={round._id}
                className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                    Round {round.roundNumber} · {round.status.toLowerCase()}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">{round.name}</h2>
                  {round.description && (
                    <p className="mt-1 text-sm text-slate-400">{round.description}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    {formatDate(round.startDate)} – {formatDate(round.endDate)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/organizer/hackathons/${hackathonId}/rounds/${round._id}/criteria`
                    )
                  }
                  className="shrink-0 rounded-xl border border-blue-500/40 px-4 py-2.5 text-sm font-medium text-blue-300 transition hover:bg-blue-500/10"
                >
                  Configure Criteria →
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
