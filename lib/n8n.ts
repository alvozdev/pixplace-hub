import "server-only";
import { headers } from "next/headers";
import { credential } from "./store";

export const DEFAULT_WEBHOOK_BASE = "https://alv-n8n.pixplace.space/webhook";

/** Calls the "pixPLace Hub · Niche post" workflow; n8n answers right away and reports back later. */
export async function callNichePost(action: "generate" | "publish", body: Record<string, unknown>) {
  const base = (await credential("N8N_WEBHOOK_BASE")) || DEFAULT_WEBHOOK_BASE;
  const token = await credential("HUB_N8N_TOKEN");
  if (!token) throw new Error("В админке не задан токен панели для n8n");
  const res = await fetch(`${base.replace(/\/$/, "")}/pixplace-hub/${action}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-hub-token": token },
    body: JSON.stringify({ ...body, callbackUrl: `${await hubOrigin()}/api/n8n/callback` }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const text = (await res.text()).slice(0, 200);
    if (res.status === 404) throw new Error("n8n не нашёл вебхук: проверьте, что воркфлоу «pixPLace Hub · Niche post» включён");
    if (res.status === 401 || res.status === 403) throw new Error("n8n отклонил токен панели: проверьте учётку «pixPLace Hub token» в n8n");
    throw new Error(`n8n ответил ${res.status}: ${text}`);
  }
}

/** Public address of this panel, taken from the current request. */
export async function hubOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
