import { createHash, randomBytes } from "node:crypto";

import { prisma } from "../db.js";
import { env } from "../env.js";

/**
 * Opaque session tokens.
 *  - 32 random bytes, base64url-encoded, sent to the client once.
 *  - Only sha256(token || pepper) is stored in `sessions.tokenHash`.
 *  - Lookups are by hash, so DB compromise doesn't yield usable tokens.
 */
export interface IssuedSession {
  token: string;
  sessionId: string;
  expiresAt: Date;
}

export function hashToken(token: string): string {
  return createHash("sha256")
    .update(token + env.SESSION_TOKEN_PEPPER)
    .digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function issueSession(
  userId: string,
  meta?: { userAgent?: string | null; ipAddress?: string | null },
): Promise<IssuedSession> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  const session = await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      userAgent: meta?.userAgent ?? null,
      ipAddress: meta?.ipAddress ?? null,
    },
    select: { id: true },
  });

  return { token, sessionId: session.id, expiresAt };
}

export async function revokeSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } }).catch(() => undefined);
}

export async function findUserBySessionToken(token: string) {
  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    // Best-effort cleanup; don't block the request on it.
    prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session.user;
}
