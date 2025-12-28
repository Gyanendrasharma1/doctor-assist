"use client";

import { User, LogOut, Clock } from "lucide-react";
import { useSession } from "next-auth/react";

type Props = {
  onClose: () => void;
  onOpenHistory: () => void;
  onLogout: () => void;
};

export default function SettingsPanel({
  onClose,
  onOpenHistory,
  onLogout,
}: Props) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur">
        <div className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white/95 p-6">
          <p className="text-sm text-gray-500">Loading profile…</p>
        </div>
      </div>
    );
  }

  const email = session?.user?.email ?? "Unknown doctor";

  return (
    <div
      className="fixed inset-0 z-30 bg-black/40 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white/95 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="tracking-widest text-sm text-gray-900 mb-6">
          SETTINGS
        </h2>

        {/* PROFILE */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-100 mb-6">
          <User size={18} className="text-gray-700" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Doctor Profile
            </p>
            <p className="text-xs text-gray-600">
              {email}
            </p>
          </div>
        </div>

        {/* HISTORY */}
        <button
          onClick={onOpenHistory}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border text-sm text-gray-900 mb-3"
        >
          <Clock size={16} />
          View History
        </button>

        {/* LOGOUT */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 text-white text-sm font-medium mt-6"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}
