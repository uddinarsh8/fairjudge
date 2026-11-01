"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  IndianRupee,
  LogIn,
  MapPin,
  Monitor,
  Trophy,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";

type PublicHackathon = {
  hackathonId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  mode?: "ONLINE" | "OFFLINE" | "HYBRID";
  prizePool?: number;
  registrationFee?: number;
  registrationFeeType?: "PER_MEMBER" | "PER_TEAM";
  minTeamSize?: number;
  maxTeamSize?: number;
  status: "UPCOMING" | "ACTIVE";
};

type PublicHackathonResponse = {
  hackathon?: PublicHackathon;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "To be announced";

  return date.toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
  });
};

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(Number(value)) ? Number(value) : 0);

export default function PublicHackathonDetailsPage() {
  const router = useRouter();
  const params = useParams<{ hackathonId: string }>();
  const publicId = Array.isArray(params?.hackathonId)
    ? params.hackathonId[0]
    : params?.hackathonId;
  const { user, token, loading: authLoading } = useAuth();

  const [hackathon, setHackathon] = useState<PublicHackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAccountOptions, setShowAccountOptions] = useState(false);
  const [roleError, setRoleError] = useState("");

  const loadHackathon = useCallback(async () => {
    if (!publicId) {
      setError("Hackathon ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setError("");
      const response = (await apiRequest(
        `/hackathons/public/${encodeURIComponent(publicId)}`
      )) as PublicHackathonResponse;

      if (!response.hackathon) {
        throw new Error("Hackathon not found.");
      }

      setHackathon(response.hackathon);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load this hackathon."
      );
    } finally {
      setLoading(false);
    }
  }, [publicId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadHackathon();
    });
  }, [loadHackathon]);

  const handleRegister = () => {
    if (!hackathon) return;

    localStorage.setItem("fairjudge_hackathon", hackathon.hackathonId);
    setRoleError("");

    if (authLoading) return;

    if (!token || !user) {
      setShowAccountOptions(true);
      return;
    }

    if (user.role === "TEAM" || user.role === "MEMBER") {
      router.push("/team");
      return;
    }

    setRoleError(
      "This account is registered as an organizer or judge. Sign in with a participant account to register."
    );
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-400">
        Loading hackathon details...
      </main>
    );
  }

  if (!hackathon) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => router.push("/hackathons")}
            className="mb-8 flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft size={16} /> Back to Hackathons
          </button>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
            {error || "Hackathon not found."}
          </div>
        </div>
      </main>
    );
  }

  const modeLabel =
    hackathon.mode === "OFFLINE"
      ? "In person"
      : hackathon.mode === "HYBRID"
        ? "Hybrid"
        : "Online";
  const fee = Number(hackathon.registrationFee ?? 0);
  const feeBasis =
    hackathon.registrationFeeType === "PER_MEMBER" ? "per member" : "per team";

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push("/hackathons")}
          className="mb-8 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Hackathons
        </button>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 font-mono text-xs text-blue-300">
              {hackathon.hackathonId}
            </span>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              {hackathon.status === "ACTIVE" ? "Registration open" : "Upcoming"}
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-bold sm:text-5xl">{hackathon.name}</h1>
          <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-slate-300">
            {hackathon.description || "Join this hackathon and submit your project."}
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CalendarDays size={17} className="text-blue-400" /> Starts
              </div>
              <p className="mt-3 font-medium">{formatDateTime(hackathon.startDate)}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock3 size={17} className="text-blue-400" /> Ends
              </div>
              <p className="mt-3 font-medium">{formatDateTime(hackathon.endDate)}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <MapPin size={17} className="text-blue-400" /> Location
              </div>
              <p className="mt-3 font-medium">
                {hackathon.location?.trim() || (modeLabel === "Online" ? "Online" : "To be announced")}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Monitor size={17} className="text-blue-400" /> Event mode
              </div>
              <p className="mt-3 font-medium">{modeLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Trophy size={17} className="text-amber-400" /> Total prize pool
              </div>
              <p className="mt-3 font-medium">{formatCurrency(hackathon.prizePool)}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <IndianRupee size={17} className="text-blue-400" /> Registration fee
              </div>
              <p className="mt-3 font-medium">
                {fee <= 0 ? "Free" : `${formatCurrency(fee)} ${feeBasis}`}
              </p>
              {fee > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  Charged {feeBasis}.
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Users size={17} className="text-blue-400" /> Team size
              </div>
              <p className="mt-3 font-medium">
                {hackathon.minTeamSize ?? 1}–{hackathon.maxTeamSize ?? 5} members
              </p>
              <p className="mt-1 text-xs text-slate-500">Includes the team leader.</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-300">
                <Users size={17} /> Ready to take part?
              </div>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Continue to the participant dashboard to create or manage your team for this hackathon.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRegister}
              disabled={authLoading}
              className="shrink-0 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
            >
              {authLoading ? "Checking account..." : "Register Now"}
            </button>
          </div>
          {roleError && (
            <p role="alert" className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {roleError}
            </p>
          )}
        </section>
      </div>

      {showAccountOptions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowAccountOptions(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-dialog-title"
            className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
          >
            <button
              type="button"
              aria-label="Close account options"
              onClick={() => setShowAccountOptions(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
            >
              <X size={18} />
            </button>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
              Join {hackathon.name}
            </p>
            <h2 id="registration-dialog-title" className="mt-2 text-2xl font-bold">
              Continue as a participant
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Sign in to your participant account or create one to continue registration. This hackathon will be selected automatically.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold transition hover:bg-slate-800"
              >
                <LogIn size={16} /> Log in
              </button>
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold transition hover:bg-blue-500"
              >
                <UserPlus size={16} /> Create account
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
