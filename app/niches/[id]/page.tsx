import { notFound } from "next/navigation";
import { niche } from "@/lib/niches";
import NicheEditor from "./editor";

export const dynamic = "force-dynamic";

export default async function NichePage({ params }: { params: Promise<{ id: string }> }) {
  const n = await niche((await params).id);
  if (!n) notFound();
  return <NicheEditor initial={n} />;
}
