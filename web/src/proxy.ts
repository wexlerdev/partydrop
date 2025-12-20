import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


// reminder wex, this runs on the server side, and checks if there is a token cookie
// to quickly redirect unauthenticated users away from protected routes like /create
// this does not cover invalid/expired tokens

export function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // Protect /create (and later /host, /dashboard, etc.)
  const isProtected = req.nextUrl.pathname.startsWith("/create") ||
		req.nextUrl.pathname.startsWith("/host");

  if (isProtected && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  console.log("Proxy middleware passed, token found");
  return NextResponse.next();
}

export const config = {
  matcher: ["/host/:path*", "/create/:path*"],
};
