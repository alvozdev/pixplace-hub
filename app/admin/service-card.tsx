"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import type { Service } from "@/lib/credentials";
import { removeField, saveService, testService, type ActionResult } from "./actions";

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

type Current = Record<string, { shown: string; source: "admin" | "env" } | null>;

export default function ServiceCard({ service, current }: { service: Service; current: Current }) {
  const [saved, save, saving] = useActionState(saveService.bind(null, service.id), null);
  const [test, setTest] = useState<ActionResult | null>(null);
  const [testing, startTest] = useTransition();
  const required = service.fields.filter((f) => !f.optional);
  const counted = required.length ? required : service.fields;
  const done = counted.filter((f) => current[f.key]).length;
  const ready = required.length ? done === required.length : done > 0;
  // Field values are controlled so "Сгенерировать" can fill one in; cleared after each save.
  const [shown, setShown] = useState<Record<string, string>>({});
  useEffect(() => {
    if (saved?.ok) setShown({});
  }, [saved]);

  return (
    <form action={save} onSubmit={() => setTest(null)} className="min-w-0 space-y-4 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${ready ? "bg-ok" : "ring-2 ring-inset ring-muted"}`} />
        <h2 className="font-medium">{service.title}</h2>
        <span className={`ml-auto text-xs ${ready ? "text-ok" : "text-warn"}`}>
          {ready && done === counted.length ? "подключено" : `заполнено ${done} из ${counted.length}`}
        </span>
      </div>
      <p className="text-xs text-muted">{service.how}</p>

      <div className="space-y-3">
        {service.fields.map((f) => {
          const cur = current[f.key];
          const id = `${service.id}-${f.key}`;
          return (
            <div key={f.key} className="space-y-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <label htmlFor={id} className="text-sm">{f.label}</label>
                {cur && (
                  <span className="flex min-w-0 items-center gap-2 break-all font-mono text-[11px] text-muted">
                    {cur.shown}
                    {cur.source === "admin" && (
                      <button type="button" onClick={() => removeField(f.key)} className="text-bad hover:underline">
                        удалить
                      </button>
                    )}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  id={id}
                  name={f.key}
                  type={f.secret && !(f.generate && shown[f.key]) ? "password" : "text"}
                  autoComplete="off"
                  value={shown[f.key] ?? ""}
                  onChange={(e) => setShown({ ...shown, [f.key]: e.target.value })}
                  placeholder={cur ? "оставьте пустым, чтобы не менять" : f.placeholder ?? ""}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-bg/40 px-3 py-2 font-mono text-xs outline-none focus:border-ink"
                />
                {f.generate && (
                  <button
                    type="button"
                    onClick={() => setShown({ ...shown, [f.key]: randomToken() })}
                    className="shrink-0 rounded-lg border border-line px-3 text-xs hover:border-ink"
                  >
                    Сгенерировать
                  </button>
                )}
              </div>
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
