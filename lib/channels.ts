export type Format = "image" | "video" | "text";

/** How a post physically leaves the hub. */
export type Route = "telegram" | "make" | "buffer" | "pixplace";

export type ChannelId =
  | "pixplace"
  | "telegram-channel"
  | "telegram-group"
  | "pinterest"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin";

export interface Channel {
  id: ChannelId;
  name: string;
  short: string;
  route: Route;
  formats: Format[];
  /** Env vars that must be set before this channel can publish. */
  env: string[];
}

export const CHANNELS: Channel[] = [
  { id: "pixplace", name: "Портал Pix Place", short: "PX", route: "pixplace", formats: ["image", "video", "text"], env: ["PIXPLACE_API_URL", "PIXPLACE_API_KEY"] },
  { id: "telegram-channel", name: "Telegram · канал", short: "TG·К", route: "telegram", formats: ["image", "video", "text"], env: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHANNEL_ID"] },
  { id: "telegram-group", name: "Telegram · группа", short: "TG·Г", route: "telegram", formats: ["image", "video", "text"], env: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_GROUP_ID"] },
  { id: "pinterest", name: "Pinterest", short: "PI", route: "make", formats: ["image", "video"], env: ["MAKE_WEBHOOK_PINTEREST"] },
  { id: "instagram", name: "Instagram", short: "IG", route: "buffer", formats: ["image", "video"], env: ["BUFFER_ACCESS_TOKEN", "BUFFER_PROFILE_INSTAGRAM"] },
  { id: "tiktok", name: "TikTok", short: "TT", route: "buffer", formats: ["video", "image"], env: ["BUFFER_ACCESS_TOKEN", "BUFFER_PROFILE_TIKTOK"] },
  { id: "youtube", name: "YouTube Shorts", short: "YT", route: "buffer", formats: ["video"], env: ["BUFFER_ACCESS_TOKEN", "BUFFER_PROFILE_YOUTUBE"] },
  { id: "linkedin", name: "LinkedIn", short: "IN", route: "buffer", formats: ["text", "image", "video"], env: ["BUFFER_ACCESS_TOKEN", "BUFFER_PROFILE_LINKEDIN"] },
];

export const ROUTES: Record<Route, { label: string; note: string }> = {
  pixplace: { label: "Напрямую", note: "API портала" },
  telegram: { label: "Telegram Bot API", note: "бот — админ канала и группы" },
  make: { label: "Make", note: "аккаунт подключён в Make" },
  buffer: { label: "Buffer", note: "профили в Buffer" },
};

export const FORMAT_LABEL: Record<Format, string> = {
  image: "Картинка",
  video: "Видео",
  text: "Текст",
};

/** Generation engine, separate from publishing routes. */
export const GENERATOR_ENV = ["N8N_API_URL", "N8N_API_KEY", "N8N_WEBHOOK_GENERATE"];

export function channel(id: ChannelId): Channel {
  const c = CHANNELS.find((c) => c.id === id);
  if (!c) throw new Error(`Unknown channel ${id}`);
  return c;
}
