import { CHANNELS, ROUTES, GENERATOR_ENV, FORMAT_LABEL, type Route } from "@/lib/channels";
import { channelStatus, generatorStatus } from "@/lib/status";
import { Jack } from "@/components/ui";

export const dynamic = "force-dynamic";

const SERVICES: { title: string; route?: Route; env: string[]; how: string }[] = [
  { title: "Генерация · n8n", env: GENERATOR_ENV, how: "n8n → Settings → n8n API: создать ключ. Вебхук — из воркфлоу генерации." },
  { title: "Telegram-бот", route: "telegram", env: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHANNEL_ID", "TELEGRAM_GROUP_ID"], how: "Создать бота в @BotFather и добавить его админом в канал и группу." },
  { title: "Make · Pinterest", route: "make", env: ["MAKE_WEBHOOK_PINTEREST"], how: "В сценарии Make с Pinterest первым модулем поставить Custom webhook и скопировать адрес." },
  { title: "Buffer", route: "buffer", env: ["BUFFER_ACCESS_TOKEN", "BUFFER_PROFILE_INSTAGRAM", "BUFFER_PROFILE_TIKTOK", "BUFFER_PROFILE_YOUTUBE", "BUFFER_PROFILE_LINKEDIN"], how: "Токен из настроек Buffer и id профилей Instagram, TikTok, YouTube, LinkedIn." },
  { title: "Портал Pix Place", route: "pixplace", env: ["PIXPLACE_API_URL", "PIXPLACE_API_KEY"], how: "Адрес API портала и ключ с правом публикации." },
];

export default function Settings() {
  const set = (k: string) => Boolean(process.env[k]?.trim());
  const status = channelStatus();
  const gen = generatorStatus();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Подключения</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Ключи хранятся в переменных окружения Vercel и никогда не попадают в браузер. Здесь видно только, задан ключ или нет.
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-2">
        {SERVICES.map((s) => {
          const done = s.env.filter(set).length;
          const ready = done === s.env.length;
          return (
            <div key={s.title} className="space-y-3 rounded-xl border border-line bg-surface p-4">
              <div className="flex items-center gap-2">
                {s.route ? <Jack route={s.route} live={ready} /> : <span className={`h-3.5 w-3.5 rounded-full ${gen.ready ? "bg-ok" : "ring-2 ring-inset ring-muted"}`} />}
                <h2 className="font-medium">{s.title}</h2>
                <span className={`ml-auto text-xs ${ready ? "text-ok" : "text-warn"}`}>
                  {ready ? "подключено" : `ключей ${done} из ${s.env.length}`}
                </span>
              </div>
              <ul className="space-y-1">
                {s.env.map((k) => (
                  <li key={k} className="flex items-center justify-between gap-3 font-mono text-[11px]">
                    <span>{k}</span>
                    <span className={set(k) ? "text-ok" : "text-muted"}>{set(k) ? "задан" : "—"}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted">{s.how}</p>
            </div>
          );
        })}
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
              {CHANNELS.map((c) => (
                <tr key={c.id} className="border-t border-line/70">
                  <td className="px-4 py-2.5 font-medium">{c.name}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <Jack route={c.route} live={status[c.id].ready} size={10} />
                      {ROUTES[c.route].label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{c.formats.length === 3 ? "все" : c.formats.map((f) => FORMAT_LABEL[f].toLowerCase()).join(", ")}</td>
                  <td className={`px-4 py-2.5 text-xs ${status[c.id].ready ? "text-ok" : "text-muted"}`}>
                    {status[c.id].ready ? "готово" : `нет: ${status[c.id].missing.join(", ")}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
