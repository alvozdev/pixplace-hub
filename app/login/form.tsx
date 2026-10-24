"use client";
import { useActionState } from "react";
import { login } from "./actions";

export default function LoginForm({ next }: { next: string }) {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="password" className="block text-xs text-muted">Пароль</label>
      <input id="password" name="password" type="password" required autoFocus autoComplete="current-password"
        className="field" />
      {error && <p className="rounded-2xl border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      <button disabled={pending} className="btn-primary w-full px-4 py-2.5 text-sm">
        {pending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}
