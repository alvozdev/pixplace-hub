"use client";
import { useMemo, useState } from "react";
import { CHANNELS, FORMAT_LABEL, ROUTES, type ChannelId, type Format } from "@/lib/channels";
import type { ChannelStatus } from "@/lib/status";
import { NICHES, CHARACTERS } from "@/lib/sample";
import { Jack, Thumb, SampleNote } from "@/components/ui";
import Preview from "./preview";

interface Props {
  status: Record<ChannelId, ChannelStatus>;
  generator: ChannelStatus;
}

const FORMATS: Format[] = ["image", "video", "text"];

export default function Composer({ status, generator }: Props) {
  const [nicheId, setNicheId] = useState(NICHES[0].id);
  const niche = NICHES.find((n) => n.id === nicheId)!;
  const [format, setFormat] = useState<Format>(niche.formats[0]);
  const [character, setCharacter] = useState(CHARACTERS[0].id);
  const [brief, setBrief] = useState("Анна показывает, как собрать мудборд для ремонта за 5 минут");
  const [picked, setPicked] = useState<ChannelId[]>(niche.channels);
  const [previewOn, setPreviewOn] = useState<ChannelId>(niche.channels[0]);
  const [message, setMessage] = useState<string | null>(null);

  const usable = useMemo(() => CHANNELS.filter((c) => c.formats.includes(format)), [format]);
  const targets = picked.filter((id) => usable.some((c) => c.id === id));
  const notReady = targets.filter((id) => !status[id].ready);

  function chooseNiche(id: string) {
    const n = NICHES.find((x) => x.id === id)!;
    setNicheId(id);
    if (!n.formats.includes(format)) setFormat(n.formats[0]);
    setPicked(n.channels);
    setPreviewOn(n.channels[0]);
  }

  function toggle(id: ChannelId) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function publish() {
    setMessage(null);
    const res = await fetch("/api/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channels: targets, format, text: brief }),
    });
    const data = await res.json();
    setMessage(
      data.results
        .map((r: { channel: string; ok: boolean; error?: string }) => `${r.channel}: ${r.ok ? "опубликовано" : r.error}`)
        .join("\n"),
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Новый пост</h1>
          <p className="mt-1 text-sm text-muted">Опишите тему — воркфлоу ниши в n8n сгенерирует текст и медиа под каждую площадку.</p>
        </div>

        <Field label="Ниша">
          <div className="flex flex-wrap gap-2">
            {NICHES.map((n) => (
              <Chip key={n.id} on={n.id === nicheId} onClick={() => chooseNiche(n.id)}>
                {n.name}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">Тон: {niche.tone}</p>
        </Field>

        <Field label="Формат">
          <div className="inline-flex rounded-lg border border-line bg-surface p-1">
            {FORMATS.filter((f) => niche.formats.includes(f)).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                aria-pressed={format === f}
                className={`rounded-md px-4 py-1.5 text-sm ${format === f ? "bg-ink text-surface" : "text-muted hover:text-ink"}`}
              >
                {FORMAT_LABEL[f]}
              </button>
            ))}
          </div>
        </Field>

        {niche.characters && (
        <Field label="Персонаж" hint="Лицо и голос сохраняются от видео к видео">
          <div className="grid gap-2 sm:grid-cols-3">
            {CHARACTERS.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setCharacter(c.id)}
                aria-pressed={character === c.id}
                className={`flex items-center gap-3 rounded-lg border p-2 text-left ${
                  character === c.id ? "border-ink bg-surface" : "border-line bg-surface/50 hover:border-muted"
                }`}
              >
                <Thumb hue={[280, 152][i]} format="image" className="h-10 w-10 shrink-0 rounded-full" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{c.name}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {c.refs ? `${c.refs} референсов · ` : ""}
                    {c.role}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Field>
        )}

        <Field label="Тема">
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </Field>

        <Field label="Площадки" hint={`Для формата «${FORMAT_LABEL[format]}» доступно ${usable.length} из ${CHANNELS.length}`}>
          <div className="grid gap-2 sm:grid-cols-2">
            {CHANNELS.map((c) => {
              const fits = c.formats.includes(format);
              const on = picked.includes(c.id) && fits;
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                    fits ? "cursor-pointer border-line bg-surface hover:border-muted" : "border-transparent opacity-40"
                  }`}
                >
                  <input type="checkbox" checked={on} disabled={!fits} onChange={() => toggle(c.id)} className="accent-ink" />
                  <Jack route={c.route} live={status[c.id].ready} size={10} />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-[11px] text-muted">
                    {!fits ? "не принимает формат" : status[c.id].ready ? ROUTES[c.route].label : "нет ключа"}
                  </span>
                </label>
              );
            })}
          </div>
        </Field>

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <button
            disabled={!generator.ready}
            className="w-full sm:w-auto rounded-lg bg-ink px-4 py-2 text-sm font-medium text-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            Сгенерировать
          </button>
          <button
            onClick={publish}
            disabled={targets.length === 0}
            className="w-full sm:w-auto rounded-lg border border-ink px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            Опубликовать на {targets.length} площ.
          </button>
          {!generator.ready && (
            <span className="text-xs text-warn">Генерация выключена: добавьте {generator.missing.join(", ")}</span>
          )}
        </div>
        {notReady.length > 0 && (
          <p className="text-xs text-muted">
            Без ключей: {notReady.map((id) => CHANNELS.find((c) => c.id === id)!.name).join(", ")} — эти площадки вернут ошибку.
          </p>
        )}
        {message && <pre className="whitespace-pre-wrap rounded-lg bg-surface p-3 font-mono text-xs">{message}</pre>}
      </div>

      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <div className="flex gap-1 overflow-x-auto">
          {targets.map((id) => {
            const c = CHANNELS.find((x) => x.id === id)!;
            return (
              <button
                key={id}
                onClick={() => setPreviewOn(id)}
                aria-pressed={previewOn === id}
                className={`shrink-0 rounded-md px-2 py-1 font-mono text-[11px] ${previewOn === id ? "bg-ink text-surface" : "bg-surface text-muted"}`}
              >
                {c.short}
              </button>
            );
          })}
        </div>
        <Preview
          channel={targets.includes(previewOn) ? previewOn : targets[0]}
          format={format}
          text={brief}
          nicheName={niche.name}
        />
        <SampleNote>превью собрано из темы; настоящий текст и картинку вернёт n8n.</SampleNote>
      </aside>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-3 py-1 text-sm ${on ? "border-ink bg-ink text-surface" : "border-line bg-surface hover:border-muted"}`}
    >
      {children}
    </button>
  );
}
