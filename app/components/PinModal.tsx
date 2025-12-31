"use client";

import { useState } from "react";
import { Lock, X } from "lucide-react";

type PinMode = "create" | "verify";

type Props = {
  mode: PinMode;
  onClose: () => void;
  onSubmit: (pin: string) => Promise<void> | void;
  error?: string;
};

export default function PinModal({
  mode,
  onClose,
  onSubmit,
  error,
}: Props) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isCreate = mode === "create";

  const handleSubmit = async () => {
    setLocalError(null);

    if (!/^\d{4}$/.test(pin)) {
      setLocalError("PIN must be exactly 4 digits");
      return;
    }

    if (isCreate && pin !== confirmPin) {
      setLocalError("PINs do not match");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(pin);
    } catch {
      setLocalError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock size={18} />
            <h2 className="text-sm font-semibold tracking-widest">
              {isCreate ? "CREATE HISTORY PIN" : "ENTER HISTORY PIN"}
            </h2>
          </div>

          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* DESCRIPTION */}
        <p className="text-xs text-gray-500 mb-4">
          {isCreate
            ? "Create a 4-digit PIN to protect your chat history."
            : "Enter your 4-digit PIN to view chat history."}
        </p>

        {/* PIN INPUT */}
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="••••"
          className="w-full text-center tracking-[0.5em] text-lg px-4 py-3 rounded-xl border outline-none mb-3"
        />

        {/* CONFIRM PIN (CREATE MODE ONLY) */}
        {isCreate && (
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
            placeholder="Confirm PIN"
            className="w-full text-center tracking-[0.5em] text-lg px-4 py-3 rounded-xl border outline-none mb-3"
          />
        )}

        {/* ERROR */}
        {(localError || error) && (
          <p className="text-xs text-red-500 mb-3">
            {localError || error}
          </p>
        )}

        {/* ACTION */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : isCreate
            ? "Create PIN"
            : "Verify PIN"}
        </button>
      </div>
    </div>
  );
}
