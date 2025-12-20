"use client";

// Host dashboard client component

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { logout } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_BASE!;

type EventItem = {
  id: string;
  name: string;
  uploadsOpen: boolean;
  createdAt: string;
  shareUrl: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function HostDashboardClient({ userEmail }: { userEmail: string }) {
  const r = useRouter();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [toggling, setToggling] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function fetchMine() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/events/mine`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(data?.error ?? `Failed: ${res.status}`);
      }
      setEvents(data);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    setErr(null);

    try {
      const res = await fetch(`${API}/api/events`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `Create failed: ${res.status}`);

      // Refresh list so “persisted QR” is just DB-backed state
      await fetchMine();

      // Auto-expand the newly created event (nice UX)
      if (data.eventId) {
        setExpanded((prev) => ({ ...prev, [data.eventId]: true }));
      }

      setName("");
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setCreating(false);
    }
  }
  

  async function setUploadsOpen(eventId: string, uploadsOpen: boolean) {
    setErr(null);

    // optimistic ui update
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, uploadsOpen } : ev))
    );

    setToggling((p) => ({ ...p, [eventId]: true }));

    try {
      const res = await fetch(`${API}/api/events/${eventId}/uploads`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadsOpen }),
      })

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? `Failed: ${res.status}`);
      }

      // trust server response if it differs
      if (typeof data.uploadsOpen === "boolean") {
        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === eventId ? { ...ev, uploadsOpen: data.uploadsOpen } : ev
          )
        );
      }
    } catch (e: any) {
      // revert optimistic update
      await fetchMine();
      setErr(String(e?.message ?? e));
    } finally {
      setToggling((p) => ({ ...p, [eventId]: false }));
    }
  }

  // What this does:
  // only recalculate whether we are in an empty state
  // when loading, err, or events.length changes
  const emptyState = useMemo(
    () => !loading && !err && events.length === 0,
    [loading, err, events.length]
  );

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Host Dashboard</h1>
          <div className="text-sm opacity-70">Signed in as {userEmail}</div>
        </div>

        <button
          className="text-sm underline"
          onClick={async () => {
            await logout();
            r.push("/login");
          }}
        >
          Logout
        </button>
      </header>

      <section className="rounded-xl border p-4 space-y-3">
        <h2 className="text-lg font-medium">Create an Event</h2>

        <form onSubmit={createEvent} className="flex gap-2 flex-wrap">
          <input
            className="flex-1 min-w-[220px] rounded-md border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., New Year Party"
          />
          <button
            className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50"
            disabled={!name.trim() || creating}
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </form>

        {err && <p className="text-sm text-red-600">Error: {err}</p>}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-medium">My Events</h2>
          <button className="text-sm underline" onClick={fetchMine}>
            Refresh
          </button>
        </div>

        {loading && <p className="text-sm opacity-70">Loading…</p>}
        {emptyState && (
          <p className="text-sm opacity-70">
            No events yet. Create one above — the QR/link will live here so it persists on refresh.
          </p>
        )}

        <div className="space-y-3">
          {events.map((ev) => {
            const isOpen = ev.uploadsOpen;
            const isExpanded = !!expanded[ev.id];

            return (
              <div key={ev.id} className="rounded-xl border p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-lg font-semibold">{ev.name}</div>
                    <div className="text-sm opacity-70">{formatDate(ev.createdAt)}</div>
                    <div
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                        isOpen ? "bg-green-600 border-green-200" : "bg-red-600 border-red-200"
                      }`}
                    >
                      {isOpen ? "Uploads open" : "Uploads closed"}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <a
                      className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 hover:text-blue-600"
                      href={ev.shareUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>

                    <button
                      className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50"
                      disabled={!!toggling[ev.id]}
                      onClick={() => setUploadsOpen(ev.id, !ev.uploadsOpen)}
                    >
                      {toggling[ev.id]
                        ? "Saving…"
                        : ev.uploadsOpen
                          ? "Close uploads"
                          : "Open uploads"}
                    </button>

                    <button
                      className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 hover:text-blue-600"
                      onClick={async () => {
                        await navigator.clipboard.writeText(ev.shareUrl);
                        setCopiedId(ev.id);
                        setTimeout(() => setCopiedId((x) => (x === ev.id ? null : x)), 900);
                      }}
                    >
                      {copiedId === ev.id ? "Copied!" : "Copy link"}
                    </button>

                    <button
                      className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 hover:text-blue-600"
                      onClick={() => setExpanded((p) => ({ ...p, [ev.id]: !p[ev.id] }))}
                    >
                      {isExpanded ? "Hide QR" : "Show QR"}
                    </button>
                  </div>
                </div>

                <div className="text-sm break-all opacity-80">
                  <span className="opacity-70">Share URL: </span>
                  <a className="underline" href={ev.shareUrl} target="_blank" rel="noreferrer">
                    {ev.shareUrl}
                  </a>
                </div>

                {isExpanded && (
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="rounded-lg border p-3 bg-white inline-block">
                      <QRCodeCanvas value={ev.shareUrl} size={180} />
                    </div>
                    <div className="text-sm opacity-70">
                      Print this QR code or place it at the party entrance/table.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
