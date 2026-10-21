"use server";
import { revalidatePath } from "next/cache";
import { job, jobs, newJobId, saveJob, startedToday } from "@/lib/jobs";
import { callNichePost } from "@/lib/n8n";
import { niche } from "@/lib/niches";
import { credential } from "@/lib/store";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function generate(nicheId: string): Promise<ActionResult> {
  const n = await niche(nicheId);
  if (!n) return { ok: false, message: "Нет такой ниши" };
  if (!n.enabled) return { ok: false, message: `Ниша «${n.name}» выключена в настройках` };
  const today = startedToday(await jobs(), n.id);
  if (today >= n.dailyLimit) return { ok: false, message: `Лимит ниши на сегодня исчерпан: ${today} из ${n.dailyLimit}` };

  const now = new Date().toISOString();
  const id = newJobId();
  await saveJob({ id, nicheId: n.id, status: "generating", createdAt: now, updatedAt: now });
  try {
    await callNichePost("generate", { jobId: id, niche: n });
  } catch (e) {
    await saveJob({ id, nicheId: n.id, status: "failed", createdAt: now, updatedAt: now, error: (e as Error).message });
    revalidatePath("/drafts");
    return { ok: false, message: (e as Error).message };
  }
  revalidatePath("/drafts");
  return { ok: true, message: "Генерация запущена, обычно 1–3 минуты" };
}

export async function publish(jobId: string): Promise<ActionResult> {
  const j = await job(jobId);
  if (!j?.draft) return { ok: false, message: "Черновик не найден" };
  if (j.status !== "ready" && j.status !== "publish_failed") return { ok: false, message: "Этот черновик уже публикуется или опубликован" };
  const n = await niche(j.nicheId);
  if (!n) return { ok: false, message: "Ниша черновика удалена" };

  await saveJob({ ...j, status: "publishing", error: undefined });
  try {
    await callNichePost("publish", { jobId: j.id, niche: n, draft: j.draft, makeWebhookUrl: (await credential(n.makeWebhookKey)) ?? "" });
  } catch (e) {
    await saveJob({ ...j, status: "publish_failed", error: (e as Error).message });
    revalidatePath("/drafts");
    return { ok: false, message: (e as Error).message };
  }
  revalidatePath("/drafts");
  return { ok: true, message: "Публикация запущена" };
}

export async function reject(jobId: string): Promise<ActionResult> {
  const j = await job(jobId);
  if (!j) return { ok: false, message: "Черновик не найден" };
  if (j.status !== "ready" && j.status !== "publish_failed" && j.status !== "failed") return { ok: false, message: "Этот черновик нельзя отклонить" };
  await saveJob({ ...j, status: "rejected" });
  revalidatePath("/drafts");
  return { ok: true, message: "Черновик отклонён" };
}
