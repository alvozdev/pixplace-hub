import { NextResponse } from "next/server";
import { CHANNELS } from "@/lib/channels";
import { publish, type PublishInput } from "@/lib/publish";

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<PublishInput>;
  const known = new Set(CHANNELS.map((c) => c.id));
  if (!Array.isArray(body.channels) || !body.channels.every((id) => known.has(id)) || !body.text || !body.format) {
    return NextResponse.json({ error: "Нужны channels, format и text" }, { status: 400 });
  }
  const results = await publish(body as PublishInput);
  return NextResponse.json({ results }, { status: results.every((r) => r.ok) ? 200 : 207 });
}
