import sharp from "sharp";
import { job } from "@/lib/jobs";

// Public grid of a draft's variants: Make sends it to Pinterest as the cover image.
// Rendered on request and cached by the CDN, so nothing has to be uploaded anywhere.
export async function GET(_: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const d = (await job(jobId))?.draft;
  if (!d) return new Response("not found", { status: 404 });

  const n = d.variants.length;
  const cols = n <= 1 ? 1 : n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  // Cells at half the generated size keep the collage close to the source resolution.
  const w = Math.round(d.width / 2);
  const h = Math.round(d.height / 2);

  const tiles = await Promise.all(
    d.variants.map(async (v, i) => {
      const res = await fetch(v.imageUrl, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`variant ${v.style}: HTTP ${res.status}`);
      const input = await sharp(Buffer.from(await res.arrayBuffer())).resize(w, h, { fit: "cover" }).toBuffer();
      return { input, left: (i % cols) * w, top: Math.floor(i / cols) * h };
    }),
  );
  const image = await sharp({ create: { width: cols * w, height: rows * h, channels: 3, background: "#ffffff" } })
    .composite(tiles)
    .jpeg({ quality: 88 })
    .toBuffer();

  return new Response(new Uint8Array(image), {
    headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=31536000, immutable" },
  });
}
