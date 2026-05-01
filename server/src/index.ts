import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ZodError } from "zod";

import { env } from "./env.js";
import { logger } from "./logger.js";
import { HttpError, sendError } from "./http/errors.js";
import { authRouter } from "./routes/auth.js";
import { connectedAccountsRouter } from "./routes/connected-accounts.js";
import { feedRouter } from "./routes/feed.js";
import { musicRouter } from "./routes/music.js";
import { notificationsRouter } from "./routes/notifications.js";
import { objectsRouter } from "./routes/objects.js";
import { postsRouter } from "./routes/posts.js";
import { placesRouter } from "./routes/places.js";
import { pushTokensRouter } from "./routes/push-tokens.js";
import { rankHubRouter } from "./routes/rank-hub.js";
import { rankingListsRouter } from "./routes/ranking-lists.js";
import { reportsRouter } from "./routes/reports.js";
import { restaurantsRouter } from "./routes/restaurants.js";
import { searchRouter } from "./routes/search.js";
import { shortsRouter } from "./routes/shorts.js";
import { uploadsRouter } from "./routes/uploads.js";
import { myBlocksRouter, usersRouter } from "./routes/users.js";
import type { AuthVariables } from "./auth/middleware.js";

const app = new Hono<{ Variables: AuthVariables }>();

// --- Global middleware -------------------------------------------------
app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    credentials: false,
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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
app.route("/connected-accounts", connectedAccountsRouter);
// `/users/me/...` must be registered BEFORE `/users/:handle` so the
// static-segment route wins over the parameterised one. Hono matches in
// registration order.
app.route("/users", myBlocksRouter);
app.route("/users", usersRouter);
app.route("/objects", objectsRouter);
app.route("/music", musicRouter);
app.route("/places", placesRouter);
app.route("/posts", postsRouter);
app.route("/push-tokens", pushTokensRouter);
app.route("/rank-hub", rankHubRouter);
app.route("/ranking-lists", rankingListsRouter);
app.route("/reports", reportsRouter);
app.route("/restaurants", restaurantsRouter);
app.route("/search", searchRouter);
app.route("/shorts", shortsRouter);
app.route("/uploads", uploadsRouter);
app.route("/notifications", notificationsRouter);
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
