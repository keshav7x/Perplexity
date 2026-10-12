import type { ConnectionOptions } from "bullmq";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is missing");
}

const url = new URL(redisUrl);

export const queueRedisConnection: ConnectionOptions = {
  host: url.hostname,
  port: Number(url.port || 6379),
  username: url.username || "default",
  password: decodeURIComponent(url.password),
  tls: url.protocol === "rediss:" ? {} : undefined,
  maxRetriesPerRequest: null,
};
