import { CHANNELS, channel } from "@/lib/channels";
import { hubStatus } from "@/lib/status";
import { NICHES, QUEUE, CHARACTERS } from "@/lib/sample";
import { Jack, RouteLegend, StateBadge, FormatTag, Thumb, SampleNote, ROUTE_COLOR } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Board() {
  const hub = await hubStatus();
  const status = hub.channels;
  const gen = hub.generator;
  const connected = CHANNELS.filter((c) => status[c.id].ready).length;

  return (
    <div className="space-y-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Куда что уходит</h1>
          <p className="mt-1 text-sm text-muted">
            {NICHES.length} ниш · {CHANNELS.length} площадок · подключено {connected} из {CHANNELS.length} · генерация{" "}
            {gen.ready ? <span className="text-ok">n8n подключён</span> : <span className="text-warn">n8n не подключён</span>}
          </p>
        </div>
        <a href="/compose" className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-surface hover:opacity-90">
          Новый пост
        </a>
      </section>

      <section className="space-y-3">
        <ul className="grid gap-2 md:hidden">
          {NICHES.map((n) => (
            <li key={n.id} className="rounded-xl border border-line bg-surface p-3">
              <div className="font-medium">{n.name}</div>
              <div className="text-xs text-muted">{n.tone}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {n.channels.map((id) => {
                  const c = channel(id);
                  return (
                    <span key={id} className="flex items-center gap-1.5 rounded-md bg-bg px-2 py-1 text-xs">
                      <Jack route={c.route} live={status[id].ready} size={9} />
                      {c.name}
                    </span>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface md:block">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-56 px-4 pb-3 pt-4 text-left align-bottom font-normal text-muted">Ниша</th>
                {CHANNELS.map((c) => (
                  <th key={c.id} className="px-1 pb-3 pt-4 align-bottom font-normal" title={c.name}>
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono text-xs font-semibold" style={{ color: ROUTE_COLOR[c.route] }}>
                        {c.short}
                      </span>
                      <span className="max-w-[78px] text-center text-[11px] leading-tight text-muted">{c.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NICHES.map((n) => (
                <tr key={n.id} className="border-t border-line/70 hover:bg-bg/60">
                  <td className="px-4 py-3">
                    <div className="font-medium">{n.name}</div>
                    <div className="text-xs text-muted">{n.tone}</div>
                  </td>
                  {CHANNELS.map((c) => {
                    const wired = n.channels.includes(c.id);
                    return (
                      <td key={c.id} className="text-center">
                        {wired ? (
                          <span title={`${n.name} → ${c.name}`} className="inline-flex">
                            <Jack route={c.route} live={status[c.id].ready} />
                          </span>
                        ) : (
                          <span aria-hidden className="inline-block h-1 w-1 rounded-full bg-line" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <RouteLegend connected={connected} />
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold">Очередь</h2>
          <span className="text-xs text-muted">{QUEUE.length} поста</span>
        </div>
        <SampleNote>после подключения n8n здесь появятся посты, которые сгенерировал ваш воркфлоу.</SampleNote>
        <ul className="grid gap-3 sm:grid-cols-2">
          {QUEUE.map((p) => {
            const niche = NICHES.find((n) => n.id === p.niche)!;
            const who = CHARACTERS.find((c) => c.id === p.character);
            return (
              <li key={p.id} className="flex gap-4 rounded-xl border border-line bg-surface p-3">
                <Thumb hue={p.hue} format={p.format} className="h-28 w-24 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StateBadge state={p.state} />
                    <FormatTag format={p.format} />
                  </div>
                  <h3 className="font-medium leading-snug">{p.title}</h3>
                  <p className="text-xs text-muted">
                    {niche.name}{who ? ` · ${who.name}` : ""} · {p.when}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.channels.map((id) => {
                      const c = channel(id);
                      return (
                        <span key={id} title={c.name} className="flex items-center gap-1 rounded-md bg-bg px-1.5 py-0.5 font-mono text-[10px]">
                          <Jack route={c.route} live={status[id].ready} size={8} />
                          {c.short}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
