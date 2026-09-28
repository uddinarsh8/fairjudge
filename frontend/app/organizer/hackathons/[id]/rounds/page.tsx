"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function CreateRoundPage() {
  const router = useRouter();

  const params = useParams<{ id: string }>();

  const hackathonId = params?.id;

  const [name, setName] = useState("");
  const [roundNumber, setRoundNumber] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    // =====================================================
    // VALIDATE HACKATHON ID
    // =====================================================

    if (!hackathonId || hackathonId === "undefined") {
      console.error(
        "CREATE ROUND: Invalid hackathon ID:",
        hackathonId
      );

      setError(
        "Hackathon ID not found. Please open the hackathon again."
      );

      return;
    }

    // =====================================================
    // VALIDATE ROUND NAME
    // =====================================================

    if (!name.trim()) {
      setError("Round name is required.");
      return;
    }

    // =====================================================
    // VALIDATE ROUND NUMBER
    // =====================================================

    if (!roundNumber || Number(roundNumber) < 1) {
      setError("Round number must be at least 1.");
      return;
    }

    // =====================================================
    // VALIDATE DATES
    // =====================================================

    if (!startDate || !endDate) {
      setError("Start and end dates are required.");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError(
        "End date must be later than the start date."
      );
      return;
    }

    // =====================================================
    // GET TOKEN
    // =====================================================

    const token =
      localStorage.getItem("fairjudge_token") ||
      localStorage.getItem("token");

    if (!token) {
      setError(
        "Authentication token not found. Please log in again."
      );

      localStorage.removeItem("token");
      localStorage.removeItem("fairjudge_token");

      router.push("/login");

      return;
    }

    // =====================================================
    // DEBUG
    // =====================================================

    console.log("=================================");
    console.log("CREATE ROUND");
    console.log("Hackathon ID:", hackathonId);
    console.log("Round Name:", name);
    console.log("Round Number:", roundNumber);
    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);
    console.log("Token:", token ? "FOUND" : "NOT FOUND");
    console.log("=================================");

    // =====================================================
    // CREATE ROUND
    // =====================================================

    try {
      setLoading(true);

      const response = await apiRequest(
        `/rounds/${hackathonId}`,
        {
          method: "POST",
          token,

          body: {
            name: name.trim(),
            roundNumber: Number(roundNumber),
            startDate,
            endDate,
          },
        }
      );

      console.log("CREATE ROUND RESPONSE:", response);

      const createdRound = response?.round;

      if (!createdRound?._id) {
        console.error(
          "Invalid create round response:",
          response
        );

        setError(
          "Round was created, but its ID was not returned by the server."
        );

        return;
      }

      // ===================================================
      // REDIRECT TO CRITERIA
      // ===================================================

      router.push(
        `/organizer/hackathons/${hackathonId}/rounds/${createdRound._id}/criteria`
      );
    } catch (error) {
      console.error("CREATE ROUND ERROR:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to create evaluation round.";

      if (
        message.toLowerCase().includes("token") &&
        (
          message.toLowerCase().includes("expired") ||
          message.toLowerCase().includes("invalid") ||
          message.toLowerCase().includes("authentication")
        )
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("fairjudge_token");

        setError(
          "Your session has expired. Please log in again."
        );

        setTimeout(() => {
          router.push("/login");
        }, 1000);

        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">

        <button
          type="button"
          onClick={() =>
            router.push(
              `/organizer/hackathons/${hackathonId}/rounds`
            )
          }
          className="mb-8 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Evaluation Rounds
        </button>

        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-400">
            HACKATHON CONFIGURATION
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Create Evaluation Round
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Create a new evaluation stage for your
            hackathon. You can define when the round
            starts and ends, then configure criteria
            and assign judges.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8"
        >

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">
                {error}
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-200">
              Round Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="e.g. Preliminary Evaluation"
              disabled={loading}
              required
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium text-slate-200">
              Round Number
            </label>

            <input
              type="number"
              min="1"
              value={roundNumber}
              onChange={(e) =>
                setRoundNumber(e.target.value)
              }
              disabled={loading}
              required
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">

            <div>
              <label className="text-sm font-medium text-slate-200">
                Start Date & Time
              </label>

              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
                disabled={loading}
                required
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition [color-scheme:dark] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200">
                End Date & Time
              </label>

              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) =>
                  setEndDate(e.target.value)
                }
                min={startDate || undefined}
                disabled={loading}
                required
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition [color-scheme:dark] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

          </div>

          <div className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
                ℹ️
              </div>

              <div>
                <h3 className="text-sm font-semibold text-blue-300">
                  How evaluation rounds work
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  After creating a round, you will be
                  redirected to configure standardized
                  scoring criteria.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonId}/rounds`
                )
              }
              disabled={loading}
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating Round..."
                : "Create & Configure Criteria →"}
            </button>

          </div>
        </form>
      </div>
    </main>
  );
}