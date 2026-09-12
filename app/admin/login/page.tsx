"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to sign in.");
      router.replace("/admin");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08090b] px-5 text-white mt-20">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0b0d10] p-7 shadow-2xl sm:p-10">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300/60">
          COMSATS Media Club
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight">
          Media Club Admin
        </h1>
        <p className="mt-4 text-sm leading-6 text-white/40">
          Manage the people, stories and applications behind the club.
        </p>
        <form onSubmit={submit} className="mt-9 space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-white/45">
              Registration Number
            </span>
            <input
              value={registrationNumber}
              onChange={(event) => setRegistrationNumber(event.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm outline-none focus:border-blue-300/50"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-white/45">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm outline-none focus:border-blue-300/50"
            />
          </label>
          {message && (
            <p role="alert" className="text-sm text-red-300">
              {message}
            </p>
          )}
          <button
            disabled={loading}
            className="w-full rounded-full bg-white px-5 py-3.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
