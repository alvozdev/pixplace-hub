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
  /** Stop generating for the day once drafts cost this much in USD; 0 means no cap. */
  dailyBudgetUsd: number;
  /** "album": every style in one post. "rotate": one style per post, taking turns, like rubrics. */
  format: "album" | "rotate";
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
  dailyBudgetUsd: 0,
  format: "album",
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

// The niches below come from the old single-image n8n workflows. Models, image settings, threads
// and datasets are kept as they were; the prompts are rewritten to ask for 120-250 words, because
// the image models only read about 3000 characters and the old 1000-2500 token prompts were cut off.
const GROUP = { chatId: "-1003815965313", publicUsername: "pixplace_public", footer: "" };
const PROMPT_RULES =
  "You write text-to-image prompts for pixPLace. Return only JSON that matches the schema. Every prompt is one paragraph of 120-250 words in English, with no quotation marks and no markdown.";

const INTERIOR: NicheConfig = {
  id: "interior",
  name: "Interior",
  enabled: true,
  dedupColumn: "interior",
  datasetUrl: "https://dataset-editorial.vercel.app/api/dataset?id=22809d54-49c4-4c2d-930d-5a130cc09525",
  dailyLimit: 5,
  dailyBudgetUsd: 0,
  format: "album",
  analyze: {
    model: "meta-llama/llama-4-maverick",
    maxTokens: 2000,
    temperature: 0.8,
    system:
      "You are the art director of pixPLace, an AI image platform, and an interior and architecture visualizer. You design a new, original space inspired by the reference. You never copy it. Return only JSON that matches the schema.",
    user:
      "Study the reference image as an interior or architecture concept. Keep its core idea: type of space, design style, mood, palette and key materials. Make it original: change the layout, furniture arrangement, camera angle and decor, and remove any brand names, logos or text. Write base_prompt as a ready text-to-image prompt of 120-220 words for a photorealistic render: space and purpose, architectural style, layout and camera angle, furniture and key objects, materials and textures, lighting and time of day, color palette, atmosphere. Then write title (under 80 characters), seo_description (1-3 sentences with keywords for interior design ideas) and alt_text (one sentence).",
  },
  variants: {
    model: "openai/gpt-4o-mini-2024-07-18",
    maxTokens: 2500,
    temperature: 0.8,
    system: PROMPT_RULES,
    user:
      "Base idea:\n{prompt}\n\nWrite the final prompt for each style below as a high-end, photorealistic interior visualization: precise materials, realistic light and shadows, believable proportions and one clear focal point. Keep the core idea and make it feel premium and original.\n\nStyles:\n{styles}\n\nFor every style also write an SEO title under 80 characters, an SEO description of 1-3 sentences with keywords for interior design ideas and architecture inspiration, and one sentence of alt text.",
  },
  styles: [
    { key: "A", label: "Interior render", direction: "luxury photorealistic interior visualization in the style of architectural photography", suffix: "{prompt}. futuristic interior and architecture, ultra detailed, high-end textures", steps: 20 },
  ],
  image: { model: "runware:z-image@turbo", width: 896, height: 1152, cfg: 0, format: "WEBP", lora: [] },
  telegram: {
    ...GROUP,
    threadId: 998,
    utmCampaign: "interior_post",
    intro: "🏘️ Use Case: perfect for interior moodboards, architectural concepts, exterior visualization, landscape design and spatial staging.",
    hashtags: "#luxurydesign #interiorinspo #aispace #architecturaldesign #Architecture_Interior_design_Ideas #ai_design #AIarchitecture #pixPLace",
  },
  makeWebhookKey: "MAKE_WEBHOOK_INTERIOR",
  portal: {
    enabled: true,
    account: "interior",
    tags: ["interior", "interior-design", "architecture", "home-decor", "ai-render"],
    seoKeywords: ["ai interior design", "interior design ideas", "luxury interior", "architecture visualization"],
  },
};

const FASHION: NicheConfig = {
  id: "fashion",
  name: "Fashion",
  enabled: true,
  dedupColumn: "fashion",
  datasetUrl: "https://raw.githubusercontent.com/iremojoferod28-prog/data-set/main/pinterest-dataset-summer-fashion-236-set.json",
  dailyLimit: 5,
  dailyBudgetUsd: 0,
  format: "rotate",
  analyze: {
    model: "meta-llama/llama-4-maverick",
    maxTokens: 2000,
    temperature: 0.8,
    system:
      "You are the art director of pixPLace, an AI image platform, and a fashion editor. You design a new, original look inspired by the reference. You never copy it. Return only JSON that matches the schema.",
    user:
      "Study the reference image as a fashion trend concept for an editorial shoot or campaign. Keep its core idea: silhouette, styling direction, palette, fabrics and mood. Make it original: change the outfit details, pose, setting and accessories, and remove any brand names, logos or text. Write base_prompt as a ready text-to-image prompt of 120-220 words: model and pose, garments and silhouette, fabrics and textures, styling and accessories, setting, lighting, camera framing and mood. Then write title (under 80 characters), seo_description (1-3 sentences with keywords for fashion design ideas) and alt_text (one sentence).",
  },
  variants: {
    model: "openai/gpt-4.1-mini",
    maxTokens: 3000,
    temperature: 0.8,
    system: PROMPT_RULES,
    user:
      "Base idea:\n{prompt}\n\nWrite the final prompt for each style below. Each style is a separate rubric of the pixPLace fashion feed, so follow its direction closely: model and pose, outfit and silhouette, fabrics and textures, styling, setting, lighting and camera framing. Never use real magazine names or fashion brands; any text in the image must be short and spelled exactly as given.\n\nStyles:\n{styles}\n\nFor every style also write an SEO title under 80 characters, an SEO description of 1-3 sentences with keywords for fashion design ideas and AI styling, and one sentence of alt text.",
  },
  styles: [
    {
      key: "A",
      label: "pixPLace cover",
      direction:
        "premium fashion magazine cover. Today is {weekday}; the masthead is pixPLace plus today's theme: Monday POWER DRESSING, Tuesday STYLE EDIT, Wednesday L'ATELIER, Thursday STREET, Friday REFASHION, Saturday WEEKEND, Sunday COUTURE. Two or three short cover lines, clean editorial layout",
      suffix: "{prompt}. Premium Magazine Poster, Main Page of Top Fashion Magazine",
      steps: 18,
    },
    { key: "B", label: "Street editorial", direction: "candid street-style editorial photo, natural city light, full-body look in motion, no text", suffix: "{prompt}. street style fashion editorial, ultra detailed, high-end textures", steps: 18 },
    { key: "C", label: "Lookbook", direction: "clean studio lookbook shot, full body, neutral seamless background, focus on garment construction and fabrics, no text", suffix: "{prompt}. fashion lookbook, studio light, ultra detailed fabrics", steps: 18 },
  ],
  image: { model: "runware:400@2", width: 832, height: 1280, cfg: 4, format: "WEBP", lora: [{ model: "watisha:164@164", weight: 1 }] },
  telegram: {
    ...GROUP,
    threadId: 1016,
    utmCampaign: "fashion_post",
    intro: "👗 Use Case: perfect for fashion moodboards, editorial concepts, lookbooks and campaign ideas.",
    hashtags: "#Fashion_Design_Ideas #ai_fashion #digitalfashion #AIstyling #fashioninspo #pixPLace",
  },
  makeWebhookKey: "MAKE_WEBHOOK_FASHION",
  portal: {
    enabled: true,
    account: "fashion",
    tags: ["fashion", "editorial", "magazine-cover", "styling", "ai-fashion"],
    seoKeywords: ["ai fashion", "fashion design ideas", "fashion editorial", "magazine cover"],
  },
};

const PRODUCTS: NicheConfig = {
  id: "products",
  name: "Product mockups",
  enabled: true,
  dedupColumn: "product_mocups",
  datasetUrl: "https://raw.githubusercontent.com/iremojoferod28-prog/data-set/main/pinterest-dataset-product-mockup.json",
  dailyLimit: 5,
  dailyBudgetUsd: 0,
  format: "album",
  analyze: {
    model: "meta-llama/llama-4-maverick",
    maxTokens: 2000,
    temperature: 0.8,
    system:
      "You are the art director of pixPLace, an AI image platform, and a product photographer. You design a new, original product shot inspired by the reference. You never copy it. Return only JSON that matches the schema.",
    user:
      "Study the reference image as a product mockup concept for branding and e-commerce. Keep its core idea: product type, packaging form, materials, composition and mood. Make it original: change the props, background, camera angle and label design, and replace any real brand, logo or text with a clean blank or neutral label. Write base_prompt as a ready text-to-image prompt of 120-220 words: product and packaging, materials and finishes, label area, props and surface, background, lighting setup, camera angle and lens, mood. Then write title (under 80 characters), seo_description (1-3 sentences with keywords for product mockups and branding) and alt_text (one sentence).",
  },
  variants: {
    model: "openai/gpt-4.1-mini",
    maxTokens: 2500,
    temperature: 0.8,
    system: PROMPT_RULES,
    user:
      "Base idea:\n{prompt}\n\nWrite the final prompt for each style below as premium product mockup photography: realistic materials and reflections, controlled studio light, sharp focus on the product, a clean label area without real brands or logos.\n\nStyles:\n{styles}\n\nFor every style also write an SEO title under 80 characters, an SEO description of 1-3 sentences with keywords for product mockups, branding assets and e-commerce visuals, and one sentence of alt text.",
  },
  styles: [
    { key: "A", label: "Product mockup", direction: "premium e-commerce and branding product shot", suffix: "{prompt}, premium product mockup, studio lighting, ultra detailed, high-end textures", steps: 11 },
  ],
  image: { model: "runware:z-image@turbo", width: 1536, height: 2048, cfg: 0, format: "WEBP", lora: [] },
  telegram: {
    ...GROUP,
    threadId: 987,
    utmCampaign: "product_post",
    intro: "🧩 Use Case: perfect for branding presentations, e-commerce previews, portfolio shots, marketplaces and ad creatives.",
    hashtags: "#productmockup #brandingassets #ecommercevisuals #mockupdesign #aidesign #pixplace",
  },
  makeWebhookKey: "MAKE_WEBHOOK_PRODUCTS",
  portal: {
    enabled: true,
    account: "products",
    tags: ["mockup", "product", "packaging", "branding", "ecommerce"],
    seoKeywords: ["product mockup", "packaging mockup", "branding assets", "ecommerce visuals"],
  },
};

// New: references for artists and AI users — character sheets, poses and expressions.
// Off until it has its own reference pool and Telegram thread. Image settings follow the old
// "Characters & Ai Avatars" workflow, which had turned into a copy of product mockups.
const CHARACTERS: NicheConfig = {
  id: "characters",
  name: "Characters & poses",
  enabled: false,
  // USED_IDs has no column of its own for this niche yet; pin ids are unique across Pinterest, so sharing one is safe.
  dedupColumn: "clip_art",
  datasetUrl: "",
  dailyLimit: 5,
  dailyBudgetUsd: 0,
  format: "album",
  analyze: {
    model: "meta-llama/llama-4-maverick",
    maxTokens: 2000,
    temperature: 0.8,
    system:
      "You are the art director of pixPLace, an AI image platform, and a character designer. You design a new, original character inspired by the reference. You never copy it, and you never reproduce existing franchise characters or real people. Return only JSON that matches the schema.",
    user:
      "Study the reference image as a character concept. Keep its core idea: archetype, era or genre, body type, outfit logic, palette and attitude. Make it original: change the face, hairstyle, outfit details and accessories, and remove any logos or text. Write base_prompt as a ready text-to-image prompt of 120-220 words describing one consistent character: age range, build, face and hair, outfit layers and materials, accessories, palette, personality and art style. Then write title (under 80 characters), seo_description (1-3 sentences with keywords for character design references and pose references) and alt_text (one sentence).",
  },
  variants: {
    model: "openai/gpt-4.1-mini",
    maxTokens: 3000,
    temperature: 0.8,
    system: PROMPT_RULES,
    user:
      "Base character:\n{prompt}\n\nWrite one prompt for each style below. The character must stay the same in every prompt: same face, hair, outfit and palette, so the images work as one reference set. Use a plain light background and even lighting so shapes and anatomy read clearly. No text except short view labels where a style asks for them.\n\nStyles:\n{styles}\n\nFor every style also write an SEO title under 80 characters, an SEO description of 1-3 sentences with keywords for character design, pose reference and drawing reference, and one sentence of alt text.",
  },
  styles: [
    { key: "A", label: "Character sheet", direction: "character turnaround sheet: front, three-quarter, side and back views in a row, full body, neutral pose", suffix: "{prompt}. character reference sheet, turnaround, ultra detailed, clean background", steps: 18 },
    { key: "B", label: "Pose reference", direction: "one dynamic full-body action pose with clear anatomy and readable silhouette, slight perspective", suffix: "{prompt}. dynamic pose reference, full body, ultra detailed, clean background", steps: 18 },
    { key: "C", label: "Expressions", direction: "expression sheet: six head shots in a grid with different emotions (joy, anger, surprise, sadness, determination, calm)", suffix: "{prompt}. facial expression sheet, ultra detailed, clean background", steps: 18 },
  ],
  image: { model: "runware:400@2", width: 832, height: 1280, cfg: 4, format: "WEBP", lora: [{ model: "watisha:164@164", weight: 1 }] },
  telegram: {
    ...GROUP,
    threadId: 0,
    utmCampaign: "characters_post",
    intro: "🧍 Character references: turnaround, poses and expressions. Load any prompt into the app in one click.",
    hashtags: "#characterdesign #posereference #characterreference #conceptart #aiart #pixPLace",
  },
  makeWebhookKey: "MAKE_WEBHOOK_CHARACTERS",
  portal: {
    enabled: true,
    account: "characters",
    tags: ["character-design", "pose-reference", "character-sheet", "concept-art", "expressions"],
    seoKeywords: ["character reference sheet", "pose reference", "character design", "expression sheet"],
  },
};

export const DEFAULT_NICHES: NicheConfig[] = [CLIPART, INTERIOR, FASHION, PRODUCTS, CHARACTERS];

const store = collection<NicheConfig>("niches");

/** Fills fields added after a niche was saved, so older records keep working. */
function withDefaults(n: NicheConfig): NicheConfig {
  const portal = DEFAULT_NICHES.find((d) => d.id === n.id)?.portal ?? { ...CLIPART.portal, enabled: false };
  return { ...n, dailyBudgetUsd: n.dailyBudgetUsd ?? 0, format: n.format ?? "album", portal: { ...portal, ...n.portal } };
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
