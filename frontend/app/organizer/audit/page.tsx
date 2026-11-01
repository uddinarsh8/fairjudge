"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";

export default function AuditPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => router.push("/organizer")}
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
            <ClipboardList size={22} />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Audit Trail</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Audit records are not available yet. This page will show evaluation history when audit logging is connected.
          </p>
        </section>
      </div>
    </main>
  );
}
