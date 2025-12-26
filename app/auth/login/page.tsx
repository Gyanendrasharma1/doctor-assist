"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    localStorage.setItem("doctor_auth", "true");
    router.push("/chat");
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#ede9fe] via-[#c7d2fe] to-[#93c5fd]">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-xl">
        <h1 className="tracking-widest text-sm text-gray-900 mb-6 text-center">
          DOCTOR LOGIN
        </h1>

        <input type="email" placeholder="Email" className="w-full mb-4 px-4 py-3 rounded-xl border outline-none" />
        <input type="password" placeholder="Password" className="w-full mb-6 px-4 py-3 rounded-xl border outline-none" />

        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
        >
          Login
        </button>

        <p className="text-xs text-center mt-4 text-gray-700">
          No account? <Link href="/auth/signup" className="underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
