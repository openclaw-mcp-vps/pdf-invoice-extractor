"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

type UnlockFormProps = {
  initialSessionId?: string;
  nextPath?: string;
};

export function UnlockForm({ initialSessionId, nextPath }: UnlockFormProps): React.JSX.Element {
  const [sessionId, setSessionId] = useState(initialSessionId ?? "");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setStatus(null);

    if (!sessionId.trim()) {
      setError("Enter a Stripe Checkout Session ID.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/access/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sessionId: sessionId.trim() })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
        throw new Error(payload?.error ?? payload?.message ?? "Unlock failed");
      }

      setStatus("Access granted. Redirecting...");
      const destination = nextPath && nextPath.startsWith("/") ? nextPath : "/upload";
      window.location.href = destination;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unlock failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="session-id" className="block text-sm font-medium text-[#dce8f6]">
        Stripe Checkout Session ID
      </label>
      <input
        id="session-id"
        type="text"
        value={sessionId}
        onChange={(event) => setSessionId(event.target.value)}
        placeholder="cs_test_..."
        className="w-full rounded-lg border border-[#2b3547] bg-[#0f1726] px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-[#2f81f7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f6fda] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Checking payment..." : "Unlock Access"}
      </button>

      {status ? <p className="rounded-md border border-[#295935] bg-[#13241a] px-3 py-2 text-sm text-[#9fe3ad]">{status}</p> : null}
      {error ? <p className="rounded-md border border-[#5c2732] bg-[#30151d] px-3 py-2 text-sm text-[#ffb3c2]">{error}</p> : null}
    </form>
  );
}
