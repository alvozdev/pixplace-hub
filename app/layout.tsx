import type { Metadata } from "next";
import Nav from "./nav";
import { logout } from "./login/actions";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pix Place — пульт публикаций",
  description: "Генерация и публикация контента Pix Place по нишам и площадкам",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const signedIn = Boolean((await cookies()).get(SESSION_COOKIE));
  return (
    <html lang="ru">
      <body className="min-h-dvh">
        <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
            <a href="/" className="flex shrink-0 items-baseline gap-2">
              <span className="font-display text-[15px] font-semibold tracking-tight">pix place</span>
              <span className="font-mono text-[11px] text-muted">/ пульт</span>
            </a>
            {signedIn && <div className="hidden sm:block"><Nav /></div>}
            {signedIn && (
              <form action={logout} className="ml-auto">
                <button className="rounded-md px-2 py-1.5 text-xs text-muted hover:text-ink">Выйти</button>
              </form>
            )}
          </div>
          {signedIn && <div className="border-t border-line px-4 py-2 sm:hidden"><Nav /></div>}
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
