import type { Context } from "hono";

/**
 * Tiny typed HTTP error vocabulary. All routes throw HttpError; the global
 * error handler converts it to JSON with a stable shape:
 *   { error: { code, message, details? } }
 */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = "Bad request", details?: unknown) {
    return new HttpError(400, "bad_request", message, details);
  }
  static unauthorized(message = "Not signed in") {
    return new HttpError(401, "unauthorized", message);
  }
  static forbidden(message = "Forbidden") {
    return new HttpError(403, "forbidden", message);
  }
  static notFound(message = "Not found") {
    return new HttpError(404, "not_found", message);
  }
  static conflict(message = "Conflict", details?: unknown) {
    return new HttpError(409, "conflict", message, details);
  }
  static unprocessable(message = "Unprocessable", details?: unknown) {
    return new HttpError(422, "unprocessable", message, details);
  }
  static tooManyRequests(message = "Too many requests") {
    return new HttpError(429, "too_many_requests", message);
  }
}

export function sendError(c: Context, err: unknown) {
  if (err instanceof HttpError) {
    return c.json(
      { error: { code: err.code, message: err.message, details: err.details } },
      err.status as 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500,
    );
  }
  // Unknown — never leak details.
  return c.json(
    { error: { code: "internal", message: "Internal server error" } },
    500,
  );
}
