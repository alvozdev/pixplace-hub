import "server-only";
import { CHANNELS, GENERATOR_ENV, type ChannelId } from "./channels";
import { credentials } from "./store";

export interface ChannelStatus {
  ready: boolean;
  missing: string[];
}

export interface HubStatus {
  channels: Record<ChannelId, ChannelStatus>;
  generator: ChannelStatus;
  /** Which credential keys are set, without their values. */
  set: Record<string, boolean>;
  storeError?: string;
}

export async function hubStatus(): Promise<HubStatus> {
  let stored: Record<string, string> = {};
  let storeError: string | undefined;
  try {
    stored = await credentials();
  } catch (e) {
    storeError = (e as Error).message;
  }
  const isSet = (k: string) => Boolean(stored[k] || process.env[k]?.trim());
  const check = (keys: string[]): ChannelStatus => {
    const missing = keys.filter((k) => !isSet(k));
    return { ready: missing.length === 0, missing };
  };
  const keys = new Set([...GENERATOR_ENV, ...CHANNELS.flatMap((c) => c.env)]);
  return {
    channels: Object.fromEntries(CHANNELS.map((c) => [c.id, check(c.env)])) as Record<ChannelId, ChannelStatus>,
    generator: check(GENERATOR_ENV),
    set: Object.fromEntries([...keys].map((k) => [k, isSet(k)])),
    storeError,
  };
}
