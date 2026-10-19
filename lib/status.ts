import "server-only";
import { CHANNELS, GENERATOR_ENV, type ChannelId } from "./channels";

const has = (k: string) => Boolean(process.env[k]?.trim());

export interface ChannelStatus {
  ready: boolean;
  missing: string[];
}

export function channelStatus(): Record<ChannelId, ChannelStatus> {
  return Object.fromEntries(
    CHANNELS.map((c) => {
      const missing = c.env.filter((k) => !has(k));
      return [c.id, { ready: missing.length === 0, missing }];
    }),
  ) as Record<ChannelId, ChannelStatus>;
}

export function generatorStatus(): ChannelStatus {
  const missing = GENERATOR_ENV.filter((k) => !has(k));
  return { ready: missing.length === 0, missing };
}
