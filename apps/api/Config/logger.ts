
import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),

  redact: {
    paths: [
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "apiKey",
      "authorization",
      "headers.authorization",
    ],
    censor: "[REDACTED]",
  },

  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }),
});
