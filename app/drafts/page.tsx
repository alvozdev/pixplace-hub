import { jobs, startedToday, type Job } from "@/lib/jobs";
import { niches } from "@/lib/niches";
import { hubStatus } from "@/lib/status";
import { GlowAvatar, Reveal } from "@/components/fx";
import { PageHead } from "@/components/page-head";
import GenerateBar from "./generate-bar";
import JobCard from "./job-card";
import AutoRefresh from "./auto-refresh";

export const dynamic = "force-dynamic";

export default async function Drafts() {
  const [all, list, status] = await Promise.all([jobs().catch(() => [] as Job[]), niches(), hubStatus()]);
  const active = all.some((j) => j.status === "generating" || j.status === "publishing");
  const visible = all.filter((j) => j.status !== "rejected").slice(0, 30);

  return (
    <div className="space-y-8">
      <PageHead title="Черновики" kicker="генерация → проверка → публикация">
        Сгенерируйте пост для ниши, проверьте варианты и опубликуйте: карусель уйдёт на портал pixPLace с аккаунта направления, альбом — в тред группы, коллаж и промпты — в Make для Pinterest.
      </PageHead>

      {!status.generator.ready && (
        <Reveal className="rounded-2xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn backdrop-blur">
          Сначала заполните в админке «Связь панели с n8n»: без неё кнопки не запустят воркфлоу.
        </Reveal>
      )}
      {status.storeError && <p className="rounded-2xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">{status.storeError}</p>}

      <GenerateBar
        niches={list.map((n) => ({
          id: n.id,
          name: n.name,
          enabled: n.enabled,
          used: startedToday(all, n.id),
          limit: n.dailyLimit,
          styles: n.format === "rotate" ? 1 : n.styles.length,
        }))}
      />

      {visible.length === 0 ? (
        <Reveal i={3} className="glass-card flex flex-col items-center gap-4 px-4 py-14 text-center">
          <GlowAvatar label="✦" size={64} />
          <p className="max-w-sm text-sm text-muted">Черновиков пока нет. Нажмите «Сгенерировать» у нужной ниши — через пару минут здесь появятся варианты.</p>
        </Reveal>
      ) : (
        <div className="space-y-4">
          {visible.map((j, i) => (
            <Reveal key={j.id} i={i + 3}>
              <JobCard job={j} nicheName={list.find((n) => n.id === j.nicheId)?.name ?? j.nicheId} />
            </Reveal>
          ))}
        </div>
      )}
      <AutoRefresh active={active} />
    </div>
  );
}
