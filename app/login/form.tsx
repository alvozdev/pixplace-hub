"use client";
import { useActionState } from "react";
import { login } from "./actions";

export default function LoginForm({ next }: { next: string }) {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="password" className="block text-sm font-medium">Пароль</label>
      <input id="password" name="password" type="password" required autoFocus autoComplete="current-password"
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-ink" />
      {error && <p className="text-sm text-bad">{error}</p>}
      <button disabled={pending} className="w-full rounded-lg bg-ink px-4 py-2 text-sm font-medium text-surface disabled:opacity-50">
        {pending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}
