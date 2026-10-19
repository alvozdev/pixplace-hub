import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// The whole hub is private: everything except the login page needs a session.
export async function middleware(req: NextRequest) {
  if (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Нужен вход в панель" }, { status: 401 });
  }
  const login = new URL("/login", req.url);
  login.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!login|_next/|favicon.ico).*)"],
};
