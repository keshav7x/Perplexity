import argon2 from "argon2";
import generateUniqueId from "generate-unique-id";
import { createHash, randomBytes } from "node:crypto";

export const hashPassword  = async (
  password: string
): Promise<string> => {
  return argon2.hash(password);
};

export const generateVerificationId  = (): string => {
  return randomBytes(32).toString("hex");
};

export const hashVerificationToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};
