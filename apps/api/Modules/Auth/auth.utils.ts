import argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

export const AUTH_COOKIE_NAME = "token";
const JWT_EXPIRES_IN = "7d";
export const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

const getJwtSecretKey = (): Uint8Array => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
};

export const hashPassword  = async (
  password: string
): Promise<string> => {
  return argon2.hash(password);
};

export const verifyPassword = async (
  hash: string,
  plain: string,
): Promise<boolean> => {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
};

export const signAuthToken = async (userId: number): Promise<string> => {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(getJwtSecretKey());
};

export const verifyAuthToken = async (
  token: string,
): Promise<{ id: number }> => {
  const { payload } = await jwtVerify(token, getJwtSecretKey());
  const id = Number(
    payload.sub ?? payload.userId ?? (payload as Record<string, unknown>)["id"],
  );

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid token subject");
  }

  return { id };
};

export const authCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: AUTH_COOKIE_MAX_AGE_MS,
  path: "/",
});

export const generateVerificationId  = (): string => {
  return randomBytes(32).toString("hex");
};

export const hashVerificationToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};
