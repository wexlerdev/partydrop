"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginPage() {
  const r = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/host";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      r.push(next);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Host Login</h1>

      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border p-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            autoComplete="email"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Password</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button
          className="w-full rounded-md bg-black text-white px-4 py-2 disabled:opacity-50"
          disabled={!email.trim() || !password || loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        {err && <p className="text-sm text-red-600">Error: {err}</p>}
      </form>

      <p className="text-sm opacity-70">
        No account yet? Go to <a className="underline" href="/register">register</a>.
      </p>
    </main>
  );
}
