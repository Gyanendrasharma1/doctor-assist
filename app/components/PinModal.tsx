// app/components/PinModal.tsx
"use client";

import { X } from "lucide-react";

type Props = {
  pin: string;
  setPin: (v: string) => void;
  onVerify: () => void;
  onClose: () => void;
};

export default function PinModal({
  pin,
  setPin,
  onVerify,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500"
        >
          <X size={18} />
        </button>

        <h3 className="text-xs tracking-widest mb-5 text-center text-gray-900">
          ENTER PIN
        </h3>

        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full px-4 py-3 border rounded-xl outline-none mb-4 text-center tracking-widest text-gray-900"
          placeholder="••••"
        />

        <button
          onClick={onVerify}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}
