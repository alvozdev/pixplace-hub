import type { ChannelId, Format } from "./channels";

// Placeholder data so the interface has something to show before n8n is
// connected. Replace with real niches and the generated queue from n8n.
export const SAMPLE = true;

export interface Niche {
  id: string;
  name: string;
  tone: string;
  formats: Format[];
  channels: ChannelId[];
  /** Talking-character videos: the post is presented by an AI character. */
  characters?: boolean;
}

export const NICHES: Niche[] = [
  { id: "ai-characters", name: "AI-персонажи", tone: "персонаж рассказывает и показывает", formats: ["video"], channels: ["pixplace", "tiktok", "youtube", "instagram", "telegram-channel"], characters: true },
  { id: "interior", name: "Интерьер и дизайн", tone: "спокойный, визуальный", formats: ["image", "video"], channels: ["pixplace", "pinterest", "instagram", "telegram-channel"] },
  { id: "fitness", name: "Фитнес", tone: "энергичный, на «ты»", formats: ["image", "video"], channels: ["pixplace", "instagram", "tiktok", "youtube", "telegram-group"] },
  { id: "food", name: "Кулинария", tone: "тёплый, пошаговый", formats: ["image", "video", "text"], channels: ["pixplace", "pinterest", "tiktok", "telegram-channel"] },
  { id: "it", name: "IT и обучение", tone: "экспертный, без воды", formats: ["text", "image", "video"], channels: ["pixplace", "linkedin", "youtube", "telegram-channel", "telegram-group"] },
];

export interface Character {
  id: string;
  name: string;
  role: string;
  refs: number;
}

export const CHARACTERS: Character[] = [
  { id: "anna", name: "Анна", role: "ведущая", refs: 14 },
  { id: "max", name: "Макс", role: "эксперт-практик", refs: 9 },
];

export type PostState = "draft" | "review" | "scheduled" | "failed";

export interface Post {
  id: string;
  niche: string;
  format: Format;
  title: string;
  caption: string;
  character?: string;
  channels: ChannelId[];
  state: PostState;
  when: string;
  hue: number;
}

export const QUEUE: Post[] = [
  { id: "p1", niche: "ai-characters", format: "video", title: "Анна показывает, как собрать мудборд за 5 минут", caption: "Персонаж в кадре объясняет и показывает на экране три шага.", character: "anna", channels: ["pixplace", "tiktok", "youtube", "instagram"], state: "review", when: "сегодня, 18:00", hue: 280 },
  { id: "p2", niche: "interior", format: "image", title: "Скандинавская кухня за выходные", caption: "Три приёма, которые делают маленькую кухню светлее.", channels: ["pixplace", "pinterest", "instagram", "telegram-channel"], state: "scheduled", when: "завтра, 10:00", hue: 28 },
  { id: "p3", niche: "it", format: "text", title: "Как выбрать первый язык программирования", caption: "Начинайте с задачи, а не с языка.", channels: ["linkedin", "telegram-channel", "telegram-group"], state: "draft", when: "не запланировано", hue: 222 },
  { id: "p4", niche: "food", format: "video", title: "Шакшука за 15 минут", caption: "Одна сковорода и шесть ингредиентов.", channels: ["pixplace", "pinterest", "tiktok"], state: "failed", when: "вчера, 12:00", hue: 8 },
];
