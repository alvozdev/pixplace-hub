"use server";
import { revalidatePath } from "next/cache";
import { job, jobs, newJobId, saveJob, startedToday, type Job } from "@/lib/jobs";
import { callNichePost, hubOrigin } from "@/lib/n8n";
import { niche, type NicheConfig } from "@/lib/niches";
import { publishToPortal } from "@/lib/pixplace";
import { postAlbum } from "@/lib/telegram-album";
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

  // The panel posts to the portal and Telegram itself, then hands the Telegram link and the
  // collage to n8n for Pinterest (Make) and the USED_IDs record. Finished steps are skipped on retry.
  let cur: Job = { ...j, status: "publishing", error: undefined };
  await saveJob(cur);
  cur = { ...cur, portal: await toPortal(n, cur) };
  if (cur.telegram?.status !== "published") {
    try {
      cur = { ...cur, telegram: { status: "published", url: await postAlbum(n, j.draft) } };
    } catch (e) {
      cur = { ...cur, telegram: { status: "failed", error: (e as Error).message } };
    }
  }
  if (cur.telegram?.status === "failed") return fail(cur, cur.telegram.error!);
  await saveJob(cur);

  const origin = await hubOrigin();
  try {
    await callNichePost("publish", {
      jobId: j.id,
      niche: n,
      draft: j.draft,
      telegramUrl: cur.telegram?.url ?? "",
      collageUrl: `${origin}/api/collage/${j.id}`,
      makeWebhookUrl: (await credential(n.makeWebhookKey)) ?? "",
    });
  } catch (e) {
    return fail(cur, `Pinterest: ${(e as Error).message}`);
  }
  revalidatePath("/drafts");
  const warning = cur.portal?.status === "failed" ? `, но портал: ${cur.portal.error}` : "";
  return { ok: !warning, message: `Опубликовано в Telegram${warning}. Pinterest отправляется через n8n.` };
}

async function fail(j: Job, message: string): Promise<ActionResult> {
  await saveJob({ ...j, status: "publish_failed", error: message });
  revalidatePath("/drafts");
  return { ok: false, message };
}

/** Publishes to the portal unless the niche has it off or this job is already there. */
async function toPortal(n: NicheConfig, j: Job): Promise<Job["portal"]> {
  if (!n.portal.enabled || !j.draft || j.portal?.status === "published") return j.portal;
  try {
    const r = await publishToPortal(n, j.draft, j.id);
    return { status: "published", url: r.url, mode: r.mode };
  } catch (e) {
    return { status: "failed", error: (e as Error).message };
  }
}

export async function retryPortal(jobId: string): Promise<ActionResult> {
  const j = await job(jobId);
  if (!j?.draft) return { ok: false, message: "Черновик не найден" };
  const n = await niche(j.nicheId);
  if (!n) return { ok: false, message: "Ниша черновика удалена" };
  const portal = await toPortal({ ...n, portal: { ...n.portal, enabled: true } }, j);
  // Re-read so a callback from n8n that arrived meanwhile is kept.
  await saveJob({ ...((await job(jobId)) ?? j), portal });
  revalidatePath("/drafts");
  return portal?.status === "published" ? { ok: true, message: "Опубликовано на портале" } : { ok: false, message: portal?.error ?? "Не получилось" };
}

export async function reject(jobId: string): Promise<ActionResult> {
  const j = await job(jobId);
  if (!j) return { ok: false, message: "Черновик не найден" };
  if (j.status !== "ready" && j.status !== "publish_failed" && j.status !== "failed") return { ok: false, message: "Этот черновик нельзя отклонить" };
  await saveJob({ ...j, status: "rejected" });
  revalidatePath("/drafts");
  return { ok: true, message: "Черновик отклонён" };
}
