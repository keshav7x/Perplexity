import type { NextFunction, Request, Response } from "express";

const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

/**
 * Allowed browser origins. Override/extend via env (comma-separated):
 *   ALLOWED_ORIGINS="https://my-app.vercel.app,http://localhost:3000"
 */
const getAllowedOrigins = (): Set<string> => {
  const fromEnv = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return new Set([...DEFAULT_ORIGINS, ...fromEnv]);
};

let allowedOrigins: Set<string> | null = null;

/**
 * Minimal CORS middleware (no extra dependency).
 * Must run before routes so preflight (OPTIONS) never hits 404.
 *
 * Uses an exact echoed origin (never "*") because the client sends
 * cookies (`credentials: "include"` in apps/web/lib/api-client.ts).
 */
export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!allowedOrigins) allowedOrigins = getAllowedOrigins();

  const origin = req.header("origin");

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,X-Requested-With",
    );
    res.setHeader("Access-Control-Max-Age", "86400");
    res.setHeader("Vary", "Origin");
  }

  // Preflight: answer here, don't fall through to routes.
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
};
