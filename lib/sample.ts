import type { ChannelId, Format } from "./channels";

// Placeholder data so the interface has something to show before n8n is
// connected. Replace with real niches and the generated queue from n8n.
export const SAMPLE = true;

export interface Niche {
  id: string;
  name: string;
  tone: string;
  channels: ChannelId[];
}

export const NICHES: Niche[] = [
  { id: "interior", name: "Интерьер и дизайн", tone: "спокойный, визуальный", channels: ["pixplace", "pinterest", "instagram", "telegram-channel"] },
  { id: "fitness", name: "Фитнес", tone: "энергичный, на «ты»", channels: ["pixplace", "instagram", "tiktok", "youtube", "telegram-group"] },
  { id: "food", name: "Кулинария", tone: "тёплый, пошаговый", channels: ["pixplace", "pinterest", "tiktok", "youtube", "telegram-channel"] },
  { id: "it", name: "IT и обучение", tone: "экспертный, без воды", channels: ["pixplace", "linkedin", "youtube", "telegram-channel", "telegram-group"] },
  { id: "travel", name: "Путешествия", tone: "живой, с деталями мест", channels: ["pixplace", "pinterest", "instagram", "tiktok"] },
];

export interface Character {
  id: string;
  name: string;
  role: string;
  refs: number;
}

export const CHARACTERS: Character[] = [
  { id: "anna", name: "Анна", role: "ведущая, интерьер и путешествия", refs: 14 },
  { id: "max", name: "Макс", role: "тренер, фитнес", refs: 9 },
  { id: "none", name: "Без персонажа", role: "только предмет или сцена", refs: 0 },
];

export type PostState = "draft" | "review" | "scheduled" | "failed";

export interface Post {
  id: string;
  niche: string;
  format: Format;
  title: string;
  caption: string;
  character: string;
  channels: ChannelId[];
  state: PostState;
  when: string;
  hue: number;
}

export const QUEUE: Post[] = [
  { id: "p1", niche: "interior", format: "image", title: "Скандинавская кухня за выходные", caption: "Три приёма, которые делают маленькую кухню светлее: матовые фасады, открытая полка и тёплый свет под шкафами.", character: "anna", channels: ["pixplace", "pinterest", "instagram", "telegram-channel"], state: "review", when: "сегодня, 18:00", hue: 28 },
  { id: "p2", niche: "fitness", format: "video", title: "Утренняя зарядка на 7 минут", caption: "Без инвентаря и прыжков — можно делать в квартире, пока соседи спят.", character: "max", channels: ["pixplace", "tiktok", "youtube", "instagram"], state: "scheduled", when: "завтра, 08:30", hue: 152 },
  { id: "p3", niche: "it", format: "text", title: "Как выбрать первый язык программирования", caption: "Отвечаем на вопрос, который задают чаще всего: начинайте с задачи, а не с языка.", character: "none", channels: ["linkedin", "telegram-channel", "telegram-group"], state: "draft", when: "не запланировано", hue: 222 },
  { id: "p4", niche: "food", format: "video", title: "Шакшука за 15 минут", caption: "Одна сковорода, шесть ингредиентов и завтрак, который не стыдно подать гостям.", character: "none", channels: ["pixplace", "pinterest", "tiktok"], state: "failed", when: "вчера, 12:00", hue: 8 },
];
