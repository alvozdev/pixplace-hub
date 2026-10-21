"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { NicheConfig } from "@/lib/niches";
import { PORTAL_ACCOUNTS } from "@/lib/portal-accounts";
import { resetNicheAction, saveNicheAction, type SaveResult } from "../actions";

const input = "w-full rounded-lg border border-line bg-bg/40 px-3 py-2 text-sm outline-none focus:border-ink";
const mono = `${input} font-mono text-xs`;

export default function NicheEditor({ initial }: { initial: NicheConfig }) {
  const [n, setN] = useState(initial);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<SaveResult | null>(null);

  const set = <K extends keyof NicheConfig>(k: K, v: NicheConfig[K]) => setN({ ...n, [k]: v });
  const setPart = <K extends "analyze" | "variants" | "image" | "telegram" | "portal">(k: K, v: Partial<NicheConfig[K]>) => setN({ ...n, [k]: { ...n[k], ...v } });
  const setStyle = (i: number, v: Partial<NicheConfig["styles"][number]>) => setN({ ...n, styles: n.styles.map((s, j) => (j === i ? { ...s, ...v } : s)) });
  const addStyle = () => {
    const key = "ABCDEFG".split("").find((k) => !n.styles.some((s) => s.key.toUpperCase() === k)) ?? "X";
    const last = n.styles[n.styles.length - 1];
    setN({ ...n, styles: [...n.styles, { ...last, key, label: "", direction: "" }] });
  };
  const removeStyle = (i: number) => setN({ ...n, styles: n.styles.filter((_, j) => j !== i) });
  const lora = n.image.lora[0] ?? { model: "", weight: 1 };
  const list = (v: string) => v.split(",").map((t) => t.trim()).filter(Boolean);
  const account = PORTAL_ACCOUNTS.find((a) => a.id === n.portal.account);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/niches" className="text-xs text-muted hover:text-ink">← Ниши</Link>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{n.name}</h1>
          <p className="mt-1 text-sm text-muted">Колонка учёта в n8n: <span className="font-mono">{n.dedupColumn}</span> · ключ Make в админке: <span className="font-mono">{n.makeWebhookKey}</span></p>
        </div>
      </div>

      <Section title="Основное">
        <Grid>
          <Field label="Название"><input id="name" className={input} value={n.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Лимит постов в день"><input id="dailyLimit" type="number" className={input} value={n.dailyLimit} onChange={(e) => set("dailyLimit", Number(e.target.value))} /></Field>
          <Field label="Бюджет в день, $ (0 — без лимита)"><input id="dailyBudget" type="number" step="0.1" className={input} value={n.dailyBudgetUsd} onChange={(e) => set("dailyBudgetUsd", Number(e.target.value))} /></Field>
          <Field label="Формат поста">
            <select id="format" className={input} value={n.format} onChange={(e) => set("format", e.target.value as NicheConfig["format"])}>
              <option value="album">Все стили в одном посте (альбом)</option>
              <option value="rotate">Один стиль на пост по очереди (рубрики)</option>
            </select>
          </Field>
        </Grid>
        <Field label="Пул референсов (JSON из интерфейса сортировки)"><input id="datasetUrl" className={mono} value={n.datasetUrl} onChange={(e) => set("datasetUrl", e.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm">
          <input id="enabled" type="checkbox" checked={n.enabled} onChange={(e) => set("enabled", e.target.checked)} className="accent-ink" />
          Ниша включена
        </label>
      </Section>

      <Section title="1. Анализ референса" hint="Модель смотрит на пин и пишет базовый промпт для новой, не скопированной работы">
        <Grid>
          <Field label="Модель (OpenRouter)"><input id="analyzeModel" className={mono} value={n.analyze.model} onChange={(e) => setPart("analyze", { model: e.target.value })} /></Field>
          <Grid>
            <Field label="Токены"><input id="analyzeTokens" type="number" className={input} value={n.analyze.maxTokens} onChange={(e) => setPart("analyze", { maxTokens: Number(e.target.value) })} /></Field>
            <Field label="Температура"><input id="analyzeTemp" type="number" step="0.1" className={input} value={n.analyze.temperature} onChange={(e) => setPart("analyze", { temperature: Number(e.target.value) })} /></Field>
          </Grid>
        </Grid>
        <Field label="Системный промпт"><textarea id="analyzeSystem" rows={3} className={input} value={n.analyze.system} onChange={(e) => setPart("analyze", { system: e.target.value })} /></Field>
        <Field label="Задание"><textarea id="analyzeUser" rows={6} className={input} value={n.analyze.user} onChange={(e) => setPart("analyze", { user: e.target.value })} /></Field>
      </Section>

      <Section title={`2. Стили: ${n.styles.length} из 7`} hint="Сколько стилей, столько картинок в посте. {prompt} — базовый промпт из шага 1, {styles} — список стилей ниже">
        <Grid>
          <Field label="Модель (OpenRouter)"><input id="variantsModel" className={mono} value={n.variants.model} onChange={(e) => setPart("variants", { model: e.target.value })} /></Field>
          <Grid>
            <Field label="Токены"><input id="variantsTokens" type="number" className={input} value={n.variants.maxTokens} onChange={(e) => setPart("variants", { maxTokens: Number(e.target.value) })} /></Field>
            <Field label="Температура"><input id="variantsTemp" type="number" step="0.1" className={input} value={n.variants.temperature} onChange={(e) => setPart("variants", { temperature: Number(e.target.value) })} /></Field>
          </Grid>
        </Grid>
        <Field label="Системный промпт"><textarea id="variantsSystem" rows={3} className={input} value={n.variants.system} onChange={(e) => setPart("variants", { system: e.target.value })} /></Field>
        <Field label="Задание"><textarea id="variantsUser" rows={7} className={input} value={n.variants.user} onChange={(e) => setPart("variants", { user: e.target.value })} /></Field>
        <div className="space-y-3">
          {n.styles.map((s, i) => (
            <div key={i} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-[3rem_1fr_6rem]">
              <Field label="Буква"><input id={`style${i}Key`} className={mono} value={s.key} onChange={(e) => setStyle(i, { key: e.target.value })} /></Field>
              <Field label="Название в посте"><input id={`style${i}Label`} className={input} value={s.label} onChange={(e) => setStyle(i, { label: e.target.value })} /></Field>
              <Field label="Шаги"><input id={`style${i}Steps`} type="number" className={input} value={s.steps} onChange={(e) => setStyle(i, { steps: Number(e.target.value) })} /></Field>
              <div className="sm:col-span-3"><Field label="Чем отличается стиль"><textarea id={`style${i}Direction`} rows={2} className={input} value={s.direction} onChange={(e) => setStyle(i, { direction: e.target.value })} /></Field></div>
              <div className="sm:col-span-3"><Field label="Обёртка для модели картинки ({prompt})"><input id={`style${i}Suffix`} className={mono} value={s.suffix} onChange={(e) => setStyle(i, { suffix: e.target.value })} /></Field></div>
              {n.styles.length > 1 && (
                <div className="text-right sm:col-span-3">
                  <button type="button" onClick={() => removeStyle(i)} className="text-xs text-bad hover:underline">
                    Удалить стиль {s.key}
                  </button>
                </div>
              )}
            </div>
          ))}
          {n.styles.length < 7 && (
            <button type="button" onClick={addStyle} className="w-full rounded-lg border border-dashed border-line px-3 py-2 text-sm text-muted hover:border-ink hover:text-ink">
              + Добавить стиль
            </button>
          )}
        </div>
      </Section>

      <Section title="3. Картинка (Runware)">
        <Grid>
          <Field label="Модель"><input id="imageModel" className={mono} value={n.image.model} onChange={(e) => setPart("image", { model: e.target.value })} /></Field>
          <Grid>
            <Field label="Ширина"><input id="imageWidth" type="number" className={input} value={n.image.width} onChange={(e) => setPart("image", { width: Number(e.target.value) })} /></Field>
            <Field label="Высота"><input id="imageHeight" type="number" className={input} value={n.image.height} onChange={(e) => setPart("image", { height: Number(e.target.value) })} /></Field>
          </Grid>
          <Grid>
            <Field label="CFG"><input id="imageCfg" type="number" step="0.5" className={input} value={n.image.cfg} onChange={(e) => setPart("image", { cfg: Number(e.target.value) })} /></Field>
            <Field label="Формат">
              <select id="imageFormat" className={input} value={n.image.format} onChange={(e) => setPart("image", { format: e.target.value as NicheConfig["image"]["format"] })}>
                <option>WEBP</option><option>PNG</option><option>JPG</option>
              </select>
            </Field>
          </Grid>
          <Grid>
            <Field label="LoRA (пусто — без неё)"><input id="loraModel" className={mono} value={lora.model} onChange={(e) => setPart("image", { lora: e.target.value ? [{ ...lora, model: e.target.value }] : [] })} /></Field>
            <Field label="Вес LoRA"><input id="loraWeight" type="number" step="0.1" className={input} value={lora.weight} onChange={(e) => setPart("image", { lora: lora.model ? [{ ...lora, weight: Number(e.target.value) }] : [] })} /></Field>
          </Grid>
        </Grid>
      </Section>

      <Section title="4. Telegram" hint="Альбом из 4 картинок, подпись укладывается в лимит 1024 символа автоматически">
        <Grid>
          <Field label="ID чата"><input id="tgChat" className={mono} value={n.telegram.chatId} onChange={(e) => setPart("telegram", { chatId: e.target.value })} /></Field>
          <Field label="ID треда"><input id="tgThread" type="number" className={input} value={n.telegram.threadId} onChange={(e) => setPart("telegram", { threadId: Number(e.target.value) })} /></Field>
          <Field label="Публичное имя группы"><input id="tgUser" className={mono} value={n.telegram.publicUsername} onChange={(e) => setPart("telegram", { publicUsername: e.target.value })} /></Field>
          <Field label="UTM campaign"><input id="tgUtm" className={mono} value={n.telegram.utmCampaign} onChange={(e) => setPart("telegram", { utmCampaign: e.target.value })} /></Field>
        </Grid>
        <Field label="Текст после заголовка"><textarea id="tgIntro" rows={2} className={input} value={n.telegram.intro} onChange={(e) => setPart("telegram", { intro: e.target.value })} /></Field>
        <Field label="Текст перед хэштегами"><textarea id="tgFooter" rows={2} className={input} value={n.telegram.footer} onChange={(e) => setPart("telegram", { footer: e.target.value })} /></Field>
        <Field label="Хэштеги"><input id="tgTags" className={input} value={n.telegram.hashtags} onChange={(e) => setPart("telegram", { hashtags: e.target.value })} /></Field>
      </Section>

      <Section title="5. Портал pixPLace" hint="Одна карусель из 4 картинок с аккаунта направления, кнопки «Run in app» ведут в приложение с промптом">
        <label className="flex items-center gap-2 text-sm">
          <input id="portalEnabled" type="checkbox" checked={n.portal.enabled} onChange={(e) => setPart("portal", { enabled: e.target.checked })} className="accent-ink" />
          Публиковать на портал
        </label>
        <Grid>
          <Field label="Аккаунт направления">
            <select id="portalAccount" className={input} value={n.portal.account} onChange={(e) => setPart("portal", { account: e.target.value })}>
              {PORTAL_ACCOUNTS.map((a) => (
                <option key={a.id} value={a.id}>{a.name} · @{a.username}</option>
              ))}
            </select>
          </Field>
          <Field label="Категория на портале">
            <input className={`${input} text-muted`} value={account?.category ?? "нет, только теги"} readOnly />
          </Field>
        </Grid>
        <Field label="Теги через запятую (до 10)"><input id="portalTags" className={input} defaultValue={n.portal.tags.join(", ")} onBlur={(e) => setPart("portal", { tags: list(e.target.value) })} /></Field>
        <Field label="SEO-ключи через запятую (до 20)"><input id="portalSeo" className={input} defaultValue={n.portal.seoKeywords.join(", ")} onBlur={(e) => setPart("portal", { seoKeywords: list(e.target.value) })} /></Field>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <button disabled={pending} onClick={() => start(async () => setResult(await saveNicheAction(n)))} className="w-full rounded-lg bg-ink px-4 py-2 text-sm font-medium text-surface disabled:opacity-40 sm:w-auto">
          {pending ? "Сохраняем…" : "Сохранить"}
        </button>
        <button
          disabled={pending}
          onClick={() => start(async () => { setResult(await resetNicheAction(n.id)); window.location.reload(); })}
          className="w-full rounded-lg border border-line px-4 py-2 text-sm hover:border-ink disabled:opacity-40 sm:w-auto"
        >
          Сбросить к исходным
        </button>
        {result && <span className={`text-sm ${result.ok ? "text-ok" : "text-bad"}`}>{result.message}</span>}
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <div>
        <h2 className="font-medium">{title}</h2>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}
