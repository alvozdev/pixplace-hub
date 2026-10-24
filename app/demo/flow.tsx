"use client";
import { useEffect, useState } from "react";
import type { Draft, Job, JobStatus } from "@/lib/jobs";
import JobCard from "../drafts/job-card";

// Generated art stand-ins: a gradient, a glowing ring and the style letter.
const art = (color: string, letter: string) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="896" height="1152"><defs><radialGradient id="g" cx="30%" cy="25%" r="90%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="${color}"/><stop offset="1" stop-color="#0b0b14"/></radialGradient><linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f472b6"/><stop offset="1" stop-color="#38bdf8"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="448" cy="560" r="250" fill="none" stroke="url(#l)" stroke-width="26" opacity=".85"/><circle cx="448" cy="560" r="150" fill="#0b0b14" opacity=".55"/><text x="50%" y="53%" font-size="170" font-weight="700" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-family="sans-serif">${letter}</text></svg>`,
  );

const STYLES = [
  ["A", "Marker, sticker", "#7c3aed"],
  ["B", "Minimal character", "#0ea5e9"],
  ["C", "Art print", "#ea580c"],
  ["D", "Poster", "#16a34a"],
] as const;

const DRAFT: Draft = {
  nicheId: "clipart",
  pinId: "demo",
  sourceImageUrl: art("#475569", "REF"),
  usedRowId: 0,
  title: "Retro robot mascot sticker set",
  seoDescription: "Four takes on a friendly retro robot mascot for stickers, prints and logos.",
  altText: "Retro robot mascot",
  basePrompt: "A friendly retro robot mascot waving, bold outline, limited palette",
  variants: STYLES.map(([style, label, color]) => ({
    style,
    label,
    prompt: `${label.toLowerCase()} — friendly retro robot mascot waving, bold outline, limited palette, clean background, ultra detailed`,
    negative: "",
    seoTitle: `Robot ${style}`,
    seoDescription: "Robot sticker",
    altText: `Robot, style ${style}`,
    imageUrl: art(color, style),
    cost: 0.0042,
    seed: null,
  })),
  width: 896,
  height: 1152,
  cost: { images: 0.0168, llm: 0.004, total: 0.0208 },
  ideasLeft: 214,
  ideasTotal: 236,
};

/** Plays a draft's life on fake data: generating → ready → publishing → published, then waits for a click. */
export default function DemoFlow() {
  const [status, setStatus] = useState<JobStatus>("generating");
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (status === "generating") {
      const t = setTimeout(() => setStatus("ready"), 3800);
      return () => clearTimeout(t);
    }
    if (status === "publishing") {
      const t = setTimeout(() => setStatus("published"), 3000);
      return () => clearTimeout(t);
    }
  }, [status, run]);

  const now = new Date().toISOString();
  const job: Job = {
    id: `demo-${run}`,
    nicheId: "clipart",
    status,
    createdAt: now,
    updatedAt: now,
    draft: status === "generating" ? undefined : DRAFT,
    telegram: status === "published" ? { status: "published", url: "#" } : undefined,
    portal: status === "published" ? { status: "published", url: "#", mode: "carousel" } : undefined,
    result: status === "published" ? { telegramUrl: "#", pinterest: "sent" } : undefined,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setRun((r) => r + 1);
            setStatus("generating");
          }}
          className="btn-primary px-5 py-2.5 text-sm"
        >
          ▶ Запустить заново
        </button>
        <span className="text-xs text-muted">
          {status === "ready" ? "Нажмите «Опубликовать» в карточке — увидите публикацию и искры" : "Ничего не публикуется: это пробные данные"}
        </span>
      </div>
      <JobCard key={run} job={job} nicheName="Clipart · демо" demo={{ publish: () => setStatus("publishing"), reject: () => setStatus("rejected") }} />
    </div>
  );
}
