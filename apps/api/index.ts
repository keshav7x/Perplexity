
import "dotenv/config";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { ZodError } from "zod";
import { emailWorker } from "./BullMq/Email/email.worker";
import authRouter from "./Modules/Auth/auth.routes";
import chatRouter from "./Modules/Chat/chat.routes";
import conversationRouter from "./Modules/conversation/conversation.routes";
import projectRouter from "./Modules/Project/project.routes";
import { ApiResponse } from "./shared/Response";

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

const BASE_URL = "/api/v1";
app.use(`${BASE_URL}/auth`, authRouter);
app.use(`${BASE_URL}/chat`, chatRouter);
app.use(`${BASE_URL}/conversations`, conversationRouter);
app.use(`${BASE_URL}/projects`, projectRouter);

// Global error handler (must be registered after all routes).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return ApiResponse.error(res, 400, "Validation failed", err.issues);
  }

  if (err instanceof Error) {
    const message = err.message || "Something went wrong";
    const status = /not found/i.test(message)
      ? 404
      : /unauthorized|invalid.*token|expired/i.test(message)
        ? 401
        : 400;
    return ApiResponse.error(res, status, message);
  }

  return ApiResponse.error(res, 500, "Internal server error");
});

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
