import Link from "next/link";
import { GlowAvatar, Reveal, TiltCard } from "@/components/fx";
import { PageHead } from "@/components/page-head";
import { niches } from "@/lib/niches";
import { credential } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Niches() {
  const list = await niches();
  const make = await Promise.all(list.map((n) => credential(n.makeWebhookKey).catch(() => undefined)));

  return (
    <div className="space-y-8">
      <PageHead title="Ниши" kicker="один воркфлоу · много направлений">
        Один воркфлоу в n8n на все ниши. Здесь задаётся, что он делает для каждой: пул референсов, промпты, стили, модель и куда публиковать.
      </PageHead>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((n, i) => (
          <Reveal key={n.id} i={i}>
          <TiltCard className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <GlowAvatar label={n.name.split(/[\s&]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()} size={48} live={n.enabled} />
              <div className="min-w-0">
                <h2 className="truncate font-display text-base font-semibold">{n.name}</h2>
                <span className={`text-xs ${n.enabled ? "text-ok" : "text-muted"}`}>{n.enabled ? "● включена" : "○ выключена"}</span>
              </div>
              <span className="ml-auto rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] text-muted">{n.updatedAt ? "изменено" : "исходные"}</span>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
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
            <Link href={`/niches/${n.id}`} className="btn-glass inline-flex items-center gap-2 px-4 py-2 text-sm">
              Настроить <span aria-hidden>→</span>
            </Link>
          </TiltCard>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
