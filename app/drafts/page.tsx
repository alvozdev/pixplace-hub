import { jobs, startedToday, type Job } from "@/lib/jobs";
import { niches } from "@/lib/niches";
import { hubStatus } from "@/lib/status";
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
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Черновики</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Сгенерируйте пост для ниши, проверьте 4 варианта и опубликуйте: карусель уйдёт на портал pixPLace с аккаунта направления, альбом — в тред группы, коллаж и промпты — в Make для Pinterest.
        </p>
      </div>

      {!status.generator.ready && (
        <p className="rounded-lg border border-warn/40 bg-surface px-3 py-2 text-sm text-warn">
          Сначала заполните в админке «Связь панели с n8n»: без неё кнопки не запустят воркфлоу.
        </p>
      )}
      {status.storeError && <p className="rounded-lg border border-bad/40 bg-surface px-3 py-2 text-sm text-bad">{status.storeError}</p>}

      <GenerateBar
        niches={list.map((n) => ({ id: n.id, name: n.name, enabled: n.enabled, used: startedToday(all, n.id), limit: n.dailyLimit }))}
      />

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
          Черновиков пока нет. Нажмите «Сгенерировать» у нужной ниши.
        </p>
      ) : (
        <ul className="space-y-4">
          {visible.map((j) => (
            <JobCard key={j.id} job={j} nicheName={list.find((n) => n.id === j.nicheId)?.name ?? j.nicheId} />
          ))}
        </ul>
      )}
      <AutoRefresh active={active} />
    </div>
  );
}
