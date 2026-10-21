"use client";
import { useState, useTransition } from "react";
import { generate, type ActionResult } from "./actions";

interface Item {
  id: string;
  name: string;
  enabled: boolean;
  used: number;
  limit: number;
}

export default function GenerateBar({ niches }: { niches: Item[] }) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {niches.map((n) => {
          const full = n.used >= n.limit;
          return (
            <button
              key={n.id}
              disabled={pending || !n.enabled || full}
              onClick={() => {
                setBusy(n.id);
                start(async () => setResult(await generate(n.id)));
              }}
              className="flex w-full items-center justify-between gap-3 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-surface disabled:opacity-40 sm:w-auto"
            >
              <span>{pending && busy === n.id ? "Запускаем…" : `Сгенерировать · ${n.name}`}</span>
              <span className="font-mono text-[11px] text-surface/70">
                {n.used}/{n.limit} сегодня
              </span>
            </button>
          );
        })}
      </div>
      {result && <p className={`text-sm ${result.ok ? "text-ok" : "text-bad"}`}>{result.message}</p>}
    </section>
  );
}
