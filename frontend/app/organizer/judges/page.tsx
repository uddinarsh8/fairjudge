"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Gavel, ArrowLeft, Plus, Users } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function JudgesPage() {
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
      <header className="border-b border-white/[0.06] bg-[#060D19]">
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <button
            onClick={() => router.push("/organizer")}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-white mb-4"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Gavel size={20} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold">
                    Judges
                  </h1>

                  <p className="text-xs text-gray-500 mt-1">
                    Manage judges assigned to your hackathons.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => alert("Judge invitation feature coming next.")}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium flex items-center gap-2"
            >
              <Plus size={14} />
              Add Judge
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Total Judges"
            value="0"
            icon={<Gavel size={18} />}
          />

          <StatCard
            title="Assigned Judges"
            value="0"
            icon={<Users size={18} />}
          />

          <StatCard
            title="Available Judges"
            value="0"
            icon={<Gavel size={18} />}
          />
        </div>

        <section className="rounded-xl border border-white/[0.08] bg-[#0A1525]">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="font-semibold text-sm">
              Judge Management
            </h2>

            <p className="text-[10px] text-gray-600 mt-1">
              Judges assigned to your hackathons will appear here.
            </p>
          </div>

          <div className="py-20 text-center">
            <div className="w-14 h-14 mx-auto rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Gavel size={25} />
            </div>

            <h3 className="mt-5 font-semibold">
              No judges yet
            </h3>

            <p className="mt-2 text-xs text-gray-600 max-w-sm mx-auto">
              Add judges and assign them to your hackathon evaluation
              rounds.
            </p>

            <button
              onClick={() => alert("Judge invitation feature coming next.")}
              className="mt-5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs"
            >
              Add Your First Judge
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0A1525] p-5">
      <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
        {icon}
      </div>

      <p className="text-[10px] text-gray-600 mt-4">
        {title}
      </p>

      <p className="text-2xl font-bold mt-1">
        {value}
      </p>
    </div>
  );
}