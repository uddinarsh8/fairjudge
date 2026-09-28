"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  ArrowLeft,
  Mail,
  Shield,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
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

  const initial =
    user.name?.charAt(0)?.toUpperCase() || "O";

  return (
    <div className="min-h-screen bg-[#060D19] text-white">
      <header className="border-b border-white/[0.06]">
        <div className="max-w-[1000px] mx-auto px-6 py-6">
          <button
            onClick={() => router.push("/organizer")}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-white mb-4"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>

          <h1 className="text-2xl font-bold">
            Profile
          </h1>

          <p className="text-xs text-gray-500 mt-1">
            Manage your organizer account information.
          </p>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-6 py-8">
        <section className="rounded-xl border border-white/[0.08] bg-[#0A1525] overflow-hidden">
          <div className="p-8 border-b border-white/[0.06]">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-bold">
                {initial}
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold">
                  Organizer
                </p>

                <h2 className="text-xl font-bold mt-1">
                  {user.name}
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-5">
            <InfoRow
              icon={<User size={16} />}
              label="Full Name"
              value={user.name}
            />

            <InfoRow
              icon={<Mail size={16} />}
              label="Email Address"
              value={user.email}
            />

            <InfoRow
              icon={<Shield size={16} />}
              label="Account Role"
              value="Organizer"
            />
          </div>

          <div className="px-8 py-5 border-t border-white/[0.06]">
            <button
              onClick={() =>
                alert("Profile editing can be connected next.")
              }
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium"
            >
              Edit Profile
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-[#08111F] p-4">
      <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
        {icon}
      </div>

      <div>
        <p className="text-[10px] text-gray-600">
          {label}
        </p>

        <p className="text-sm text-gray-200 mt-1">
          {value}
        </p>
      </div>
    </div>
  );
}