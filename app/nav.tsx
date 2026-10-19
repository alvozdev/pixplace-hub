"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Пульт" },
  { href: "/compose", label: "Новый пост" },
  { href: "/admin", label: "Админка" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="grid grid-cols-3 gap-1 text-sm sm:flex">
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 text-center whitespace-nowrap transition-colors ${
              active ? "bg-ink text-surface" : "text-muted hover:text-ink hover:bg-bg"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
