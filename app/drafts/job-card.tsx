"use client";
import { useState, useTransition } from "react";
import type { Job, JobStatus } from "@/lib/jobs";
import { publish, reject, type ActionResult } from "./actions";

const STATUS: Record<JobStatus, { label: string; cls: string }> = {
  generating: { label: "Генерируется", cls: "text-warn ring-warn/40" },
  ready: { label: "Ждёт проверки", cls: "text-ink ring-ink/30" },
  failed: { label: "Ошибка генерации", cls: "text-bad ring-bad/40" },
  rejected: { label: "Отклонён", cls: "text-muted ring-line" },
  publishing: { label: "Публикуется", cls: "text-warn ring-warn/40" },
  published: { label: "Опубликован", cls: "text-ok ring-ok/40" },
  publish_failed: { label: "Ошибка публикации", cls: "text-bad ring-bad/40" },
};

const PINTEREST = { sent: "отправлен в Make", failed: "Make вернул ошибку", skipped: "пропущен: нет вебхука Make" };

const time = (iso: string) => new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function JobCard({ job, nicheName }: { job: Job; nicheName: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const s = STATUS[job.status];
  const d = job.draft;
  const canPublish = job.status === "ready" || job.status === "publish_failed";
  const canReject = canPublish || job.status === "failed";

  return (
    <li className="space-y-4 rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${s.cls}`}>{s.label}</span>
        <span>{nicheName}</span>
        <span>· {time(job.createdAt)}</span>
        {d && <span>· ${d.cost.total.toFixed(3)}</span>}
        {d && <span>· осталось идей: {d.ideasLeft} из {d.ideasTotal}</span>}
      </div>

      {(job.status === "generating" || job.status === "publishing") && (
        <p className="text-sm text-muted">
          {job.status === "generating" ? "n8n анализирует референс и рисует 4 варианта…" : "n8n публикует альбом и отправляет в Make…"} Страница обновится сама.
        </p>
      )}
      {job.error && <p className="rounded-lg bg-bad/5 px-3 py-2 text-sm text-bad">{job.error}</p>}

      {d && (
        <>
          <div className="flex flex-wrap items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.sourceImageUrl} alt="Референс" className="h-24 w-20 shrink-0 rounded-lg object-cover ring-1 ring-line" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="text-[11px] uppercase tracking-wide text-muted">Референс → новый пост</div>
              <h3 className="font-medium leading-snug">{d.title}</h3>
              <p className="text-sm text-muted">{d.seoDescription}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {d.variants.map((v) => (
              <figure key={v.style} className="space-y-2">
                <a href={v.imageUrl} target="_blank" rel="noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.imageUrl} alt={v.altText} className="aspect-[7/9] w-full rounded-lg bg-bg object-cover ring-1 ring-line" />
                </a>
                <figcaption className="space-y-1 text-xs">
                  <div>
                    <b className="font-mono">{v.style}</b> · {v.label}
                  </div>
                  <button onClick={() => setOpen(open === v.style ? null : v.style)} className="text-muted underline-offset-2 hover:underline">
                    {open === v.style ? "Скрыть промпт" : "Показать промпт"}
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
          {open && (
            <pre className="whitespace-pre-wrap rounded-lg bg-bg p-3 font-mono text-xs leading-relaxed">
              {d.variants.find((v) => v.style === open)?.prompt}
            </pre>
          )}
        </>
      )}

      {job.status === "published" && job.result && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {job.result.telegramUrl && (
            <a href={job.result.telegramUrl} target="_blank" rel="noreferrer" className="text-ok underline-offset-2 hover:underline">
              Пост в Telegram
            </a>
          )}
          <span className="text-muted">Pinterest: {PINTEREST[job.result.pinterest ?? "skipped"]}</span>
        </div>
      )}

      {(canPublish || canReject) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          {canPublish && (
            <button
              disabled={pending}
              onClick={() => start(async () => setResult(await publish(job.id)))}
              className="w-full rounded-lg bg-ink px-4 py-2 text-sm font-medium text-surface disabled:opacity-40 sm:w-auto"
            >
              {job.status === "publish_failed" ? "Опубликовать ещё раз" : "Опубликовать"}
            </button>
          )}
          {canReject && (
            <button
              disabled={pending}
              onClick={() => start(async () => setResult(await reject(job.id)))}
              className="w-full rounded-lg border border-line px-4 py-2 text-sm hover:border-ink disabled:opacity-40 sm:w-auto"
            >
              Отклонить
            </button>
          )}
          {result && <span className={`text-xs ${result.ok ? "text-ok" : "text-bad"}`}>{result.message}</span>}
        </div>
      )}
    </li>
  );
}
