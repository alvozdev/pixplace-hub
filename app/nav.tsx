"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const LINKS = [
  { href: "/drafts", label: "Черновики" },
  { href: "/niches", label: "Ниши" },
  { href: "/", label: "Пульт" },
  { href: "/admin", label: "Админка" },
];

/** Glass segmented nav; the lit pill slides to the active page. */
export default function Nav({ id }: { id: string }) {
  const path = usePathname();
  return (
    <nav className="btn-glass grid grid-cols-4 gap-0.5 p-1 text-sm sm:flex">
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`relative isolate rounded-full px-2 py-1.5 text-center text-[13px] sm:px-3.5 sm:text-sm whitespace-nowrap transition-colors duration-300 ${active ? "text-white" : "text-muted hover:text-ink"}`}
          >
            {active && (
              <motion.span
                layoutId={`nav-pill-${id}`}
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-b from-[#5b9bff] to-[#2563eb] shadow-[0_6px_24px_-6px_rgb(59_130_246/0.9),inset_0_1px_0_rgb(255_255_255/0.35)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
