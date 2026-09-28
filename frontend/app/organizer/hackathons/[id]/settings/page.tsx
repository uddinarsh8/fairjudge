"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type HackathonStatus =
  | "DRAFT"
  | "UPCOMING"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";

type Hackathon = {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: HackathonStatus;
};

export default function HackathonSettingsPage() {
  const router = useRouter();
  const params = useParams();

  const { token } = useAuth();

  const hackathonId = params.id as string;

  const [hackathon, setHackathon] =
    useState<Hackathon | null>(null);

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [status, setStatus] =
    useState<HackathonStatus>("DRAFT");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    const loadHackathon = async () => {
      if (!token || !hackathonId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await apiRequest(
            `/hackathons/${hackathonId}`,
            {
              token,
            }
          );

        const data = response.hackathon;

        setHackathon(data);

        setName(data.name || "");

        setDescription(
          data.description || ""
        );

        setStartDate(
          data.startDate
            ? new Date(data.startDate)
                .toISOString()
                .slice(0, 16)
            : ""
        );

        setEndDate(
          data.endDate
            ? new Date(data.endDate)
                .toISOString()
                .slice(0, 16)
            : ""
        );

        setStatus(
          data.status || "DRAFT"
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load hackathon settings"
        );
      } finally {
        setLoading(false);
      }
    };

    loadHackathon();
  }, [token, hackathonId]);

  const handleSave = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!token) {
      setError(
        "You must be logged in"
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await apiRequest(
          `/hackathons/${hackathonId}`,
          {
            method: "PUT",
            token,
            body: {
              name,
              description,
              startDate,
              endDate,
              status,
            },
          }
        );

      setHackathon(
        response.hackathon
      );

      setSuccess(
        "Hackathon updated successfully"
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update hackathon"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token) {
      setError(
        "You must be logged in"
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${hackathon?.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await apiRequest(
        `/hackathons/${hackathonId}`,
        {
          method: "DELETE",
          token,
        }
      );

      router.push(
        "/organizer/hackathons"
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete hackathon"
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading settings...
      </main>
    );
  }

  if (!hackathon) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <p className="text-slate-400">
            Hackathon not found.
          </p>

          <button
            onClick={() =>
              router.push(
                "/organizer/hackathons"
              )
            }
            className="mt-5 rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
          >
            ← Back to Hackathons
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}

        <button
          onClick={() =>
            router.push(
              `/organizer/hackathons/${hackathonId}`
            )
          }
          className="mb-5 text-sm text-slate-400 hover:text-white"
        >
          ← Back to Hackathon
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Hackathon Settings
          </h1>

          <p className="mt-2 text-slate-400">
            Update your hackathon details and configuration.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
            {success}
          </div>
        )}

        {/* SETTINGS FORM */}

        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          <div className="space-y-6">

            {/* NAME */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Hackathon Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            {/* DESCRIPTION */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                required
                rows={6}
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            {/* DATES */}

            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Start Date
                </label>

                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(
                      event.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  End Date
                </label>

                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(event) =>
                    setEndDate(
                      event.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>

            </div>

            {/* STATUS */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Hackathon Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as HackathonStatus
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                <option value="DRAFT">
                  Draft
                </option>

                <option value="UPCOMING">
                  Upcoming
                </option>

                <option value="ONGOING">
                  Ongoing
                </option>

                <option value="COMPLETED">
                  Completed
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </div>

            {/* SAVE BUTTON */}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>

          </div>
        </form>

        {/* DANGER ZONE */}

        <section className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h2 className="text-lg font-semibold text-red-400">
            Danger Zone
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Deleting this hackathon will permanently remove
            the hackathon from your organizer dashboard.
          </p>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="mt-5 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting
              ? "Deleting..."
              : "Delete Hackathon"}
          </button>
        </section>

      </div>
    </main>
  );
}