"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function TeamLeadLoginPage() {
  const router = useRouter();
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/team-lead/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Unable to sign in.");
        return;
      }
      router.replace(result.redirect || "/team-lead/dashboard");
    } catch {
      setError("Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08090b] px-4 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-xl border border-white/10 bg-[#0f1216] p-6 shadow-2xl"
      >
        <div>
          <h1 className="text-2xl font-semibold">Team Lead Portal</h1>
          <p className="mt-2 text-sm text-white/55">
            Sign in with your team lead account.
          </p>
        </div>
        {error && (
          <p className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
            {error}
          </p>
        )}
        <label className="block text-sm">
          Registration number
          <input
            required
            value={registrationNumber}
            onChange={(event) => setRegistrationNumber(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 outline-none focus:border-white/50"
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 outline-none focus:border-white/50"
          />
        </label>
        <button
          disabled={loading}
          className="w-full rounded-lg bg-white px-4 py-2.5 font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
