import { ROUTES, type Route, type Format, FORMAT_LABEL } from "@/lib/channels";
import type { PostState } from "@/lib/sample";

export const ROUTE_COLOR: Record<Route, string> = {
  pixplace: "var(--color-r-pixplace)",
  telegram: "var(--color-r-telegram)",
  n8n: "var(--color-r-n8n)",
  buffer: "var(--color-r-buffer)",
};

/** A patch-board jack: filled when wired and live, ring when wired but not connected yet. */
export function Jack({ route, live, size = 14 }: { route: Route; live: boolean; size?: number }) {
  const c = ROUTE_COLOR[route];
  return (
    <span
      aria-hidden
      className="inline-block rounded-full"
      style={{
        width: size,
        height: size,
        background: live ? c : "transparent",
        boxShadow: `inset 0 0 0 2px ${c}`,
        opacity: live ? 1 : 0.85,
      }}
    />
  );
}

export function RouteLegend({ connected }: { connected: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
      {(Object.keys(ROUTES) as Route[]).map((r) => (
        <span key={r} className="flex items-center gap-2">
          <Jack route={r} live />
          <span className="text-ink">{ROUTES[r].label}</span>
          <span className="hidden sm:inline">· {ROUTES[r].note}</span>
        </span>
      ))}
      <span className="flex items-center gap-2">
        <Jack route="pixplace" live={false} />
        кольцо — маршрут задан, ключа ещё нет ({connected} из 8 подключено)
      </span>
    </div>
  );
}

const STATE: Record<PostState, { label: string; cls: string }> = {
  draft: { label: "Черновик", cls: "text-muted ring-line" },
  review: { label: "Ждёт проверки", cls: "text-warn ring-warn/40" },
  scheduled: { label: "Запланирован", cls: "text-ok ring-ok/40" },
  failed: { label: "Ошибка публикации", cls: "text-bad ring-bad/40" },
};

export function StateBadge({ state }: { state: PostState }) {
  const s = STATE[state];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${s.cls}`}>{s.label}</span>;
}

export function FormatTag({ format }: { format: Format }) {
  return <span className="font-mono text-[11px] uppercase tracking-wide text-muted">{FORMAT_LABEL[format]}</span>;
}

/** Stand-in for generated media until n8n returns real files. */
export function Thumb({ hue, format, className = "rounded-lg" }: { hue: number; format: Format; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 45% 78%), hsl(${(hue + 40) % 360} 40% 58%))`,
      }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />
      {format === "video" && (
        <span className="absolute inset-0 m-auto grid h-9 w-9 place-items-center rounded-full bg-black/60 text-ink text-xs backdrop-blur">▶</span>
      )}
      {format === "text" && (
        <span className="absolute inset-0 grid place-items-center font-display text-2xl text-ink/50">Aa</span>
      )}
    </div>
  );
}

export function SampleNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-3 py-2 text-xs text-muted">
      <span className="font-mono uppercase tracking-wide text-ink">пример данных</span> · {children}
    </p>
  );
}
