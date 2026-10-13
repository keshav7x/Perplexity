import type { NextFunction, Request, Response } from "express";
import { jwtVerify } from "jose";
import { ApiResponse } from "./Response";

export interface AuthUser {
  id: number;
}

export interface AuthRequest extends Request {
  user: AuthUser;
}

/**
 * Verifies a Bearer JWT (issued with `sub` = numeric user id) and attaches
 * `req.user`. Login/signup must sign tokens with `JWT_SECRET`.
 *
 * Development-only escape hatch: when `NODE_ENV !== "production"`, an
 * `x-user-id: <id>` header is accepted so the chat/conversation/project
 * APIs can be exercised before login exists. Remove once login lands.
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

    const header = req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

    if (!token) {
      return ApiResponse.error(res, 401, "Unauthorized");
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
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
