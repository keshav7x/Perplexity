import { createClient } from "redis";
import { envConfig } from "./env.config";

const redisUrl = envConfig.REDIS_URL

if (!redisUrl) {
  throw new Error("REDIS_URL is not configured");
}

export const redis = createClient({
  url: redisUrl,
});

redis.on("error", (error:any) => {
  console.error("Redis connection error:", error);
});

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }

  console.log("Redis connected successfully");
}
