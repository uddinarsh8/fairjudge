"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";

export default function CreateHackathonPage() {
  const router = useRouter();

  const { token, loading: authLoading } = useAuth();

  // =====================================================
  // FORM STATES
  // =====================================================

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");

  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  // =====================================================
  // UI STATES
  // =====================================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // -----------------------------------------------------
    // AUTH CHECK
    // -----------------------------------------------------

    if (authLoading) {
      setError(
        "Authentication is still loading. Please wait."
      );
      return;
    }

    if (!token) {
      setError(
        "Authentication token not found. Please log in again."
      );

      router.push("/login");
      return;
    }

    // -----------------------------------------------------
    // NAME VALIDATION
    // -----------------------------------------------------

    if (!name.trim()) {
      setError("Hackathon name is required.");
      return;
    }

    // -----------------------------------------------------
    // DESCRIPTION VALIDATION
    // -----------------------------------------------------

    if (!description.trim()) {
      setError("Hackathon description is required.");
      return;
    }

    // -----------------------------------------------------
    // DATE VALIDATION
    // -----------------------------------------------------

    if (!startDate) {
      setError("Please select a start date.");
      return;
    }

    if (!startTime) {
      setError("Please select a start time.");
      return;
    }

    if (!endDate) {
      setError("Please select an end date.");
      return;
    }

    if (!endTime) {
      setError("Please select an end time.");
      return;
    }

    // -----------------------------------------------------
    // CREATE DATE OBJECTS
    // -----------------------------------------------------

    const start = new Date(
      `${startDate}T${startTime}`
    );

    const end = new Date(
      `${endDate}T${endTime}`
    );

    // -----------------------------------------------------
    // INVALID DATE CHECK
    // -----------------------------------------------------

    if (Number.isNaN(start.getTime())) {
      setError("Invalid start date or time.");
      return;
    }

    if (Number.isNaN(end.getTime())) {
      setError("Invalid end date or time.");
      return;
    }

    // -----------------------------------------------------
    // END MUST BE AFTER START
    // -----------------------------------------------------

    if (end <= start) {
      setError(
        "End date and time must be later than the start date and time."
      );
      return;
    }

    // -----------------------------------------------------
    // CREATE HACKATHON
    // -----------------------------------------------------

    try {
      setLoading(true);

      console.log(
        "Creating hackathon..."
      );

      console.log(
        "Start:",
        start.toISOString()
      );

      console.log(
        "End:",
        end.toISOString()
      );

      const response = await apiRequest(
        "/hackathons",
        {
          method: "POST",

          token,

          body: {
            name: name.trim(),

            description:
              description.trim(),

            startDate:
              start.toISOString(),

            endDate:
              end.toISOString(),
          },
        }
      );

      console.log(
        "Create hackathon response:",
        response
      );

      // -----------------------------------------------------
      // SUCCESS
      // -----------------------------------------------------

      setSuccess(
        "Hackathon created successfully."
      );

      // -----------------------------------------------------
      // GET CREATED HACKATHON ID
      // -----------------------------------------------------

      const createdHackathon =
        response?.hackathon;

      const hackathonId =
        createdHackathon?._id ||
        createdHackathon?.id;

      // -----------------------------------------------------
      // REDIRECT
      // -----------------------------------------------------

      if (hackathonId) {
        setTimeout(() => {
          router.push(
            `/organizer/hackathons/${hackathonId}`
          );
        }, 500);

        return;
      }

      // -----------------------------------------------------
      // FALLBACK
      // -----------------------------------------------------

      setTimeout(() => {
        router.push(
          "/organizer/hackathons"
        );
      }, 500);

    } catch (error) {
      console.error(
        "Create hackathon error:",
        error
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to create hackathon.";

      // -----------------------------------------------------
      // TOKEN ERROR
      // -----------------------------------------------------

      const lowerError =
        errorMessage.toLowerCase();

      if (
        lowerError.includes("token") &&
        (
          lowerError.includes("expired") ||
          lowerError.includes("invalid") ||
          lowerError.includes("unauthorized")
        )
      ) {
        setError(
          "Your session has expired. Please log in again."
        );

        setTimeout(() => {
          router.push("/login");
        }, 1200);

        return;
      }

      // -----------------------------------------------------
      // NORMAL ERROR
      // -----------------------------------------------------

      setError(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // AUTH LOADING
  // =====================================================

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center">
          <div className="text-lg font-semibold text-white">
            Checking authentication...
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Please wait.
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">

      <div className="mx-auto max-w-3xl">

        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={() =>
            router.push(
              "/organizer/hackathons"
            )
          }
          disabled={loading}
          className="mb-8 text-sm text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← Back to Hackathons
        </button>

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8">

          <p className="text-sm font-semibold tracking-wider text-blue-400">
            HACKATHON MANAGEMENT
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Create Hackathon
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Create a new hackathon event and define
            when the event will start and end.
          </p>

        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8"
        >

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">

              <p className="text-sm text-red-400">
                {error}
              </p>

            </div>
          )}

          {/* =================================================
              SUCCESS
          ================================================= */}

          {success && (
            <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">

              <p className="text-sm text-green-400">
                {success}
              </p>

            </div>
          )}

          {/* =================================================
              HACKATHON NAME
          ================================================= */}

          <div>

            <label
              htmlFor="hackathon-name"
              className="text-sm font-medium text-slate-200"
            >
              Hackathon Name
            </label>

            <input
              id="hackathon-name"
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Enter hackathon name"
              disabled={loading}
              required
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            />

          </div>

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <div className="mt-6">

            <label
              htmlFor="hackathon-description"
              className="text-sm font-medium text-slate-200"
            >
              Description
            </label>

            <textarea
              id="hackathon-description"
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              rows={5}
              placeholder="Describe your hackathon..."
              disabled={loading}
              required
              className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            />

          </div>

          {/* =================================================
              DATE & TIME
          ================================================= */}

          <div className="mt-8">

            <h2 className="text-lg font-semibold">
              Hackathon Schedule
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Select the start and end date and time.
            </p>

          </div>

          <div className="mt-5 grid gap-6 md:grid-cols-2">

            {/* =================================================
                START
            ================================================= */}

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">

              <h3 className="text-sm font-semibold text-blue-400">
                Start
              </h3>

              {/* START DATE */}

              <div className="mt-4">

                <label
                  htmlFor="start-date"
                  className="text-sm font-medium text-slate-300"
                >
                  Start Date
                </label>

                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) =>
                    setStartDate(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition [color-scheme:dark] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                />

              </div>

              {/* START TIME */}

              <div className="mt-4">

                <label
                  htmlFor="start-time"
                  className="text-sm font-medium text-slate-300"
                >
                  Start Time
                </label>

                <input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) =>
                    setStartTime(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition [color-scheme:dark] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                />

              </div>

            </div>

            {/* =================================================
                END
            ================================================= */}

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">

              <h3 className="text-sm font-semibold text-blue-400">
                End
              </h3>

              {/* END DATE */}

              <div className="mt-4">

                <label
                  htmlFor="end-date"
                  className="text-sm font-medium text-slate-300"
                >
                  End Date
                </label>

                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) =>
                    setEndDate(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition [color-scheme:dark] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                />

              </div>

              {/* END TIME */}

              <div className="mt-4">

                <label
                  htmlFor="end-time"
                  className="text-sm font-medium text-slate-300"
                >
                  End Time
                </label>

                <input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) =>
                    setEndTime(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition [color-scheme:dark] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                />

              </div>

            </div>

          </div>

          {/* =================================================
              INFO
          ================================================= */}

          <div className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">

            <div className="flex gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
                ℹ️
              </div>

              <div>

                <h3 className="text-sm font-semibold text-blue-300">
                  What happens next?
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  After creating the hackathon, you can
                  configure evaluation rounds, scoring
                  criteria, judges, teams and evaluations.
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
              BUTTONS
          ================================================= */}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/organizer/hackathons"
                )
              }
              disabled={loading}
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                authLoading ||
                !token
              }
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating Hackathon..."
                : "Create Hackathon →"}
            </button>

          </div>

        </form>

      </div>

    </main>
  );
}