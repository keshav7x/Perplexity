import type { NextFunction, Request, Response } from "express";

/** Parse a raw Cookie header into a name/value map. */
export const parseCookies = (
  header: string | undefined,
): Record<string, string> => {
  const parsed: Record<string, string> = {};
  if (!header) return parsed;

  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!name) continue;
    try {
      parsed[name] = decodeURIComponent(value);
    } catch {
      parsed[name] = value;
    }
  }

  return parsed;
};

/**
 * Read a single cookie: parsed `req.cookies` jar first,
 * raw Cookie header fallback (works without cookie-parser).
 */
export const getCookie = (
  req: Request,
  name: string,
): string | undefined => {
  const jar = (req as Request & { cookies?: Record<string, unknown> })
    .cookies;
  const fromJar = jar?.[name];
  if (typeof fromJar === "string" && fromJar.length > 0) return fromJar;

  const value = parseCookies(req.header("cookie"))[name];
  return value ? value : undefined;
};

/**
 * Minimal cookie middleware (no extra dependency). Populates
 * `req.cookies` so login/requireAuth can read the JWT. Skips work
 * when another parser (e.g. cookie-parser) already ran.
 */
export const cookieParser = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const jar = req as Request & { cookies?: Record<string, string> };
  if (jar.cookies === undefined) {
    jar.cookies = parseCookies(req.header("cookie"));
  }
  next();
};
