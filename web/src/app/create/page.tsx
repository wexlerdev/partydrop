import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CreateEventClient from "./CreateEventClient";

const API = process.env.NEXT_PUBLIC_API_BASE!;

async function requireMe() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${API}/api/auth/me`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (!res.ok) redirect("/login?next=/create");
  return res.json();
}

export default async function CreatePage() {
  const me = await requireMe();
  return <CreateEventClient userEmail={me.email} />;
}
