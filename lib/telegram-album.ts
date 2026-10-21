import "server-only";
import type { Draft } from "./jobs";
import { appLink } from "./links";
import type { NicheConfig } from "./niches";
import { credential } from "./store";

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Telegram counts the caption limit (1024) on visible text; an entity counts as one character.
const visible = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&(amp|lt|gt);/g, "_");

/** Title, intro, one "RUN IN APP" line per variant, footer and hashtags, shortened until it fits. */
export function albumCaption(n: NicheConfig, d: Draft): string {
  const tg = n.telegram;
  const utm = tg.utmCampaign || n.id;
  const build = (snippet: number) => {
    const lines = d.variants.map((v) => {
      const cut = snippet ? ` <i>${esc(v.prompt.slice(0, snippet))}…</i>` : "";
      return `<b>${esc(v.style)}</b> · ${esc(v.label)}${cut} <a href="${appLink(v.prompt, "telegram", utm)}">[ RUN ${esc(v.style)} IN APP ]</a>`;
    });
    const parts = [`<b>${esc(d.title)}</b>`];
    if (tg.intro) parts.push(esc(tg.intro));
    parts.push(lines.join("\n\n"));
    if (tg.footer) parts.push(esc(tg.footer));
    if (tg.hashtags) parts.push(esc(tg.hashtags));
    return parts.join("\n\n");
  };
  for (const snippet of [110, 70, 40, 0]) {
    const c = build(snippet);
    if (visible(c).length <= 1000) return c;
  }
  throw new Error("подпись не помещается в лимит Telegram 1024 символа даже без фрагментов промптов: сократите тексты ниши");
}

/** Posts the variants as one album (or a single photo) into the niche's group thread. Returns the post link. */
export async function postAlbum(n: NicheConfig, d: Draft): Promise<string> {
  const token = await credential("TELEGRAM_BOT_TOKEN");
  if (!token) throw new Error("в админке нет токена Telegram-бота");
  const tg = n.telegram;
  const caption = albumCaption(n, d);
  const common = { chat_id: tg.chatId, disable_notification: true, ...(tg.threadId ? { message_thread_id: tg.threadId } : {}) };
  const [method, body] =
    d.variants.length === 1
      ? ["sendPhoto", { ...common, photo: d.variants[0].imageUrl, caption, parse_mode: "HTML" }]
      : ["sendMediaGroup", { ...common, media: d.variants.map((v, i) => ({ type: "photo", media: v.imageUrl, ...(i === 0 ? { caption, parse_mode: "HTML" } : {}) })) }];

  const api = process.env.TELEGRAM_API_BASE || "https://api.telegram.org"; // overridable for local tests
  const res = await fetch(`${api}/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!json.ok) throw new Error(`Telegram: ${json.description ?? `HTTP ${res.status}`}`);
  const messageId = Array.isArray(json.result) ? json.result[0]?.message_id : json.result?.message_id;
  const user = tg.publicUsername;
  if (!user || !messageId) return "";
  return tg.threadId ? `https://t.me/${user}/${tg.threadId}/${messageId}` : `https://t.me/${user}/${messageId}`;
}
