import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import HostDashboardClient from "./HostDashboardClient";

const API = process.env.NEXT_PUBLIC_API_BASE!;

async function requireMe() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value;
  console.log("Token from cookies:", token);
  if (!token) redirect("/login?next=/host");

  const res = await fetch(`${API}/api/auth/me`, {
    headers: { cookie: `token=${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
	console.log("Redirecting to login from host page");
	console.log("Response status:", res.status);
	redirect("/login?next=/host");
  }
  return res.json();
}

export default async function HostPage() {
  const me = await requireMe();
  return <HostDashboardClient userEmail={me.email} />;
}
