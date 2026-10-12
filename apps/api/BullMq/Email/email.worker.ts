
import { UnrecoverableError, Worker, type Job } from "bullmq";
import { queueRedisConnection } from "@api/Config/queue-redis";
import { sendEmail } from "@api/services/emailService";
import { envConfig } from "@api/Config/env.config";
import type { VerificationEmailJob } from "./email.queue"
import { sendVerifyEmail } from "./Helpers/verification-email";

export const emailWorker = new Worker<VerificationEmailJob>(
  "email",
  async (job: Job<VerificationEmailJob>) => {
    const { email, token } = job.data;

    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      throw new UnrecoverableError(
        `Invalid recipient email for job ${job.id}`,
      );
    }

    const verificationLink =
      `${envConfig.BASE_URL}/auth/verify/${encodeURIComponent(token)}`;


    console.log("Email job:", {
      jobId: job.id,
      recipient: JSON.stringify(job.data.email),
    });
    await sendVerifyEmail({
      verificationLink,
      email
    })

    console.log(`Verification email sent for job ${job.id}`);
  },
  {
    connection: queueRedisConnection,
    concurrency: 5,
  },
);

emailWorker.on("failed", (job, error) => {
  console.error(
    `Email job ${job?.id ?? "unknown"} failed:`,
    error.message,
  );
});

emailWorker.on("error", (error) => {
  console.error("Email worker error:", error);
});
