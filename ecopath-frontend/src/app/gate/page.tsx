"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function GateForm() {
  const params = useSearchParams();
  const nextPath = params.get("next") || "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/site-auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { success?: boolean };
      if (!res.ok || !data?.success) throw new Error("Invalid password");
      // Use window.location.href for full page reload to ensure cookie is set
      window.location.href = nextPath;
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow p-6 space-y-4"
      >
        <h1 className="text-2xl font-bold text-slate-800 text-center">Protected Access</h1>
        <p className="text-sm text-slate-600 text-center">Enter the site password to continue.</p>
        <label className="block">
          <span className="text-sm text-slate-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Enter password"
            required
            autoFocus
          />
        </label>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Enter"}
        </button>
      </form>
    </div>
  );
}

export default function GatePage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}
    >
      <GateForm />
    </Suspense>
  );
}
