"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { SESSION_COOKIE, createSession } from "@/lib/session";

export async function login(_: string | null, form: FormData): Promise<string | null> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !process.env.HUB_SECRET) return "Панель ещё не настроена: не заданы ADMIN_PASSWORD и HUB_SECRET.";
  const given = Buffer.from(String(form.get("password") ?? ""));
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return "Неверный пароль.";
  const s = await createSession();
  (await cookies()).set(SESSION_COOKIE, s.value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: s.maxAge, path: "/" });
  const next = String(form.get("next") || "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
