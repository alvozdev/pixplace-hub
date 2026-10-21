"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-renders the page every few seconds while n8n is still working on a job. */
export default function AutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(t);
  }, [active, router]);
  return null;
}
