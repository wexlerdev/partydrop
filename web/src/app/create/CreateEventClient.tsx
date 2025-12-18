"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_BASE!;
const WEB = process.env.NEXT_PUBLIC_WEB_BASE!;

export default function CreateEventClient({ userEmail }: { userEmail: string }) {
  const r = useRouter();
  const [name, setName] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/events`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `Create failed: ${res.status}`);

      setEventId(data.eventId);
      setShareUrl(data.shareUrl ?? `${WEB}/e/${data.eventId}`);
      setName("");
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm opacity-70">Signed in as {userEmail}</div>
        <button
          className="text-sm underline"
          onClick={async () => {
            await logout();
            r.push("/login");
          }}
        >
          Logout
        </button>
      </div>

      <h1 className="text-2xl font-semibold">Create Event</h1>

      <form onSubmit={createEvent} className="rounded-xl border p-4 space-y-3">
        <input
          className="w-full rounded-md border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Wex’s Birthday"
        />
        <button
          className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50"
          disabled={!name.trim() || loading}
        >
          {loading ? "Creating…" : "Create"}
        </button>
        {err && <p className="text-sm text-red-600">Error: {err}</p>}
      </form>

      {shareUrl && (
        <section className="rounded-xl border p-4 space-y-3">
          <a className="underline break-all" href={shareUrl} target="_blank" rel="noreferrer">
            {shareUrl}
          </a>
          {eventId && <p className="text-sm opacity-70">Event ID: {eventId}</p>}
          <div className="rounded-lg border p-3 bg-white inline-block">
            <QRCodeCanvas value={shareUrl} size={180} />
          </div>
        </section>
      )}
    </main>
  );
}
