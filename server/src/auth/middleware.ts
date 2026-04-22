import type { MiddlewareHandler } from "hono";
import type { User } from "@prisma/client";

import { HttpError } from "../http/errors.js";
import { findUserBySessionToken } from "./session.js";

export type AuthVariables = {
  user: User | null;
};

function extractToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

/**
 * Attaches `c.var.user` (possibly null). Use for endpoints that behave
 * differently based on whether a viewer is signed in — e.g. Feed showing
 * `likedByMe` flags.
 */
export const optionalAuth: MiddlewareHandler<{ Variables: AuthVariables }> =
  async (c, next) => {
    const token = extractToken(c.req.header("authorization"));
    const user = token ? await findUserBySessionToken(token) : null;
    c.set("user", user);
    await next();
  };

/**
 * Requires a valid session; throws 401 otherwise. Routes downstream can
 * safely non-null-assert `c.var.user`.
 */
export const requireAuth: MiddlewareHandler<{ Variables: AuthVariables }> =
  async (c, next) => {
    const token = extractToken(c.req.header("authorization"));
    if (!token) throw HttpError.unauthorized();
    const user = await findUserBySessionToken(token);
    if (!user) throw HttpError.unauthorized("Session expired or invalid");
    c.set("user", user);
    await next();
  };

export function currentUser(c: { var: AuthVariables }): User {
  const user = c.var.user;
  if (!user) throw HttpError.unauthorized();
  return user;
}
