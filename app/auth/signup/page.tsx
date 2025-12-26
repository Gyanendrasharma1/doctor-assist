"use client";

import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#ede9fe] via-[#c7d2fe] to-[#93c5fd]">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-xl">
        <h1 className="tracking-widest text-sm text-gray-900 mb-6 text-center">
          CREATE ACCOUNT
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 px-4 py-3 rounded-xl border outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 px-4 py-3 rounded-xl border outline-none"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full mb-6 px-4 py-3 rounded-xl border outline-none"
        />

        <button className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
          Sign Up
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
