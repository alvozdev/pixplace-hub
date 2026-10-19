// Signed session cookie. Uses Web Crypto so it also runs in middleware.

export const SESSION_COOKIE = "hub_session";
const TTL_SECONDS = 60 * 60 * 24 * 14;

const enc = new TextEncoder();

async function hmac(data: string): Promise<string> {
  const secret = process.env.HUB_SECRET;
  if (!secret) throw new Error("HUB_SECRET не задан");
  const k = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(data)));
  return btoa(String.fromCharCode(...sig)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function createSession(): Promise<{ value: string; maxAge: number }> {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  return { value: `${exp}.${await hmac(`hub:${exp}`)}`, maxAge: TTL_SECONDS };
}

export async function verifySession(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const expected = await hmac(`hub:${exp}`);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
