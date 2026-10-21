/**
 * A niche can have several Make webhooks (separate Make accounts, to stay within each one's
 * monthly operations). The month is split into equal runs of days, one webhook per run,
 * the way the old workflows switched hooks by day of month.
 */
export function pickMakeHook(value: string | undefined, now = new Date()): string {
  const hooks = (value ?? "").split(/[\s,]+/).filter((h) => h.startsWith("https://"));
  if (hooks.length <= 1) return hooks[0] ?? "";
  const days = Math.ceil(31 / hooks.length);
  return hooks[Math.min(hooks.length - 1, Math.floor((now.getUTCDate() - 1) / days))];
}
