import "server-only";
import { collection } from "./store";

export type JobStatus = "generating" | "ready" | "failed" | "rejected" | "publishing" | "published" | "publish_failed";

export interface DraftVariant {
  style: string;
  label: string;
  prompt: string;
  negative: string;
  seoTitle: string;
  seoDescription: string;
  altText: string;
  imageUrl: string;
  cost: number;
  seed: number | null;
}

export interface Draft {
  nicheId: string;
  pinId: string;
  sourceImageUrl: string;
  usedRowId: number;
  title: string;
  seoDescription: string;
  altText: string;
  basePrompt: string;
  variants: DraftVariant[];
  width: number;
  height: number;
  cost: { images: number; llm: number; total: number };
  ideasLeft: number;
  ideasTotal: number;
}

export interface Job {
  id: string;
  nicheId: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  draft?: Draft;
  error?: string;
  result?: { telegramUrl?: string; collageUrl?: string; pinterest?: "sent" | "failed" | "skipped" };
  /** Album in the niche's group thread, posted by the panel; its link goes to Pinterest via Make. */
  telegram?: { status: "published" | "failed"; url?: string; error?: string };
  /** pixPLace portal post, published by the panel itself before n8n takes Pinterest. */
  portal?: { status: "published" | "failed"; url?: string; mode?: "carousel" | "single"; error?: string };
}

const store = collection<Job>("jobs");

export async function jobs(): Promise<Job[]> {
  return (await store.all()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const job = (id: string) => store.get(id);

export async function saveJob(j: Job) {
  await store.put(j.id, { ...j, updatedAt: new Date().toISOString() });
}

export function newJobId() {
  return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Jobs started today (UTC) for a niche, to enforce its daily limit. */
export function startedToday(all: Job[], nicheId: string) {
  const day = new Date().toISOString().slice(0, 10);
  return all.filter((j) => j.nicheId === nicheId && j.createdAt.startsWith(day) && j.status !== "failed").length;
}
