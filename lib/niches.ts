import "server-only";
import { collection } from "./store";

/**
 * Everything the n8n "Niche post" workflow needs to generate and publish one niche.
 * The panel sends the whole object with every run, so the workflow itself stays generic.
 */
export interface NicheStyle {
  key: string;
  label: string;
  /** What makes this style different; goes into the prompt-writing request. */
  direction: string;
  /** Wraps the generated prompt for the image model; {prompt} is replaced. */
  suffix: string;
  steps: number;
}

export interface NicheConfig {
  id: string;
  name: string;
  enabled: boolean;
  /** Column in the n8n USED_IDs table that records which references were used. */
  dedupColumn: "clip_art" | "interior" | "fashion" | "product_mocups";
  /** JSON pool of reference pins from the reference-sorting tool. */
  datasetUrl: string;
  dailyLimit: number;
  analyze: { model: string; system: string; user: string; maxTokens: number; temperature: number };
  variants: { model: string; system: string; user: string; maxTokens: number; temperature: number };
  styles: NicheStyle[];
  image: { model: string; width: number; height: number; cfg: number; format: "WEBP" | "PNG" | "JPG"; lora: { model: string; weight: number }[] };
  telegram: { chatId: string; threadId: number; publicUsername: string; utmCampaign: string; intro: string; footer: string; hashtags: string };
  /** Admin-panel key holding this niche's Make webhook (Pinterest). */
  makeWebhookKey: string;
  /** pixPLace portal post: which direction account publishes it, plus tags and SEO keywords. */
  portal: { enabled: boolean; account: string; tags: string[]; seoKeywords: string[] };
  updatedAt?: string;
}

const CLIPART: NicheConfig = {
  id: "clipart",
  name: "Clipart",
  enabled: true,
  dedupColumn: "clip_art",
  datasetUrl: "https://dataset-editorial.vercel.app/api/dataset?id=44eb9c65-d89a-4e2d-9881-fbe361d5d587",
  dailyLimit: 3,
  analyze: {
    model: "meta-llama/llama-4-maverick",
    maxTokens: 1500,
    temperature: 0.7,
    system:
      "You are the art director of pixPLace, an AI image platform. You look at a reference image and design a new, original artwork inspired by its core idea. You never copy the reference. Return only JSON that matches the schema.",
    user:
      "Study the reference image as a concept for clipart, stickers, printable art, logos or poster art. Keep its core subject, mood and visual idea. Change the composition, details and any text, and remove brand names and logos, so the result is an original work. Write base_prompt as a ready text-to-image prompt of 80-200 words describing subject, composition, linework, palette and texture. Also write the title, seo_description and alt_text for the finished artwork. No watermarks and no real brand names.",
  },
  variants: {
    model: "openai/gpt-4.1-mini",
    maxTokens: 3000,
    temperature: 0.8,
    system:
      "You write text-to-image prompts for pixPLace. Return only JSON that matches the schema. Every prompt is one paragraph of 80-200 words in English, with no quotation marks and no markdown.",
    user:
      "Base idea:\n{prompt}\n\nWrite one prompt for each style below. Keep the same core subject, emotion and meaning. Make each style clearly different in technique, composition, camera angle and the scale of key elements. If a style puts text in the image, keep the text short, readable and spelled correctly.\n\nStyles:\n{styles}\n\nFor every style also write an SEO title under 80 characters, an SEO description of 1-3 sentences with keywords for clipart, stickers and printable art, and one sentence of alt text.",
  },
  styles: [
    { key: "A", label: "Marker, sticker", direction: "marker illustration, graphic, logo or sticker oriented, dynamic and expressive", suffix: "art poster with {prompt}, ultra detailed, hyper high quality, aggressive graffiti style, transparent background", steps: 18 },
    { key: "B", label: "Minimal character", direction: "minimalistic and graphic; turn one main object into an expressive original character with a strong silhouette, 2-4 colors, clean shapes", suffix: "{prompt}, ultra detailed, hyper high quality, transparent background", steps: 4 },
    { key: "C", label: "Art print", direction: "illustrative art print or wall art with rich textures, layered materials and detailed linework", suffix: "art poster with {prompt}, ultra detailed, hyper high quality, aggressive graffiti style, transparent background", steps: 12 },
    { key: "D", label: "Poster", direction: "premium hand-drawn poster or concept art, dynamic and highly detailed", suffix: "{prompt}, ultra detailed, hyper high quality", steps: 9 },
  ],
  image: { model: "runware:400@2", width: 896, height: 1152, cfg: 4, format: "WEBP", lora: [{ model: "watisha:164@164", weight: 1 }] },
  telegram: {
    chatId: "-1003815965313",
    threadId: 21,
    publicUsername: "pixplace_public",
    utmCampaign: "clip_art",
    intro: "4 prompt ideas. Load any of them into the app in one click.",
    footer: "",
    hashtags: "#AI_Art_Assets #clipartdesign #aistickers #printdesign #ailogo #pixPLace",
  },
  makeWebhookKey: "MAKE_WEBHOOK_CLIPART",
  portal: {
    enabled: true,
    account: "clipart",
    tags: ["clipart", "stickers", "printable", "ai-art", "logo"],
    seoKeywords: ["ai clipart", "sticker design", "printable art", "ai logo"],
  },
};

export const DEFAULT_NICHES: NicheConfig[] = [CLIPART];

const store = collection<NicheConfig>("niches");

/** Fills fields added after a niche was saved, so older records keep working. */
function withDefaults(n: NicheConfig): NicheConfig {
  const portal = DEFAULT_NICHES.find((d) => d.id === n.id)?.portal ?? { ...CLIPART.portal, enabled: false };
  return { ...n, portal: { ...portal, ...n.portal } };
}

export async function niches(): Promise<NicheConfig[]> {
  const saved = (await store.all()).map(withDefaults);
  const byId = new Map(saved.map((n) => [n.id, n]));
  for (const d of DEFAULT_NICHES) if (!byId.has(d.id)) byId.set(d.id, d);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function niche(id: string): Promise<NicheConfig | undefined> {
  const saved = await store.get(id);
  return saved ? withDefaults(saved) : DEFAULT_NICHES.find((n) => n.id === id);
}

export async function saveNiche(n: NicheConfig) {
  await store.put(n.id, { ...n, updatedAt: new Date().toISOString() });
}

export async function resetNiche(id: string) {
  await store.remove(id);
}
