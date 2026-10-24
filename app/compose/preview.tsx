import { CHANNELS, type ChannelId, type Format } from "@/lib/channels";
import { Thumb } from "@/components/ui";

interface Props {
  channel?: ChannelId;
  format: Format;
  text: string;
  nicheName: string;
}

/** Rough mock of how the post will look on each surface. */
export default function Preview({ channel, format, text, nicheName }: Props) {
  if (!channel) {
    return (
      <div className="grid h-80 place-items-center rounded-xl border border-dashed border-line text-sm text-muted">
        Выберите хотя бы одну площадку
      </div>
    );
  }
  const c = CHANNELS.find((x) => x.id === channel)!;
  const tall = channel === "tiktok" || channel === "youtube" || (channel === "instagram" && format === "video");
  const media = format !== "text" && (
    <Thumb hue={28} format={format} className={tall ? "aspect-[9/16] w-full rounded-lg" : channel === "pinterest" ? "aspect-[2/3] w-full" : "aspect-[4/3] w-full"} />
  );

  if (channel.startsWith("telegram")) {
    return (
      <div className="rounded-xl bg-[#c9d6df] p-3">
        <div className="max-w-[300px] overflow-hidden rounded-2xl rounded-bl-sm bg-white shadow-sm">
          {media}
          <div className="space-y-1 p-3 text-sm">
            <p className="font-semibold text-[#1d8fe1]">Pix Place · {nicheName}</p>
            <p>{text}</p>
            <p className="text-right text-[10px] text-muted">{channel === "telegram-group" ? "в группе" : "в канале"} · 18:00</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2 text-xs">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 font-display text-[9px] text-ink ring-1 ring-white/20">px</span>
        <span className="font-medium">pixplace</span>
        <span className="ml-auto text-muted">{c.name}</span>
      </div>
      {media && <div className={tall ? "mx-auto max-w-[220px] p-3" : ""}>{media}</div>}
      <p className="p-3 text-sm">{text}</p>
    </div>
  );
}
