import { SERVICES } from "@/lib/credentials";
import { CHANNELS, ROUTES, FORMAT_LABEL } from "@/lib/channels";
import { credentials } from "@/lib/store";
import { hubStatus } from "@/lib/status";
import { Jack } from "@/components/ui";
import ServiceCard from "./service-card";

export const dynamic = "force-dynamic";

function mask(v: string, secret: boolean) {
  if (!secret) return v;
  return v.length <= 8 ? "••••" : `••••${v.slice(-4)}`;
}

export default async function Admin() {
  const status = await hubStatus();
  const stored = await credentials().catch(() => ({}) as Record<string, string>);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Админка</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Подключайте площадки здесь. Ключи шифруются и хранятся на сервере; после сохранения видны только последние четыре символа.
        </p>
      </div>
      {status.storeError && (
        <p className="rounded-lg border border-bad/40 bg-surface px-3 py-2 text-sm text-bad">Хранилище ключей недоступно: {status.storeError}</p>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {SERVICES.map((s) => (
          <ServiceCard
            key={s.id}
            service={s}
            current={Object.fromEntries(
              s.fields.map((f) => {
                const v = (stored as Record<string, string>)[f.key];
                if (v) return [f.key, { shown: mask(v, f.secret), source: "admin" as const }];
                if (status.set[f.key]) return [f.key, { shown: "задан в окружении", source: "env" as const }];
                return [f.key, null];
              }),
            )}
          />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Маршруты площадок</h2>
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-normal">Площадка</th>
                <th className="px-4 py-3 font-normal">Через что</th>
                <th className="px-4 py-3 font-normal">Форматы</th>
                <th className="px-4 py-3 font-normal">Статус</th>
              </tr>
            </thead>
            <tbody>
              {CHANNELS.map((c) => {
                const st = status.channels[c.id];
                return (
                  <tr key={c.id} className="border-t border-line/70">
                    <td className="px-4 py-2.5 font-medium">{c.name}</td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2">
                        <Jack route={c.route} live={st.ready} size={10} />
                        {ROUTES[c.route].label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      {c.formats.length === 3 ? "все" : c.formats.map((f) => FORMAT_LABEL[f].toLowerCase()).join(", ")}
                    </td>
                    <td className={`px-4 py-2.5 text-xs ${st.ready ? "text-ok" : "text-muted"}`}>
                      {st.ready ? "готово" : `не хватает: ${st.missing.length}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
