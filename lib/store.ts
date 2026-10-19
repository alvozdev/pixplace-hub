import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { decrypt, encrypt } from "./crypto";

/**
 * Encrypted key-value store for credentials entered in the admin panel.
 * Production uses Upstash Redis over REST; local development falls back to a file.
 */
interface Backend {
  readAll(): Promise<Record<string, string>>;
  write(k: string, v: string): Promise<void>;
  remove(k: string): Promise<void>;
}

const HASH = "pixplace-hub:credentials";

function upstash(url: string, token: string): Backend {
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
      const flat: string[] = (await call(["HGETALL", HASH])) ?? [];
      const out: Record<string, string> = {};
      for (let i = 0; i < flat.length; i += 2) out[flat[i]] = flat[i + 1];
      return out;
    },
    write: async (k, v) => void (await call(["HSET", HASH, k, v])),
    remove: async (k) => void (await call(["HDEL", HASH, k])),
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

function backend(): Backend {
  const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } = process.env;
  if (url && token) return upstash(url, token);
  if (process.env.VERCEL) throw new Error("На Vercel нужна база: UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN");
  return file(path.join(process.cwd(), ".data", "credentials.json"));
}

/** Decrypted credentials. Values from the admin panel win over env vars. */
export async function credentials(): Promise<Record<string, string>> {
  const stored = await backend().readAll();
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(stored)) out[k] = decrypt(v);
  return out;
}

export async function credential(k: string): Promise<string | undefined> {
  return (await credentials())[k] || process.env[k]?.trim() || undefined;
}

export async function saveCredential(k: string, value: string) {
  await backend().write(k, encrypt(value));
}

export async function deleteCredential(k: string) {
  await backend().remove(k);
}
