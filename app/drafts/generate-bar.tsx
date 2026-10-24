"use client";
import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { GlowAvatar, Notice, NumberTicker, Reveal, TiltCard } from "@/components/fx";
import { generate, type ActionResult } from "./actions";

interface Item {
  id: string;
  name: string;
  enabled: boolean;
  used: number;
  limit: number;
  styles: number;
}

const initials = (name: string) => name.split(/[\s&]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/** One glass launch card per niche: today's usage as an animated meter and a shimmer "Generate" pill. */
export default function GenerateBar({ niches }: { niches: Item[] }) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);

  return (
    <section className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {niches.map((n, i) => {
          const full = n.used >= n.limit;
          const loading = pending && busy === n.id;
          return (
            <Reveal key={n.id} i={i}>
              <TiltCard className={`p-4 ${n.enabled ? "" : "opacity-60"}`}>
                <div className="flex items-center gap-3">
                  <GlowAvatar label={initials(n.name)} live={n.enabled} />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{n.name}</div>
                    <div className="text-xs text-muted">{n.enabled ? `${n.styles} ${n.styles === 1 ? "картинка" : "картинки"} в посте` : "выключена"}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="font-display text-lg leading-none">
                      <NumberTicker value={n.used} />
                      <span className="text-muted">/{n.limit}</span>
                    </div>
                    <div className="text-[11px] text-muted">сегодня</div>
                  </div>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber via-pink to-violet"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (n.used / Math.max(1, n.limit)) * 100)}%` }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.06 }}
                  />
                </div>
                <button
                  disabled={pending || !n.enabled || full}
                  onClick={() => {
                    setBusy(n.id);
                    start(async () => setResult(await generate(n.id)));
                  }}
                  className="btn-primary mt-4 flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm"
                >
                  {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  {loading ? "Запускаем…" : full ? "Лимит на сегодня" : "Сгенерировать"}
                </button>
              </TiltCard>
            </Reveal>
          );
        })}
      </div>
      <Notice result={result} />
    </section>
  );
}
