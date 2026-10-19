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
        <header className="border-b border-line bg-surface/80 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto flex max-w-6xl items-center gap-3 sm:gap-6 px-4 h-14">
            <a href="/" className="flex items-baseline gap-2 shrink-0">
              <span className="font-display text-[15px] font-semibold tracking-tight">pix place</span>
              <span className="hidden sm:inline font-mono text-[11px] text-muted">/ пульт</span>
            </a>
            {signedIn && <Nav />}
            {signedIn && (
              <form action={logout} className="ml-auto">
                <button className="text-xs text-muted hover:text-ink">Выйти</button>
              </form>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
