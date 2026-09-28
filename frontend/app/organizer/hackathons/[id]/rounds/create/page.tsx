"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function CreateRoundPage() {
  const router = useRouter();
  const params = useParams();

  const [hackathonId, setHackathonId] = useState<string>("");

  const [name, setName] = useState("");
  const [roundNumber, setRoundNumber] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // GET HACKATHON ID SAFELY
  // =====================================================

  useEffect(() => {
    const id = params?.id;

    let resolvedId = "";

    if (typeof id === "string") {
      resolvedId = id;
    } else if (Array.isArray(id) && id.length > 0) {
      resolvedId = id[0];
    }

    console.log("=================================");
    console.log("CREATE ROUND PAGE");
    console.log("Raw params:", params);
    console.log("Resolved hackathon ID:", resolvedId);
    console.log("=================================");

    if (!resolvedId || resolvedId === "undefined") {
      setError(
        "Hackathon ID is missing. Please open this page from a valid hackathon."
      );
      return;
    }

    setHackathonId(resolvedId);
  }, [params]);

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    // -----------------------------------------------------
    // HACKATHON ID
    // -----------------------------------------------------

    if (!hackathonId || hackathonId === "undefined") {
      setError(
        "Hackathon ID is missing. Please go back and select a valid hackathon."
      );
      return;
    }

    // -----------------------------------------------------
    // ROUND NAME
    // -----------------------------------------------------

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Round name is required.");
      return;
    }

    // -----------------------------------------------------
    // ROUND NUMBER
    // -----------------------------------------------------

    const parsedRoundNumber = Number(roundNumber);

    if (
      !roundNumber ||
      !Number.isInteger(parsedRoundNumber) ||
      parsedRoundNumber < 1
    ) {
      setError(
        "Round number must be a positive whole number."
      );
      return;
    }

    // -----------------------------------------------------
    // DATES
    // -----------------------------------------------------

    if (!startDate || !endDate) {
      setError(
        "Start and end dates are required."
      );
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      setError("Please enter valid dates.");
      return;
    }

    if (end <= start) {
      setError(
        "End date must be later than the start date."
      );
      return;
    }

    // =====================================================
    // TOKEN
    // =====================================================

    const fairjudgeToken =
      localStorage.getItem("fairjudge_token");

    const legacyToken =
      localStorage.getItem("token");

    const token =
      fairjudgeToken || legacyToken;

    console.log("=================================");
    console.log("CREATE ROUND REQUEST");
    console.log("Hackathon ID:", hackathonId);
    console.log(
      "Token source:",
      fairjudgeToken
        ? "fairjudge_token"
        : legacyToken
        ? "token"
        : "NONE"
    );
    console.log("=================================");

    if (!token) {
      setError(
        "Authentication token not found. Please log in again."
      );

      localStorage.removeItem(
        "fairjudge_token"
      );
      localStorage.removeItem("token");

      router.replace("/login");

      return;
    }

    // =====================================================
    // CREATE ROUND
    // =====================================================

    try {
      setLoading(true);

      const response = await apiRequest(
        `/rounds/${encodeURIComponent(hackathonId)}`,
        {
          method: "POST",
          token,

          body: {
            name: trimmedName,
            roundNumber: parsedRoundNumber,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
          },
        }
      );

      console.log("=================================");
      console.log("CREATE ROUND SUCCESS");
      console.log("Response:", response);
      console.log("=================================");

      // ===================================================
      // GET CREATED ROUND
      // ===================================================

      const createdRound =
        response?.round ||
        response?.data?.round;

      if (
        !createdRound ||
        !createdRound._id
      ) {
        console.error(
          "Server did not return created round:",
          response
        );

        setError(
          "Round was created, but the server did not return the round ID."
        );

        return;
      }

      // ===================================================
      // REDIRECT TO CRITERIA
      // ===================================================

      const criteriaUrl =
        `/organizer/hackathons/${hackathonId}` +
        `/rounds/${createdRound._id}` +
        `/criteria`;

      console.log(
        "Redirecting to:",
        criteriaUrl
      );

      router.push(criteriaUrl);
    } catch (error) {
      console.error("=================================");
      console.error("CREATE ROUND ERROR");
      console.error(error);
      console.error("=================================");

      const message =
        error instanceof Error
          ? error.message
          : "Unable to create evaluation round.";

      const lowerMessage =
        message.toLowerCase();

      // ===================================================
      // AUTHENTICATION ERROR
      // ===================================================

      if (
        lowerMessage.includes("token") ||
        lowerMessage.includes("authentication") ||
        lowerMessage.includes("unauthorized")
      ) {
        localStorage.removeItem(
          "fairjudge_token"
        );
        localStorage.removeItem("token");

        setError(
          "Your session has expired. Please log in again."
        );

        setTimeout(() => {
          router.replace("/login");
        }, 1000);

        return;
      }

      // ===================================================
      // HACKATHON NOT FOUND
      // ===================================================

      if (
        lowerMessage.includes(
          "hackathon not found"
        )
      ) {
        setError(
          "Hackathon not found. Please go back and select a valid hackathon."
        );

        return;
      }

      // ===================================================
      // SERVER ERROR
      // ===================================================

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // BACK
  // =====================================================

  const goBack = () => {
    if (!hackathonId) {
      router.push(
        "/organizer/hackathons"
      );

      return;
    }

    router.push(
      `/organizer/hackathons/${hackathonId}/rounds`
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">

        {/* BACK BUTTON */}

        <button
          type="button"
          onClick={goBack}
          disabled={loading}
          className="mb-8 text-sm text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← Back to Evaluation Rounds
        </button>

        {/* HEADER */}

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

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8"
        >

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">
                {error}
              </p>
            </div>
          )}

          {/* HACKATHON ID DEBUG */}

          {hackathonId && (
            <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <p className="text-xs text-slate-500">
                Hackathon ID
              </p>

              <p className="mt-1 break-all font-mono text-xs text-slate-300">
                {hackathonId}
              </p>
            </div>
          )}

          {/* ROUND NAME */}

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

            <p className="mt-2 text-xs text-slate-500">
              Give this evaluation stage a clear name.
            </p>
          </div>

          {/* ROUND NUMBER */}

          <div className="mt-6">
            <label className="text-sm font-medium text-slate-200">
              Round Number
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={roundNumber}
              onChange={(e) =>
                setRoundNumber(e.target.value)
              }
              disabled={loading}
              required
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <p className="mt-2 text-xs text-slate-500">
              Determines the order of this evaluation round.
            </p>
          </div>

          {/* DATE AND TIME */}

          <div className="mt-6 grid gap-6 md:grid-cols-2">

            {/* START */}

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

            {/* END */}

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

          {/* INFORMATION */}

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
                  scoring criteria. Each round can have
                  its own evaluation period and scoring
                  rules.
                </p>
              </div>

            </div>
          </div>

          {/* ACTIONS */}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={goBack}
              disabled={loading}
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !hackathonId
              }
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