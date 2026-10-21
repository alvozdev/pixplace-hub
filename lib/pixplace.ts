import "server-only";
import type { Draft } from "./jobs";
import type { NicheConfig } from "./niches";
import { PORTAL_ACCOUNTS, portalAccount } from "./portal-accounts";
import { credential } from "./store";

const DEFAULT_BASE = "https://pixplace.space";

export interface PortalResult {
  url: string;
  id?: string;
  /** "carousel" once the portal accepts attachments[]; "single" on the current one-file API. */
  mode: "carousel" | "single";
}

class PortalError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call(path: string, key: string, body?: unknown, headers: Record<string, string> = {}) {
  const base = ((await credential("PIXPLACE_API_URL")) || DEFAULT_BASE).replace(/\/$/, "");
  const res = await fetch(`${base}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new PortalError(res.status, explain(res.status, json, res.headers.get("retry-after")));
  return json;
}

function explain(status: number, json: { error?: string; message?: string }, retryAfter: string | null) {
  const text = json.error || json.message || "";
  if (status === 401) return "портал не принял ключ аккаунта: проверьте его в админке";
  if (status === 429) return `лимит портала исчерпан${retryAfter ? `, повтор через ${Math.ceil(Number(retryAfter) / 60)} мин` : " (50 постов в сутки на аккаунт)"}`;
  if (status === 400) return `портал отклонил пост: ${text || "неверные данные"}`;
  return `портал ответил ${status}${text ? `: ${text}` : ""}`;
}

const appLink = (prompt: string, utm: string) =>
  `https://app.pixplace.space/?prompt=${encodeURIComponent(prompt)}&utm_source=pixplace&utm_campaign=${encodeURIComponent(utm)}`;

/**
 * Publishes a draft as one portal post from the niche's account. Uses the carousel API
 * (attachments[], deeplinks, files re-hosted via uploads/from-url) and falls back to the
 * current one-file API while the portal has not shipped it yet.
 */
export async function publishToPortal(n: NicheConfig, d: Draft, jobId: string): Promise<PortalResult> {
  const account = portalAccount(n.portal.account);
  if (!account) throw new Error(`в нише не выбран аккаунт портала`);
  const key = await credential(account.keyName);
  if (!key) throw new Error(`в админке нет ключа ${account.keyName} (аккаунт ${account.username})`);

  const title = d.title.trim().slice(0, 200);
  const description = d.seoDescription.slice(0, 2000);
  const categories = account.category ? [account.category] : [];
  const tags = n.portal.tags.slice(0, 10);

  let uploaded: string[] | null = [];
  try {
    for (const v of d.variants) {
      const r = await call("/api/v1/uploads/from-url", key, { url: v.imageUrl });
      uploaded.push(r.publicUrl ?? r.data?.publicUrl);
    }
  } catch (e) {
    if (!(e instanceof PortalError && (e.status === 404 || e.status === 405))) throw e;
    uploaded = null;
  }

  if (uploaded) {
    const r = await call(
      "/api/v1/posts",
      key,
      {
        title,
        description,
        prompt: d.basePrompt.slice(0, 2000),
        attachments: d.variants.map((v, i) => ({
          url: uploaded[i],
          type: "IMAGE",
          width: d.width,
          height: d.height,
          altText: v.altText.slice(0, 500),
          prompt: v.prompt.slice(0, 2000),
        })),
        deeplinks: d.variants.slice(0, 5).map((v) => ({ url: appLink(v.prompt, n.telegram.utmCampaign || n.id), label: `Run ${v.style} in app`, iconType: "prompt" })),
        seoKeywords: n.portal.seoKeywords.slice(0, 20),
        categories,
        tags,
      },
      // The key only allows A-Za-z0-9._:- so one job always maps to one post, even on retries.
      { "idempotency-key": `hub-${jobId}`.replace(/[^A-Za-z0-9._:-]/g, "-") },
    );
    return { url: r.data?.url, id: r.data?.id, mode: "carousel" };
  }

  // Current API: one file per post and no idempotency key, so only the first variant goes up.
  const r = await call("/api/v1/posts", key, {
    title,
    attachment: { url: d.variants[0].imageUrl, type: "IMAGE" },
    description,
    prompt: d.variants[0].prompt.slice(0, 2000),
    categories,
    tags,
  });
  return { url: r.post?.url, id: r.post?.id, mode: "single" };
}

/** Read-only key check: lists the account's latest post. */
export async function checkPortalKeys(): Promise<string[]> {
  const notes: string[] = [];
  for (const a of PORTAL_ACCOUNTS) {
    const key = await credential(a.keyName);
    if (!key) continue;
    try {
      await call("/api/v1/posts?page=1&limit=1", key);
      notes.push(`${a.name}: ок`);
    } catch (e) {
      notes.push(`${a.name}: ${(e as Error).message}`);
    }
  }
  return notes;
}
