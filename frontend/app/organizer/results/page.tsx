"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  ArrowLeft,
  Download,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function ResultsPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user || !token) {
      router.replace("/login");
      return;
    }

    if (String(user.role).toUpperCase() !== "ORGANIZER") {
      router.replace("/login");
    }
  }, [loading, user, token, router]);

  if (loading || !user || !token) {
    return (
      <div className="min-h-screen bg-[#060D19] flex items-center justify-center text-white">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060D19] text-white">
      <header className="border-b border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <button
            onClick={() => router.push("/organizer")}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-white mb-4"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center">
                <Trophy size={20} />
              </div>

              <div>
                <h1 className="text-2xl font-bold">
                  Results
                </h1>

                <p className="text-xs text-gray-500 mt-1">
                  View final rankings and evaluation results.
                </p>
              </div>
            </div>

            <button
              onClick={() => alert("Export feature coming next.")}
              className="px-4 py-2.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] text-xs flex items-center gap-2"
            >
              <Download size={14} />
              Export Results
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-8">
        <section className="rounded-xl border border-white/[0.08] bg-[#0A1525] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="font-semibold text-sm">
              Hackathon Results
            </h2>

            <p className="text-[10px] text-gray-600 mt-1">
              Final rankings will be displayed here after evaluations
              are completed.
            </p>
          </div>

          <div className="py-24 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center">
              <Trophy size={28} />
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              No results available
            </h3>

            <p className="mt-2 text-xs text-gray-600 max-w-md mx-auto">
              Results will appear once judges complete their evaluations.
            </p>

            <button
              onClick={() => router.push("/organizer/hackathons")}
              className="mt-5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs"
            >
              View Hackathons
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}