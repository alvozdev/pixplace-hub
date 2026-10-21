"use server";
import { revalidatePath } from "next/cache";
import { niche, resetNiche, saveNiche, type NicheConfig } from "@/lib/niches";
import { portalAccount } from "@/lib/portal-accounts";

export interface SaveResult {
  ok: boolean;
  message: string;
}

const text = (v: unknown) => typeof v === "string" && v.trim().length > 0;
const num = (v: unknown, min: number, max: number) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;

function problems(n: NicheConfig): string[] {
  const p: string[] = [];
  if (!text(n.name)) p.push("название");
  if (n.enabled && !/^https:\/\//.test(n.datasetUrl)) p.push("ссылка на пул референсов (https://…), без неё нишу не включить");
  if (!num(n.dailyBudgetUsd, 0, 1000)) p.push("дневной бюджет $0–1000");
  if (n.format !== "album" && n.format !== "rotate") p.push("формат поста");
  if (!num(n.dailyLimit, 0, 200)) p.push("лимит в день (0–200)");
  for (const [k, part] of [["анализ", n.analyze], ["варианты", n.variants]] as const) {
    if (!text(part.model) || !text(part.system) || !text(part.user)) p.push(`${k}: модель и оба промпта`);
    if (!num(part.maxTokens, 200, 16000)) p.push(`${k}: лимит токенов 200–16000`);
    if (!num(part.temperature, 0, 2)) p.push(`${k}: температура 0–2`);
  }
  if (!n.variants.user.includes("{prompt}") || !n.variants.user.includes("{styles}")) p.push("промпт вариантов должен содержать {prompt} и {styles}");
  if (n.styles.length < 1 || n.styles.length > 7) p.push("от 1 до 7 стилей");
  if (new Set(n.styles.map((s) => s.key.trim().toUpperCase())).size !== n.styles.length) p.push("буквы стилей не должны повторяться");
  n.styles.forEach((s, i) => {
    if (!text(s.key) || !text(s.label) || !text(s.direction)) p.push(`стиль ${i + 1}: буква, название и направление`);
    if (!s.suffix.includes("{prompt}")) p.push(`стиль ${i + 1}: обёртка должна содержать {prompt}`);
    if (!num(s.steps, 1, 100)) p.push(`стиль ${i + 1}: шаги 1–100`);
  });
  if (!text(n.image.model) || !num(n.image.width, 256, 2048) || !num(n.image.height, 256, 2048)) p.push("картинка: модель и размер 256–2048");
  if (!text(n.telegram.chatId) || !num(n.telegram.threadId, 0, 1e9)) p.push("Telegram: id чата и треда");
  if (n.portal.enabled && !portalAccount(n.portal.account)) p.push("портал: выберите аккаунт направления");
  if (n.portal.tags.length > 10) p.push("портал: не больше 10 тегов");
  if (n.portal.seoKeywords.length > 20) p.push("портал: не больше 20 SEO-ключей");
  return p;
}

export async function saveNicheAction(n: NicheConfig): Promise<SaveResult> {
  const current = await niche(n.id);
  if (!current) return { ok: false, message: "Нет такой ниши" };
  const bad = problems(n);
  if (bad.length) return { ok: false, message: `Проверьте: ${bad.join("; ")}` };
  await saveNiche({ ...n, id: current.id, dedupColumn: current.dedupColumn, makeWebhookKey: current.makeWebhookKey });
  revalidatePath("/niches");
  return { ok: true, message: "Сохранено. Следующая генерация пойдёт с этими настройками." };
}

export async function resetNicheAction(id: string): Promise<SaveResult> {
  await resetNiche(id);
  revalidatePath("/niches");
  return { ok: true, message: "Настройки сброшены к исходным" };
}
