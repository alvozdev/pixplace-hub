import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { decrypt, encrypt } from "./crypto";

/**
 * Key-value storage: encrypted credentials from the admin panel, plus plain JSON records
 * (niche settings, generation jobs). Production uses Upstash Redis over REST; local
 * development falls back to files in .data/.
 */
interface Backend {
  readAll(): Promise<Record<string, string>>;
  write(k: string, v: string): Promise<void>;
  remove(k: string): Promise<void>;
}

const CREDENTIALS = "credentials";

function upstash(url: string, token: string, hash: string): Backend {
  const call = async (cmd: (string | number)[]) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify(cmd),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
    return (await res.json()).result;
  };
  return {
    async readAll() {
      const flat: string[] = (await call(["HGETALL", hash])) ?? [];
      const out: Record<string, string> = {};
      for (let i = 0; i < flat.length; i += 2) out[flat[i]] = flat[i + 1];
      return out;
    },
    write: async (k, v) => void (await call(["HSET", hash, k, v])),
    remove: async (k) => void (await call(["HDEL", hash, k])),
  };
}

function file(p: string): Backend {
  const read = async () => {
    try {
      return JSON.parse(await fs.readFile(p, "utf8")) as Record<string, string>;
    } catch {
      return {};
    }
  };
  const save = async (data: Record<string, string>) => {
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, JSON.stringify(data, null, 2), { mode: 0o600 });
  };
  return {
    readAll: read,
    write: async (k, v) => save({ ...(await read()), [k]: v }),
    remove: async (k) => {
      const d = await read();
      delete d[k];
      await save(d);
    },
  };
}

function backend(name: string): Backend {
  // Upstash connected through the Vercel Marketplace exposes KV_REST_API_*; a direct Upstash setup uses UPSTASH_*.
  const env = process.env;
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (url && token) return upstash(url, token, `pixplace-hub:${name}`);
  if (env.VERCEL) throw new Error("Подключите базу Upstash Redis в Vercel: Storage → Upstash → Connect");
  return file(path.join(process.cwd(), ".data", `${name}.json`));
}

/** Decrypted credentials. Values from the admin panel win over env vars. */
export async function credentials(): Promise<Record<string, string>> {
  const stored = await backend(CREDENTIALS).readAll();
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(stored)) out[k] = decrypt(v);
  return out;
}

export async function credential(k: string): Promise<string | undefined> {
  return (await credentials())[k] || process.env[k]?.trim() || undefined;
}

export async function saveCredential(k: string, value: string) {
  await backend(CREDENTIALS).write(k, encrypt(value));
}

export async function deleteCredential(k: string) {
  await backend(CREDENTIALS).remove(k);
}

/** A named collection of JSON records, e.g. "niches" or "jobs". */
export function collection<T>(name: string) {
  const b = () => backend(name);
  return {
    async all(): Promise<T[]> {
      return Object.values(await b().readAll()).map((v) => JSON.parse(v) as T);
    },
    async get(id: string): Promise<T | undefined> {
      const v = (await b().readAll())[id];
      return v ? (JSON.parse(v) as T) : undefined;
    },
    put: (id: string, value: T) => b().write(id, JSON.stringify(value)),
    remove: (id: string) => b().remove(id),
  };
}
