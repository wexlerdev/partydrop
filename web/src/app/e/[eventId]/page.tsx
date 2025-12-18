type EventDto = {
  id: string;
  name: string;
  uploadsOpen: boolean;
  createdAt: string;
};

const API = process.env.NEXT_PUBLIC_API_BASE!;

export default async function EventPage({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = await params;
  const res = await fetch(`${API}/api/events/${eventId}`, { cache: "no-store" });

  if (!res.ok) {
    return (
      <main className="mx-auto max-w-xl p-6 space-y-2">
        <h1 className="text-2xl font-semibold">Event</h1>
        <p className="text-sm text-red-600">Event not found (status {res.status}).</p>
      </main>
    );
  }

  const event = (await res.json()) as EventDto;

  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{event.name}</h1>

      <div
        className={`inline-flex items-center rounded-full border px-3 py-1 text-sm ${
          event.uploadsOpen ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
        }`}
      >
        {event.uploadsOpen ? "Uploads open" : "Uploads closed"}
      </div>

      <p className="text-sm opacity-70">
        Photo upload UI coming next.
      </p>
    </main>
  );
}
