import Link from "next/link";
import { niches } from "@/lib/niches";
import { credential } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Niches() {
  const list = await niches();
  const make = await Promise.all(list.map((n) => credential(n.makeWebhookKey).catch(() => undefined)));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Ниши</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Один воркфлоу в n8n на все ниши. Здесь задаётся, что он делает для каждой: пул референсов, промпты, стили, модель и куда публиковать.
        </p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {list.map((n, i) => (
          <li key={n.id} className="space-y-3 rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${n.enabled ? "bg-ok" : "bg-line"}`} />
              <h2 className="font-medium">{n.name}</h2>
              <span className="ml-auto font-mono text-[11px] text-muted">{n.updatedAt ? "изменено" : "исходные настройки"}</span>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-muted">{n.format === "rotate" ? "Рубрики" : "Стили"}</dt>
              <dd>
                {n.styles.map((s) => `${s.key} · ${s.label}`).join(", ")}
                <span className="text-muted">{n.format === "rotate" ? " — по одной на пост" : ` — ${n.styles.length} в посте`}</span>
              </dd>
              <dt className="text-muted">Картинка</dt>
              <dd className="font-mono">{n.image.model} · {n.image.width}×{n.image.height}</dd>
              <dt className="text-muted">Telegram</dt>
              <dd>тред {n.telegram.threadId}</dd>
              <dt className="text-muted">Pinterest</dt>
              <dd>{make[i] ? "вебхук Make из админки" : "вебхуки Make из старых воркфлоу n8n"}</dd>
              <dt className="text-muted">Лимит</dt>
              <dd>{n.dailyLimit} в день{n.dailyBudgetUsd > 0 ? ` · до $${n.dailyBudgetUsd}` : ""}</dd>
            </dl>
            <Link href={`/niches/${n.id}`} className="inline-block rounded-lg border border-line px-3 py-1.5 text-sm hover:border-ink">
              Настроить
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
