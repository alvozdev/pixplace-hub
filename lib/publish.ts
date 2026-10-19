import "server-only";
import { channel, type ChannelId, type Format } from "./channels";
import { hubStatus } from "./status";
import { credential } from "./store";

export interface PublishInput {
  channels: ChannelId[];
  format: Format;
  text: string;
  mediaUrl?: string;
}

export interface PublishResult {
  channel: ChannelId;
  ok: boolean;
  error?: string;
}

async function env(k: string): Promise<string> {
  const v = await credential(k);
  if (!v) throw new Error(`не задан ${k}`);
  return v;
}

async function postJson(url: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

async function toTelegram(chatId: string, input: PublishInput) {
  const base = `https://api.telegram.org/bot${await env("TELEGRAM_BOT_TOKEN")}`;
  if (input.format === "text" || !input.mediaUrl) {
    return postJson(`${base}/sendMessage`, { chat_id: chatId, text: input.text });
  }
  const method = input.format === "video" ? "sendVideo" : "sendPhoto";
  const field = input.format === "video" ? "video" : "photo";
  return postJson(`${base}/${method}`, { chat_id: chatId, [field]: input.mediaUrl, caption: input.text });
}

async function publishOne(id: ChannelId, input: PublishInput) {
  const c = channel(id);
  switch (c.route) {
    case "telegram":
      return toTelegram(await env(id === "telegram-group" ? "TELEGRAM_GROUP_ID" : "TELEGRAM_CHANNEL_ID"), input);
    case "make":
      // The Make scenario owns the Pinterest connection; we only hand it the post.
      return postJson(await env("MAKE_WEBHOOK_PINTEREST"), { channel: id, ...input });
    case "pixplace":
      return postJson(`${await env("PIXPLACE_API_URL")}/posts`, input, { authorization: `Bearer ${await env("PIXPLACE_API_KEY")}` });
    case "buffer":
      throw new Error("Buffer пока не подключён в коде: нужен токен и id профиля");
  }
}

export async function publish(input: PublishInput): Promise<PublishResult[]> {
  const status = (await hubStatus()).channels;
  return Promise.all(
    input.channels.map(async (id) => {
      if (!status[id].ready) return { channel: id, ok: false, error: `нет ключей: ${status[id].missing.join(", ")}` };
      try {
        await publishOne(id, input);
        return { channel: id, ok: true };
      } catch (e) {
        return { channel: id, ok: false, error: (e as Error).message };
      }
    }),
  );
}
