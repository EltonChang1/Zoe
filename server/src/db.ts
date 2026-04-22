import { PrismaClient } from "@prisma/client";

import { env } from "./env.js";

/**
 * Single Prisma client for the process. `tsx watch` reloads keep re-creating
 * modules, so we cache the client on globalThis in dev to avoid exhausting
 * Postgres connections.
 */
declare global {
  // eslint-disable-next-line no-var
  var __zoePrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__zoePrisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalThis.__zoePrisma = prisma;
}
