"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setError("");

    if (!email || !password || !confirm) {
      setError("All fields required");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Signup failed");
      return;
    }

    // success → go to login
    router.push("/auth/login");
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#ede9fe] via-[#c7d2fe] to-[#93c5fd]">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-xl">
        <h1 className="tracking-widest text-sm text-gray-900 mb-6 text-center">
          CREATE ACCOUNT
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-xl border outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-xl border outline-none"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-xl border outline-none"
        />

        {error && (
          <p className="text-red-600 text-sm mb-3 text-center">
            {error}
          </p>
        )}

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p className="text-xs text-center mt-4 text-gray-700">
          Already have an account?{" "}
          <Link href="/auth/login" className="underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
