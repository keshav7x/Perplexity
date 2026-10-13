import type { NextFunction, Request, Response } from "express";
import { jwtVerify } from "jose";
import { ApiResponse } from "./Response";
import { getCookie } from "./cookies";

export interface AuthUser {
  id: number;
}

export interface AuthRequest extends Request {
  user: AuthUser;
}

export const AUTH_COOKIE_NAMES = ["token", "auth_token", "jwt"] as const;

const getTokenFromRequest = (req: Request): string | undefined => {
  // 1. Cookies (parsed jar, else raw Cookie header — no cookie-parser required).
  for (const name of AUTH_COOKIE_NAMES) {
    const value = getCookie(req, name);
    if (value) return value;
  }

  // 2. Bearer fallback for API clients.
  const header = req.header("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }

  return undefined;
};

/**
 * Verifies a JWT (issued with `sub` = numeric user id) and attaches
 * `req.user`. The token is read from httpOnly cookies first
 * (`token` set by POST /api/v1/auth/login), then falls back to a
 * `Authorization: Bearer <token>` header.
 *
 * Development-only escape hatch: when `NODE_ENV !== "production"`, an
 * `x-user-id: <id>` header is accepted so the chat/conversation/project
 * APIs can be exercised without login.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (process.env.NODE_ENV !== "production") {
      const devId = req.header("x-user-id");
      if (devId !== undefined) {
        const id = Number(devId);
        if (Number.isInteger(id) && id > 0) {
          (req as AuthRequest).user = { id };
          return next();
        }
        return ApiResponse.error(res, 401, "Invalid x-user-id header");
      }
    }

    const token = getTokenFromRequest(req);

    if (!token) {
      return ApiResponse.error(res, 401, "Unauthorized");
    }

    const secretValue = process.env.JWT_SECRET;
    if (!secretValue) {
      return ApiResponse.error(res, 500, "JWT secret is not configured");
    }
    const secret = new TextEncoder().encode(secretValue);
    const { payload } = await jwtVerify(token, secret);
    const id = Number(
      payload.sub ?? payload.userId ?? payload["id"],
    );

    if (!Number.isInteger(id) || id <= 0) {
      return ApiResponse.error(res, 401, "Invalid token subject");
    }

    (req as AuthRequest).user = { id };
    return next();
  } catch {
    return ApiResponse.error(res, 401, "Invalid or expired token");
  }
};
