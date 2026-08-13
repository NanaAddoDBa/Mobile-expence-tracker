import { createHash, randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { SESSION_TOKEN_BYTES } from "./constants";

export function hashPassword(
  password: string,
  rounds: number,
): Promise<string> {
  return hash(password, rounds);
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}

export function generateSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
