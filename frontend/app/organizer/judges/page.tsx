"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Gavel, Mail, Plus, Users, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";

type Judge = {
  _id: string;
  name: string;
  email: string;
  expertise?: string;
  createdAt?: string;
};

export default function JudgesPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [judges, setJudges] = useState<Judge[]>([]);
  const [loadingJudges, setLoadingJudges] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [expertise, setExpertise] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token || String(user.role).toUpperCase() !== "ORGANIZER") {
      router.replace("/login");
    }
  }, [authLoading, user, token, router]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const loadJudges = async () => {
      setLoadingJudges(true);
      try {
        const response = await apiRequest("/organizer/judges", { token });
        if (!cancelled) setJudges(response.judges || []);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load judges");
        }
      } finally {
        if (!cancelled) setLoadingJudges(false);
      }
    };

    void loadJudges();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleCreateJudge = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const response = await apiRequest("/organizer/judges", {
        method: "POST",
        token: token || undefined,
        body: { name: name.trim(), email: email.trim(), expertise: expertise.trim() },
      });
      if (response.judge) {
        setJudges((current) => [response.judge, ...current]);
      }
      setSuccess(response.message || `Judge login details sent to ${email.trim()}`);
      setName("");
      setEmail("");
      setExpertise("");
      setIsCreateOpen(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create judge account");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060D19] text-white">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060D19] text-white">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-[1200px] px-6 py-6">
          <button onClick={() => router.push("/organizer")} className="mb-4 flex items-center gap-2 text-xs text-gray-500 hover:text-white">
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400"><Gavel size={20} /></div>
              <div>
                <h1 className="text-2xl font-bold">Judges</h1>
                <p className="mt-1 text-xs text-gray-500">Create judge accounts and manage your evaluator list.</p>
              </div>
            </div>
            <button onClick={() => { setError(""); setIsCreateOpen(true); }} className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium hover:bg-blue-500">
              <Plus size={14} /> Add Judge
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-8">
        {success && (
          <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
            <Check size={18} className="mt-0.5 shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatCard title="Total Judges" value={loadingJudges ? "—" : String(judges.length)} icon={<Gavel size={18} />} />
          <StatCard title="With Expertise Added" value={loadingJudges ? "—" : String(judges.filter((judge) => Boolean(judge.expertise?.trim())).length)} icon={<Users size={18} />} />
        </div>

        <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0A1525]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-sm font-semibold">Judge Management</h2>
            <p className="mt-1 text-[10px] text-gray-500">New judges receive their login password by email. It is never shown in this dashboard.</p>
          </div>

          {loadingJudges ? (
            <div className="py-16 text-center text-sm text-gray-500">Loading judges...</div>
          ) : judges.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400"><Gavel size={25} /></div>
              <h3 className="mt-5 font-semibold">No judges yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-xs text-gray-500">Create a judge account, then assign them to hackathon evaluation rounds.</p>
              <button onClick={() => setIsCreateOpen(true)} className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-xs hover:bg-blue-500">Add Your First Judge</button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {judges.map((judge) => (
                <div key={judge._id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-medium">{judge.name}</h3>
                    <p className="mt-1 flex items-center gap-2 text-xs text-gray-400"><Mail size={13} />{judge.email}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-gray-300">{judge.expertise || "Expertise not specified"}</p>
                    <p className="mt-1 text-[10px] text-gray-600">Judge account</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) setIsCreateOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="create-judge-title" className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0A1525] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">Judge account</p>
                <h2 id="create-judge-title" className="mt-2 text-xl font-bold">Add a judge</h2>
                <p className="mt-2 text-sm text-gray-400">We’ll generate a unique password and email the login details directly to the judge.</p>
              </div>
              <button type="button" aria-label="Close" disabled={isSaving} onClick={() => setIsCreateOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateJudge} className="mt-6 space-y-4">
              <label className="block text-sm text-gray-300">Name *
                <input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required disabled={isSaving} className="mt-2 w-full rounded-lg border border-white/10 bg-[#060D19] px-3 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-60" placeholder="Judge name" />
              </label>
              <label className="block text-sm text-gray-300">Email / login ID *
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required disabled={isSaving} className="mt-2 w-full rounded-lg border border-white/10 bg-[#060D19] px-3 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-60" placeholder="judge@example.com" />
              </label>
              <label className="block text-sm text-gray-300">Expertise <span className="text-gray-500">(optional)</span>
                <input value={expertise} onChange={(event) => setExpertise(event.target.value)} maxLength={300} disabled={isSaving} className="mt-2 w-full rounded-lg border border-white/10 bg-[#060D19] px-3 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-60" placeholder="e.g. AI, product design, fintech" />
              </label>
              {error && <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
              <div className="flex justify-end gap-3 border-t border-white/[0.08] pt-4">
                <button type="button" disabled={isSaving} onClick={() => setIsCreateOpen(false)} className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSaving} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60">{isSaving ? "Creating and emailing…" : "Create Judge"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0A1525] p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">{icon}</div>
      <p className="mt-4 text-[10px] text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
