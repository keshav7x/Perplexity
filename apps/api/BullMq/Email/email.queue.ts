
import { Queue } from "bullmq";
import { queueRedisConnection } from "@api/Config/queue-redis";

export type VerificationEmailJob = {
  email: string;
  token: string;
};

export const emailQueue = new Queue<VerificationEmailJob>(
  "email",
  {
    connection: queueRedisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: {
        age: 24 * 60 * 60,
        count: 1000,
      },
    },
  },
);
