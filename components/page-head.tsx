import { Reveal } from "./fx";

/** Page title with the shining gradient, a small mono kicker and a muted lead. */
export function PageHead({ title, kicker, children, action }: { title: string; kicker?: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Reveal className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {kicker && <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-violet/90">{kicker}</div>}
        <h1 className="text-gradient font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {children && <p className="mt-2 text-sm leading-relaxed text-muted">{children}</p>}
      </div>
      {action}
    </Reveal>
  );
}
