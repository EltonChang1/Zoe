import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ZodError } from "zod";

import { env } from "./env.js";
import { logger } from "./logger.js";
import { HttpError, sendError } from "./http/errors.js";
import { authRouter } from "./routes/auth.js";
import { feedRouter } from "./routes/feed.js";
import { objectsRouter } from "./routes/objects.js";
import { postsRouter } from "./routes/posts.js";
import { rankingListsRouter } from "./routes/ranking-lists.js";
import { searchRouter } from "./routes/search.js";
import { shortsRouter } from "./routes/shorts.js";
import { usersRouter } from "./routes/users.js";
import type { AuthVariables } from "./auth/middleware.js";

const app = new Hono<{ Variables: AuthVariables }>();

// --- Global middleware -------------------------------------------------
app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    credentials: false,
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    maxAge: 86_400,
  }),
);

app.use("*", async (c, next) => {
  const started = Date.now();
  await next();
  logger.info(
    { method: c.req.method, path: c.req.path, status: c.res.status, ms: Date.now() - started },
    "request",
  );
});

// --- Liveness ----------------------------------------------------------
app.get("/health", (c) =>
  c.json({ ok: true, now: new Date().toISOString(), env: env.NODE_ENV }),
);

// --- API routes --------------------------------------------------------
app.route("/auth", authRouter);
app.route("/users", usersRouter);
app.route("/objects", objectsRouter);
app.route("/posts", postsRouter);
app.route("/ranking-lists", rankingListsRouter);
app.route("/search", searchRouter);
app.route("/shorts", shortsRouter);
app.route("/", feedRouter); // /feed + /activity live at the root

// --- Error handling ----------------------------------------------------
app.onError((err, c) => {
  if (err instanceof HttpError) return sendError(c, err);
  if (err instanceof ZodError) {
    return sendError(
      c,
      HttpError.unprocessable("Validation failed", err.flatten().fieldErrors),
    );
  }
  logger.error({ err }, "unhandled error");
  return sendError(c, err);
});

app.notFound((c) =>
  c.json({ error: { code: "not_found", message: "Route not found" } }, 404),
);

// --- Boot --------------------------------------------------------------
serve({ fetch: app.fetch, hostname: env.HOST, port: env.PORT }, (info) => {
  logger.info(
    { host: info.address, port: info.port, env: env.NODE_ENV },
    "zoe-server ready",
  );
});
