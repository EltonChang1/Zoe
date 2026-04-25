import { createHash, randomBytes } from "node:crypto";

import { env } from "../env.js";

/** Opaque URL token — only the SHA-256 digest is stored. */
export function generateRawAccountToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashAccountToken(raw: string): string {
  return createHash("sha256")
    .update(raw + env.SESSION_TOKEN_PEPPER + ":zoe-account")
    .digest("hex");
}
