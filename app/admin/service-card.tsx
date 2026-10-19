"use client";
import { useActionState, useState, useTransition } from "react";
import type { Service } from "@/lib/credentials";
import { removeField, saveService, testService, type ActionResult } from "./actions";

type Current = Record<string, { shown: string; source: "admin" | "env" } | null>;

export default function ServiceCard({ service, current }: { service: Service; current: Current }) {
  const [saved, save, saving] = useActionState(saveService.bind(null, service.id), null);
  const [test, setTest] = useState<ActionResult | null>(null);
  const [testing, startTest] = useTransition();
  const done = service.fields.filter((f) => current[f.key]).length;
  const ready = done === service.fields.length;

  return (
    <form action={save} onSubmit={() => setTest(null)} className="space-y-4 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${ready ? "bg-ok" : "ring-2 ring-inset ring-muted"}`} />
        <h2 className="font-medium">{service.title}</h2>
        <span className={`ml-auto text-xs ${ready ? "text-ok" : "text-warn"}`}>
          {ready ? "подключено" : `заполнено ${done} из ${service.fields.length}`}
        </span>
      </div>
      <p className="text-xs text-muted">{service.how}</p>

      <div className="space-y-3">
        {service.fields.map((f) => {
          const cur = current[f.key];
          const id = `${service.id}-${f.key}`;
          return (
            <div key={f.key} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor={id} className="text-sm">{f.label}</label>
                {cur && (
                  <span className="flex items-center gap-2 font-mono text-[11px] text-muted">
                    {cur.shown}
                    {cur.source === "admin" && (
                      <button type="button" onClick={() => removeField(f.key)} className="text-bad hover:underline">
                        удалить
                      </button>
                    )}
                  </span>
                )}
              </div>
              <input
                id={id}
                name={f.key}
                type={f.secret ? "password" : "text"}
                autoComplete="off"
                placeholder={cur ? "оставьте пустым, чтобы не менять" : f.placeholder ?? ""}
                className="w-full rounded-lg border border-line bg-bg/40 px-3 py-2 font-mono text-xs outline-none focus:border-ink"
              />
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <button disabled={saving} className="rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-surface disabled:opacity-50">
          {saving ? "Сохраняем…" : "Сохранить"}
        </button>
        {service.testable && (
          <button
            type="button"
            disabled={testing}
            onClick={() => startTest(async () => setTest(await testService(service.id)))}
            className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-ink disabled:opacity-50"
          >
            {testing ? "Проверяем…" : "Проверить"}
          </button>
        )}
        {(test ?? saved) && (
          <span className={`text-xs ${(test ?? saved)!.ok ? "text-ok" : "text-bad"}`}>{(test ?? saved)!.message}</span>
        )}
      </div>
    </form>
  );
}
