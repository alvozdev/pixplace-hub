"use server";
import { revalidatePath } from "next/cache";
import { SERVICES, FIELD_KEYS } from "@/lib/credentials";
import { checkPortalKeys } from "@/lib/pixplace";
import { credential, deleteCredential, saveCredential } from "@/lib/store";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function saveService(serviceId: string, _: ActionResult | null, form: FormData): Promise<ActionResult> {
  const service = SERVICES.find((s) => s.id === serviceId);
  if (!service) return { ok: false, message: "Неизвестный сервис" };
  let saved = 0;
  try {
    for (const f of service.fields) {
      const v = String(form.get(f.key) ?? "").trim();
      if (v) {
        await saveCredential(f.key, v);
        saved++;
      }
    }
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  revalidatePath("/", "layout");
  return saved ? { ok: true, message: `Сохранено полей: ${saved}` } : { ok: false, message: "Заполните хотя бы одно поле" };
}

export async function removeField(key: string): Promise<void> {
  if (!FIELD_KEYS.has(key)) return;
  await deleteCredential(key);
  revalidatePath("/", "layout");
}

async function getJson(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(10_000) });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

export async function testService(serviceId: string): Promise<ActionResult> {
  try {
    if (serviceId === "telegram") {
      const token = await credential("TELEGRAM_BOT_TOKEN");
      if (!token) return { ok: false, message: "Сначала сохраните токен бота" };
      const base = `https://api.telegram.org/bot${token}`;
      const me = await getJson(`${base}/getMe`);
      if (!me.body.ok) return { ok: false, message: `Telegram не принял токен: ${me.body.description ?? me.res.status}` };
      const notes = [`бот @${me.body.result.username}`];
      for (const [key, label] of [["TELEGRAM_CHANNEL_ID", "канал"], ["TELEGRAM_GROUP_ID", "группа"]] as const) {
        const id = await credential(key);
        if (!id) continue;
        const chat = await getJson(`${base}/getChatMember?chat_id=${encodeURIComponent(id)}&user_id=${me.body.result.id}`);
        const role = chat.body.result?.status;
        notes.push(chat.body.ok ? `${label}: ${role === "administrator" ? "бот — админ" : `бот не админ (${role})`}` : `${label}: ${chat.body.description}`);
      }
      return { ok: true, message: notes.join(" · ") };
    }
    if (serviceId === "pixplace") {
      const notes = await checkPortalKeys();
      if (!notes.length) return { ok: false, message: "Сначала сохраните хотя бы один ключ" };
      return { ok: notes.every((n) => n.endsWith(": ок")), message: notes.join(" · ") };
    }
    return { ok: false, message: "Для этого сервиса проверка пока недоступна" };
  } catch (e) {
    return { ok: false, message: `Сервер панели не достучался до сервиса (${(e as Error).message}). Проверьте адрес и доступ в интернет.` };
  }
}
