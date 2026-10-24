import type { Metadata } from "next";
import Nav from "./nav";
import { GlowAvatar, Motion, PointerGlow } from "@/components/fx";
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
        <div className="aurora" aria-hidden>
          <i />
          <i />
          <i />
          <i />
        </div>
        <PointerGlow />
        <Motion>
          <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#08080c]/55 backdrop-blur-2xl backdrop-saturate-150">
            <div className="mx-auto flex h-16 max-w-6xl items-center gap-5 px-4">
              <a href="/" className="group flex shrink-0 items-center gap-3">
                <GlowAvatar label="px" size={36} />
                <span className="flex items-baseline gap-2">
                  <span className="text-gradient font-display text-[15px] font-semibold tracking-tight">pix place</span>
                  <span className="hidden font-mono text-[11px] text-muted sm:inline">/ hub</span>
                </span>
              </a>
              {signedIn && <div className="hidden sm:block"><Nav id="top" /></div>}
              {signedIn && (
                <form action={logout} className="ml-auto">
                  <button className="btn-glass px-3.5 py-1.5 text-xs text-muted">Выйти</button>
                </form>
              )}
            </div>
            {signedIn && <div className="px-4 pb-3 sm:hidden"><Nav id="mobile" /></div>}
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </Motion>
      </body>
    </html>
  );
}
