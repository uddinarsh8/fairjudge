"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Search, Users } from "lucide-react";
import { apiRequest } from "@/lib/api";

type PublicHackathon = {
  hackathonId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  mode: "ONLINE" | "OFFLINE" | "HYBRID";
  prizePool: number;
  registrationFee: number;
  registrationFeeType: "PER_MEMBER" | "PER_TEAM";
  status: "UPCOMING" | "ACTIVE";
};

type PublicHackathonsResponse = {
  hackathons?: PublicHackathon[];
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function PublicHackathonsPage() {
  const router = useRouter();
  const [hackathons, setHackathons] = useState<PublicHackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadHackathons = useCallback(async () => {
    try {
      setError("");
      const response = (await apiRequest(
        "/hackathons/public"
      )) as PublicHackathonsResponse;
      setHackathons(Array.isArray(response.hackathons) ? response.hackathons : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load hackathons."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadHackathons();
    });
  }, [loadHackathons]);

  const filteredHackathons = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return hackathons;

    return hackathons.filter((hackathon) =>
      [hackathon.name, hackathon.description, hackathon.hackathonId]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [hackathons, search]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-lg font-bold"
          >
            Fair<span className="text-blue-500">Judge</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft size={16} /> Home
          </button>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            Find your next challenge
          </p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Open Hackathons
          </h1>
          <p className="mt-4 text-slate-400">
            Browse published hackathons and register your team to take part.
          </p>
        </div>

        <div className="mt-8 max-w-xl">
          <label className="relative block">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by hackathon name or ID"
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-11 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-blue-500"
            />
          </label>
          <p className="mt-2 text-xs text-slate-500">
            You can enter the hackathon ID shown on an event card.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
            Loading available hackathons…
          </div>
        ) : filteredHackathons.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-12 text-center">
            <Users className="mx-auto text-slate-500" size={32} />
            <h2 className="mt-4 text-xl font-semibold">
              {search ? "No matching hackathons" : "No open hackathons right now"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {search
                ? "Try another search term."
                : "Published upcoming and active hackathons will appear here."}
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredHackathons.map((hackathon) => (
              <article
                key={hackathon.hackathonId}
                className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-blue-400">
                      {hackathon.hackathonId}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">
                      {hackathon.name}
                    </h2>
                  </div>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    {hackathon.status === "ACTIVE" ? "Active" : "Upcoming"}
                  </span>
                </div>

                <p className="mt-4 min-h-12 flex-1 text-sm leading-6 text-slate-400">
                  {hackathon.description || "Join this hackathon and submit your project."}
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
                  <CalendarDays size={16} className="text-blue-400" />
                  <span>
                    {formatDate(hackathon.startDate)} – {formatDate(hackathon.endDate)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/hackathons/${encodeURIComponent(hackathon.hackathonId)}`
                    )
                  }
                  className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Register Now
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}
