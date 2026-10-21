import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { job, saveJob, type Draft, type Job } from "@/lib/jobs";
import { credential } from "@/lib/store";

// n8n reports generation and publishing results here. Authenticated by the shared hub token.
export async function POST(req: Request) {
  const expected = await credential("HUB_N8N_TOKEN");
  const given = req.headers.get("x-hub-token") ?? "";
  if (!expected || given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return NextResponse.json({ error: "bad token" }, { status: 401 });
  }
  const body = (await req.json()) as { jobId?: string; status?: string; draft?: Draft; error?: string; result?: Job["result"] };
  const current = body.jobId ? await job(body.jobId) : undefined;
  if (!current) return NextResponse.json({ error: "unknown job" }, { status: 404 });

  switch (body.status) {
    case "ready":
      if (!body.draft?.variants?.length) return NextResponse.json({ error: "draft without variants" }, { status: 400 });
      await saveJob({ ...current, status: "ready", draft: body.draft, error: undefined });
      break;
    case "failed":
    case "publish_failed":
      await saveJob({ ...current, status: body.status, error: body.error || "n8n не прислал описание ошибки" });
      break;
    case "published":
      await saveJob({ ...current, status: "published", result: body.result, error: undefined });
      break;
    default:
      return NextResponse.json({ error: "unknown status" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
