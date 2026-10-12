
import { Worker, type Job } from "bullmq";
import { queueRedisConnection } from "@api/Config/queue-redis";
import { sendEmail } from "@api/services/emailService";
import { envConfig } from "@api/Config/env.config";
import type { VerificationEmailJob } from "./email.queue"

export const emailWorker = new Worker<VerificationEmailJob>(
  "email",
  async (job: Job<VerificationEmailJob>) => {
    const { email, token } = job.data;

    const verificationLink =
      `${envConfig.BASE_URL}/api/verify/${encodeURIComponent(token)}`;

    await sendEmail({
      to: email,
      subject: "Verify your account",
      html: `
        <h2>Verify your email</h2>
        <p>Click the link below to verify your account.</p>
        <a href="${verificationLink}">Verify email</a>
      `,
    });

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
