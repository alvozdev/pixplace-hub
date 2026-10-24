"use client";
import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Burst, Notice, NumberTicker } from "@/components/fx";
import type { Job, JobStatus } from "@/lib/jobs";
import { publish, reject, retryPortal, type ActionResult } from "./actions";

const STATUS: Record<JobStatus, { label: string; color: string; pulse?: boolean }> = {
  generating: { label: "Генерируется", color: "#38bdf8", pulse: true },
  ready: { label: "Ждёт проверки", color: "#a78bfa" },
  failed: { label: "Ошибка генерации", color: "#fb7185" },
  rejected: { label: "Отклонён", color: "rgb(235 235 245 / 0.5)" },
  publishing: { label: "Публикуется", color: "#fbbf24", pulse: true },
  published: { label: "Опубликован", color: "#34d399" },
  publish_failed: { label: "Ошибка публикации", color: "#fb7185" },
};

const PINTEREST = { sent: "отправлен в Make", failed: "Make вернул ошибку", skipped: "пропущен: нет вебхука Make" };

const time = (iso: string) => new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function StatusPill({ status }: { status: JobStatus }) {
  const s = STATUS[status];
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium backdrop-blur" style={{ color: s.color }}>
      <span className="relative flex h-2 w-2">
        {s.pulse && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: s.color }} />}
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: s.color, boxShadow: `0 0 10px ${s.color}` }} />
      </span>
      {s.label}
    </span>
  );
}

/** `demo` replaces the server actions, so the demo page can play the flow without n8n. */
export default function JobCard({ job, nicheName, demo }: { job: Job; nicheName: string; demo?: { publish: () => void; reject: () => void } }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const d = job.draft;
  const working = job.status === "generating" || job.status === "publishing";
  const canPublish = job.status === "ready" || job.status === "publish_failed";
  const canReject = canPublish || job.status === "failed";

  return (
    <div className={`glass-card space-y-4 p-4 sm:p-5 ${working ? "beam" : ""}`}>
      <Burst fire={job.status === "published"} />
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <StatusPill status={job.status} />
        <span className="text-ink/80">{nicheName}</span>
        <span>· {time(job.createdAt)}</span>
        {d && (
          <span>
            · <NumberTicker value={d.cost.total} decimals={3} prefix="$" />
          </span>
        )}
        {d && <span>· осталось идей: {d.ideasLeft} из {d.ideasTotal}</span>}
      </div>

      {job.status === "generating" && (
        <div className="space-y-3">
          <p className="text-sm text-muted">n8n анализирует референс и рисует варианты… Страница обновится сама.</p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton aspect-[7/9] rounded-2xl" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}
      {job.status === "publishing" && <p className="text-sm text-muted">Публикуем на портал и в Telegram, n8n отправляет в Make… Страница обновится сама.</p>}
      {job.error && <p className="rounded-2xl border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{job.error}</p>}

      {d && (
        <>
          <div className="flex flex-wrap items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.sourceImageUrl} alt="Референс" className="h-24 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-white/15" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet">Референс → новый пост</div>
              <h3 className="font-display text-base font-semibold leading-snug">{d.title}</h3>
              <p className="text-sm text-muted">{d.seoDescription}</p>
            </div>
          </div>

          <div className={`grid gap-3 ${d.variants.length === 1 ? "max-w-xs grid-cols-1" : "grid-cols-2 lg:grid-cols-4"}`}>
            {d.variants.map((v, i) => (
              <motion.figure
                key={v.style}
                className="group space-y-2"
                initial={{ opacity: 0, y: 16, scale: 0.94, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <a href={v.imageUrl} target="_blank" rel="noreferrer" className="relative block overflow-hidden rounded-2xl ring-1 ring-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.imageUrl} alt={v.altText} className="aspect-[7/9] w-full bg-white/5 object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/45 font-mono text-xs font-bold backdrop-blur-md ring-1 ring-white/20">
                    {v.style}
                  </span>
                </a>
                <figcaption className="space-y-1 text-xs">
                  <div className="text-ink/90">{v.label}</div>
                  <button onClick={() => setOpen(open === v.style ? null : v.style)} className="text-muted underline-offset-2 transition-colors hover:text-violet hover:underline">
                    {open === v.style ? "Скрыть промпт" : "Показать промпт"}
                  </button>
                </figcaption>
              </motion.figure>
            ))}
          </div>
          <AnimatePresence>
            {open && (
              <motion.pre
                key={open}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-3 font-mono text-xs leading-relaxed text-ink/85"
              >
                {d.variants.find((v) => v.style === open)?.prompt}
              </motion.pre>
            )}
          </AnimatePresence>
        </>
      )}

      {job.portal && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {job.portal.status === "published" ? (
            <a href={job.portal.url} target="_blank" rel="noreferrer" className="text-ok underline-offset-2 hover:underline">
              ✦ Пост на портале{job.portal.mode === "single" ? " (одна картинка: карусель портал ещё не принимает)" : ""}
            </a>
          ) : (
            <>
              <span className="text-bad">Портал: {job.portal.error}</span>
              <button disabled={pending} onClick={() => start(async () => setResult(await retryPortal(job.id)))} className="btn-glass px-3 py-1 text-xs">
                Повторить на портал
              </button>
            </>
          )}
        </div>
      )}

      {(job.telegram?.url || (job.status === "published" && job.result)) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {job.telegram?.url && (
            <a href={job.telegram.url} target="_blank" rel="noreferrer" className="text-ok underline-offset-2 hover:underline">
              ✦ Пост в Telegram
            </a>
          )}
          {job.status === "published" && job.result && <span className="text-muted">Pinterest: {PINTEREST[job.result.pinterest ?? "skipped"]}</span>}
        </div>
      )}

      {(canPublish || canReject) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-4">
          {canPublish && (
            <button disabled={pending} onClick={() => (demo ? demo.publish() : start(async () => setResult(await publish(job.id))))} className="btn-primary w-full px-5 py-2.5 text-sm sm:w-auto">
              {job.status === "publish_failed" ? "Опубликовать ещё раз" : "Опубликовать"}
            </button>
          )}
          {canReject && (
            <button disabled={pending} onClick={() => (demo ? demo.reject() : start(async () => setResult(await reject(job.id))))} className="btn-glass w-full px-5 py-2.5 text-sm sm:w-auto">
              Отклонить
            </button>
          )}
        </div>
      )}
      <Notice result={result} />
    </div>
  );
}
