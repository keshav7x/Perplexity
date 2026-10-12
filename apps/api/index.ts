
import "dotenv/config";
import express from "express";
import { emailWorker } from "./BullMq/Email/email.worker";
import authRouter from "./Modules/Auth/auth.routes";
import { envConfig } from "./Config/env.config";
import { completeChat } from "./AI/services/completeChat";
import { chatTitlePrompt } from "./AI/PromptsTemplate/generateChatTitle";
import { generateChatTitle } from "./AI/services/generateTitle";
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());





app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    emailWorker: emailWorker.isRunning(),
  });
});

const BASE_URL="/api/v1"
app.use(`${BASE_URL}/auth`,authRouter)

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("📨 Email worker initialized");
});


async function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down...`);

  server.close(async () => {
    try {
      await emailWorker.close();
      console.log("Email worker closed");
      process.exit(0);
    } catch (error) {
      console.error("Shutdown failed:", error);
      process.exit(1);
    }
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
